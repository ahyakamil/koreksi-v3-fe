export interface User {
  id: string
  name: string
  username: string
  email: string
  username_changed_at?: string
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
  youtube_video?: string
  instagram_video?: string
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
  users_count?: number
  spaces_count?: number
  is_premium_enabled?: boolean
  daily_price?: number
  weekly_price?: number
  monthly_price?: number
  my_role?: string | null
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
  organization?: Organization
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
  youtube_video?: string
  can_access?: boolean
  page_number?: number
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

export interface DonationCampaign {
  id: string
  title: string
  description?: string
  target_amount?: number
  current_amount: number
  organization_id: string
  sticky: boolean
  end_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
  organization?: Organization
  transactions?: DonationTransaction[]
  transactions_count?: number
  progress_percentage?: number
  is_completed?: boolean
  is_expired?: boolean
}

export interface DonationTransaction {
  id: string
  donation_campaign_id: string
  user_id: string
  amount: number
  midtrans_order_id?: string
  status: 'pending' | 'paid' | 'failed' | 'expired'
  payment_data?: any
  paid_at?: string
  created_at: string
  updated_at: string
  campaign?: DonationCampaign
  user?: User
}

export interface DonationAudit {
  id: string
  donation_transaction_id?: string
  type: 'debit' | 'credit'
  amount: number
  description?: string
  reference_transaction_id?: string
  created_at: string
  transaction?: DonationTransaction
  referenceTransaction?: DonationTransaction
}

export interface Subscription {
  id: string
  organization_id: string
  user_id: string
  plan: 'daily' | 'weekly' | 'monthly'
  start_date: string
  end_date: string
  status: 'active' | 'pending' | 'cancelled' | 'expired'
  created_at: string
  updated_at: string
  organization?: Organization
  user?: User
  amount?: number
}

export interface Payment {
  id: string
  subscription_id: string
  amount: number
  currency: string
  transaction_id?: string
  order_id?: string
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  payment_response?: any
  created_at: string
  updated_at: string
  subscription?: Subscription
}

export interface WithdrawalDetail {
  id: number
  fee_type: string
  requested_amount: number
  fee_amount: number
  received_amount: number
  created_at: string
  updated_at: string
}

export interface SubscriptionWithdrawalRequest {
  id: string
  organization_id: string
  requested_by: string
  amount: number
  bank_name: string
  account_number: string
  account_holder_name: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
  requester?: User
  approver?: User
  withdrawal_details?: WithdrawalDetail[]
}

export interface ApiResponse {
  ok: boolean
  status: number
  body: any
}