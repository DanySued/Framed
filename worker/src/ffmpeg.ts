import ffmpeg from 'fluent-ffmpeg'
import fs from 'node:fs'
import path from 'node:path'
import type { TimelineSegment } from './types.js'

// Download a URL to a local file
async function download(url: string, dest: string): Promise<void> {
  const { default: fetch } = await import('node-fetch')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`)
  const buf = await res.arrayBuffer()
  fs.writeFileSync(dest, Buffer.from(buf))
}

// Get the best-quality MP4 download URL for a Pexels video
async function getPexelsDownloadUrl(pexelsVideoId: string): Promise<string> {
  const res = await (await import('node-fetch')).default(
    `https://api.pexels.com/videos/videos/${pexelsVideoId}`,
    { headers: { Authorization: process.env.PEXELS_API_KEY! } }
  )
  if (!res.ok) throw new Error(`Pexels video lookup failed: ${res.status}`)
  const data = (await res.json()) as any
  const files: any[] = data.video_files ?? []
  const mp4 = files
    .filter((f: any) => f.file_type === 'video/mp4' && f.width <= 1080)
    .sort((a: any, b: any) => (b.width ?? 0) - (a.width ?? 0))
  const best = mp4[0] ?? files[0]
  if (!best?.link) throw new Error('No downloadable file found on Pexels')
  return best.link
}

export async function renderTimeline(
  segments: TimelineSegment[],
  workDir: string,
  outputPath: string,
  onProgress: (pct: number) => void
): Promise<void> {
  // 1. Download / locate each segment
  const localPaths: string[] = []
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const dest = path.join(workDir, `clip_${i}.mp4`)
    if (seg.storage_path) {
      // Download from Supabase Storage
      const { supabase } = await import('./supabase.js')
      const { data, error } = await supabase.storage
        .from('framed-clips')
        .download(seg.storage_path)
      if (error) throw new Error(`Storage download failed: ${error.message}`)
      const buf = Buffer.from(await data.arrayBuffer())
      fs.writeFileSync(dest, buf)
    } else if (seg.pexels_download_url) {
      await download(seg.pexels_download_url, dest)
    } else {
      throw new Error(`Segment ${i} has no source`)
    }
    localPaths.push(dest)
    onProgress(Math.round(((i + 1) / segments.length) * 40)) // 0–40% = download
  }

  // 2. Build trim filter for each segment
  // Use concat demuxer for simplicity and reliability
  const listFile = path.join(workDir, 'concat.txt')
  const trimmedPaths: string[] = []

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const src = localPaths[i]
    const trimmed = path.join(workDir, `trimmed_${i}.mp4`)
    trimmedPaths.push(trimmed)

    await new Promise<void>((resolve, reject) => {
      ffmpeg(src)
        .setStartTime(seg.trim_start)
        .duration(seg.trim_end - seg.trim_start)
        // Re-encode to ensure consistent codec/resolution for concat
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('1080x1920') // portrait 9:16
        .outputOptions(['-preset fast', '-crf 22', '-movflags +faststart'])
        .output(trimmed)
        .on('end', resolve)
        .on('error', reject)
        .run()
    })
    onProgress(40 + Math.round(((i + 1) / segments.length) * 50)) // 40–90%
  }

  // 3. Write concat list
  const listContent = trimmedPaths.map((p) => `file '${p}'`).join('\n')
  fs.writeFileSync(listFile, listContent)

  // 4. Concat to output
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
