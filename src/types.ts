export interface ProjectConfig {
  projectId: string
  dataset: string
  token?: string
}

export interface CurrentUser {
  id: string
  name: string
  profileImage?: string
}
