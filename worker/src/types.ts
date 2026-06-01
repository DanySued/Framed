export interface TimelineSegment {
  clip_id: string
  storage_path: string | null   // null = Pexels source (download by URL)
  pexels_download_url: string | null
  trim_start: number
  trim_end: number
  order_index: number
  width: number
  height: number
}

export interface RenderJobPayload {
  job_id: string
  project_id: string
  timeline: TimelineSegment[]
}
