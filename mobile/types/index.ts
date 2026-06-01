export type ProjectStatus = 'draft' | 'rendering' | 'done' | 'failed'
export type ClipSource = 'pexels' | 'upload'
export type Tempo = 'slow' | 'medium' | 'fast'
export type JobStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface Project {
  id: string
  user_id: string
  title: string
  status: ProjectStatus
  created_at: string
  updated_at: string
  thumbnail_url?: string
}

export interface Clip {
  id: string
  project_id: string
  source: ClipSource
  pexels_id?: number
  storage_path?: string
  preview_url: string
  width: number
  height: number
  original_duration: number
  trim_start: number
  trim_end: number
  order_index: number
}

export interface Render {
  id: string
  project_id: string
  storage_path: string
  public_url: string
  duration: number
  created_at: string
}

export interface Preferences {
  id: string
  user_id: string
  tags: string[]
  tempo: Tempo
  mood: string[]
  clip_duration: number
  total_duration: number
}

export interface RenderJob {
  id: string
  project_id: string
  status: JobStatus
  progress: number
  error?: string
  created_at: string
  completed_at?: string
}

export interface TimelineSegment {
  clip_id: string
  storage_path: string
  trim_start: number
  trim_end: number
  order_index: number
}

export interface PexelsVideo {
  id: number
  url: string
  image: string
  duration: number
  width: number
  height: number
  video_files: Array<{
    id: number
    quality: string
    file_type: string
    width: number
    height: number
    link: string
  }>
}
