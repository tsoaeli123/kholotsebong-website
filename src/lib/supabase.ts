import { createClient } from '@supabase/supabase-js'

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type Service = {
  id: string
  title: string
  description: string
  image_url: string
  icon: string
  active: boolean
  sort_order: number
}

export type Program = {
  id: string
  code: string
  title: string
  description: string
  active: boolean
  sort_order: number
}

export type SiteSettings = {
  id: string
  hero_headline: string
  about_text: string
  footer_copy: string
  phone: string
  email: string
  address: string
}

export type Article = {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string
  image_url: string
  status: 'draft' | 'published'
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      services: Table<Service, Omit<Service, 'id'> & { id?: string }>
      programs: Table<Program, Omit<Program, 'id'> & { id?: string }>
      articles: Table<
        Article,
        {
          id?: string
          title: string
          slug: string
          excerpt: string
          body: string
          image_url: string
          status: 'draft' | 'published'
        }
      >
      enquiries: Table<
        {
          id: string
          name: string
          email: string
          service: string
          message: string
          status: 'new' | 'contacted' | 'closed'
          created_at: string
        },
        {
          id?: string
          name: string
          email: string
          service: string
          message: string
          status?: 'new' | 'contacted' | 'closed'
        },
        { status: 'new' | 'contacted' | 'closed' }
      >
      site_settings: Table<SiteSettings, SiteSettings>
      newsletter_subscribers: Table<
        { id: string; email: string; created_at: string },
        { id?: string; email: string }
      >
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null
