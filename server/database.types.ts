export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          created_at: string | null
          updated_at: string | null
          username: string
          password: string
          email: string | null
          first_name: string | null
          last_name: string | null
          profile_image_url: string | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          updated_at?: string | null
          username: string
          password: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          profile_image_url?: string | null
        }
        Update: {
          id?: number
          created_at?: string | null
          updated_at?: string | null
          username?: string
          password?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          profile_image_url?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          sid: string
          sess: Json
          expire: string
        }
        Insert: {
          sid: string
          sess: Json
          expire: string
        }
        Update: {
          sid?: string
          sess?: Json
          expire?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}