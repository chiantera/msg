export interface Profile {
  id: string
  display_name: string
  push_subscription: PushSubscriptionJSON | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  sender_id: string
  content: string | null
  photo_url: string | null
  silent: boolean
  read_at: string | null
  created_at: string
  profiles?: Pick<Profile, 'id' | 'display_name'>
}
