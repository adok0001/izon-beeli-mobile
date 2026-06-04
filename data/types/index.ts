export type Role = 'org_admin' | 'project_manager' | 'reviewer' | 'contributor'
export type TaskType = 'translation' | 'sentence_collection'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'flagged'
export type Tier = 'community' | 'professional' | 'organization'

export interface Org {
  id: string
  name: string
  slug: string
  tier: Tier
  owner_id: string
  created_at: string
}

export interface Project {
  id: string
  org_id: string
  name: string
  description: string | null
  language_name: string
  language_code: string
  task_type: TaskType
  is_public: boolean
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  source_text: string
  source_language: string
  created_at: string
}

export interface Submission {
  id: string
  task_id: string
  project_id: string
  contributor_id: string
  text: string
  status: SubmissionStatus
  reviewer_note: string | null
  reviewed_at: string | null
  created_at: string
  task?: Task
}

export interface ExportRow {
  source_text: string
  source_language: string
  translation: string
  target_language: string
  contributor_id: string
  reviewed_at: string
}
