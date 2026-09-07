export type Role = 'Administrador' | 'Editor' | 'Leitor'

export type Attachment = {
  name: string
  size: string
  url?: string
}

export type Visibility = 'shared' | 'private'

export type Tag = {
  id: number
  name: string
}

export type Prompt = {
  id: number
  title: string
  description: string
  tags: Tag[]
  content: string
  purpose: string
  whenToUse: string
  owner: string
  ownerId: number
  favorite: boolean
  visibility: Visibility
  attachments: Attachment[]
}

export type PromptVersion = {
  id: number
  title: string
  description: string
  content: string
  purpose: string
  whenToUse: string
  editedBy: string | null
  createdAt: string
}

export type User = {
  id: number
  name: string
  email: string
  role: Role
}
