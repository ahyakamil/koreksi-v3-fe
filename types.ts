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
  comments_count?: number
}

export interface Comment {
  id: string
  user?: User
  created_at: string
  content: string
  parent_id?: string
  replies_count?: number
}

export interface Pageable {
  pageNumber: number
  totalPages: number
  totalElements?: number
}

export interface Notification {
  id: string
  created_at: string
  read_at: string | null
  data: {
    type: 'friend_request' | 'comment' | 'reply'
    friendship_id?: string
    from_user_id: string
    from_user_name: string
    message: string
    commentable_type?: 'post' | 'news'
    commentable_id?: string
    comment_id?: string
  }
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

export interface Space {
  id: string
  organization_id: string
  name: string
  description?: string
  image?: string
  created_at: string
}

export interface News {
  public_id: string
  organization_id: string
  space_id: string
  user_id: string
  editor_id?: string
  publisher_id?: string
  title: string
  content: string
  image?: string
  caption?: string
  status: 'draft' | 'need_review' | 'published' | 'rejected'
  review_notes?: string
  published_at?: string
  created_at: string
  space?: Space
  organization?: Organization
  user?: User
  editor?: User
  publisher?: User
  comments_count?: number
}

export interface Message {
  id: number
  sender_id: string
  receiver_id: string
  encrypted_content: string
  encrypted_key: string
  iv: string
  sent_at: string
  read_at: string | null
  created_at: string
  content?: string
  decryptedContent?: string
}