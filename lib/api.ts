import type { Attachment, Category, Prompt, Role, User } from '@/lib/types'

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Erro ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function postJson(url: string, body: unknown, method: string = 'POST') {
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function getPrompts(): Promise<Prompt[]> {
  return fetch('/api/prompts').then((res) => handle(res))
}

type PromptInput = {
  title: string
  description: string
  category: string
  content: string
  purpose: string
  whenToUse: string
}

export function createPrompt(input: PromptInput & { attachments: Attachment[] }): Promise<Prompt> {
  return postJson('/api/prompts', input).then((res) => handle(res))
}

export function updatePrompt(id: number, input: PromptInput): Promise<Prompt> {
  return postJson(`/api/prompts/${id}`, input, 'PATCH').then((res) => handle(res))
}

export function deletePrompt(id: number): Promise<void> {
  return fetch(`/api/prompts/${id}`, { method: 'DELETE' }).then((res) => handle(res))
}

export function toggleFavorite(id: number, favorite: boolean): Promise<Prompt> {
  return postJson(`/api/prompts/${id}/favorite`, { favorite }, 'PATCH').then((res) => handle(res))
}

export function getCategories(): Promise<Category[]> {
  return fetch('/api/categories').then((res) => handle(res))
}

export function createCategory(name: string): Promise<Category> {
  return postJson('/api/categories', { name }).then((res) => handle(res))
}

export function deleteCategory(id: number): Promise<void> {
  return fetch(`/api/categories/${id}`, { method: 'DELETE' }).then((res) => handle(res))
}

export function getUsers(): Promise<User[]> {
  return fetch('/api/users').then((res) => handle(res))
}

export function createUser(input: { name: string; email: string; role: Role; password: string }): Promise<User> {
  return postJson('/api/users', input).then((res) => handle(res))
}

export function updateUser(id: number, input: { name: string; email: string; role: Role }): Promise<User> {
  return postJson(`/api/users/${id}`, input, 'PATCH').then((res) => handle(res))
}

export function deleteUser(id: number): Promise<void> {
  return fetch(`/api/users/${id}`, { method: 'DELETE' }).then((res) => handle(res))
}

export function changePassword(input: { current: string; next: string; confirm: string }): Promise<{ ok: true }> {
  return postJson('/api/users/me/password', input, 'PATCH').then((res) => handle(res))
}
