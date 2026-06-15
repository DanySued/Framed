import ffmpeg from 'fluent-ffmpeg'
import fs from 'node:fs'
import path from 'node:path'
import type { TimelineSegment } from './types.js'

async function download(url: string, dest: string): Promise<void> {
  const { default: fetch } = await import('node-fetch')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`)
  const buf = await res.arrayBuffer()
  fs.writeFileSync(dest, Buffer.from(buf))
}

export async function renderTimeline(
  segments: TimelineSegment[],
  workDir: string,
  outputPath: string,
  onProgress: (pct: number) => void
): Promise<void> {
  // 1. Download all segments in parallel (0–40%)
  const localPaths: string[] = new Array(segments.length).fill('')
  let downloaded = 0
  await Promise.all(
    segments.map(async (seg, i) => {
      const dest = path.join(workDir, `clip_${i}.mp4`)
      if (seg.storage_path) {
        const { supabase } = await import('./supabase.js')
        const { data, error } = await supabase.storage
          .from('framed-clips')
          .download(seg.storage_path)
        if (error) throw new Error(`Storage download failed: ${error.message}`)
        fs.writeFileSync(dest, Buffer.from(await data.arrayBuffer()))
      } else if (seg.pexels_download_url) {
        await download(seg.pexels_download_url, dest)
      } else {
        throw new Error(`Segment ${i} has no source`)
      }
      localPaths[i] = dest
      downloaded++
      onProgress(Math.round((downloaded / segments.length) * 40))
    })
  )

  // 2. Trim all segments in parallel (40–90%) — ultrafast preset cuts encode time ~3x
  const trimmedPaths: string[] = new Array(segments.length).fill('')
  let trimmed = 0
  await Promise.all(
    segments.map(async (seg, i) => {
      const out = path.join(workDir, `trimmed_${i}.mp4`)
      trimmedPaths[i] = out

      await new Promise<void>((resolve, reject) => {
        ffmpeg(localPaths[i])
          .setStartTime(seg.trim_start)
          .duration(seg.trim_end - seg.trim_start)
          .videoCodec('libx264')
          .audioCodec('aac')
          .size('1080x1920')
          .outputOptions(['-preset ultrafast', '-crf 23', '-movflags +faststart'])
          .output(out)
          .on('end', resolve)
          .on('error', reject)
          .run()
      })
      trimmed++
      onProgress(40 + Math.round((trimmed / segments.length) * 50))
    })
  )

  // 3. Concat to final output via stream copy (90–100%)
  const listFile = path.join(workDir, 'concat.txt')
  fs.writeFileSync(listFile, trimmedPaths.map((p) => `file '${p}'`).join('\n'))

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(listFile)
      .inputOptions(['-f concat', '-safe 0'])
      .videoCodec('copy')
      .audioCodec('copy')
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run()
  })

  onProgress(100)
}
