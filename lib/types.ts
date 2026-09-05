export type Role = 'Administrador' | 'Editor' | 'Leitor'

export type Attachment = {
  name: string
  size: string
}

export type Prompt = {
  id: number
  title: string
  description: string
  category: string
  content: string
  owner: string
  ownerId: number
  favorite: boolean
  attachments: Attachment[]
}

export type Category = {
  id: number
  name: string
}

export type User = {
  id: number
  name: string
  email: string
  role: Role
}
