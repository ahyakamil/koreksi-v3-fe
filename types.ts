export interface User {
  id: string
  name: string
  email: string
}

export interface Media {
  id: string
  url: string
  type: 'main' | 'additional'
  order: number
}

export interface Post {
  public_id: string
  user?: User
  created_at: string
  title?: string
  content: string
  medias?: Media[]
}

export interface Comment {
  id: string
  user?: User
  created_at: string
  content: string
}

export interface Pageable {
  pageNumber: number
  totalPages: number
  totalElements?: number
}

export interface Notification {
  id: string
  created_at: string
  data: any
}

export interface Friendship {
  friendship_id: string
  user: User
}

export interface FriendRequest {
  id: string
  user: User
}

export interface Organization {
  id: string
  title: string
  description?: string
  image?: string
  verified: boolean
  created_at: string
  users?: OrganizationUser[]
}

export interface OrganizationUser {
  id: string
  name: string
  email: string
  pivot: {
    role: 'admin' | 'editor' | 'author' | 'user'
  }
}