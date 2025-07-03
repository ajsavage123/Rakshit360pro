
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

if (supabaseUrl === 'your-supabase-url' || supabaseKey === 'your-supabase-anon-key') {
  console.warn('⚠️ Please add your Supabase credentials to .env file:')
  console.warn('VITE_SUPABASE_URL=your_supabase_project_url')
  console.warn('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface Database {
  public: {
    Tables: {
      hospitals: {
        Row: {
          id: string
          name: string
          address: string
          phone: string
          specialty: string[]
          opening_hours: string
          latitude: number
          longitude: number
          rating: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          phone: string
          specialty: string[]
          opening_hours: string
          latitude: number
          longitude: number
          rating?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          phone?: string
          specialty?: string[]
          opening_hours?: string
          latitude?: number
          longitude?: number
          rating?: number
          created_at?: string
        }
      }
    }
  }
}
