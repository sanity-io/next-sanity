export interface ProjectConfig {
  projectId: string
  dataset: string
}

export interface ClientConfig extends ProjectConfig {
  token?: string
  useCdn?: boolean
}
