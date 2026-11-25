// Generated from live project ijkazeukjooauwsvwtiq via Supabase MCP generate_typescript_types. Do not edit by hand.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          confidence: number | null
          created_at: string
          created_by: string | null
          description: string
          evidence: Json
          generated_by: string
          id: string
          kind: string
          period_end: string | null
          period_start: string | null
          product_id: string | null
          recommendation_type: string
          status: string
          title: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          description: string
          evidence?: Json
          generated_by?: string
          id?: string
          kind?: string
          period_end?: string | null
          period_start?: string | null
          product_id?: string | null
          recommendation_type: string
          status?: string
          title: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          evidence?: Json
          generated_by?: string
          id?: string
          kind?: string
          period_end?: string | null
          period_start?: string | null
          product_id?: string | null
          recommendation_type?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json
          path: string | null
          product_id: string | null
          session_hash: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json
          path?: string | null
          product_id?: string | null
          session_hash?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json
          path?: string | null
          product_id?: string | null
          session_hash?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          translations: Json
          body: string | null
          cover_path: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          translations?: Json
          body?: string | null
          cover_path?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          translations?: Json
          body?: string | null
          cover_path?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      content_assets: {
        Row: {
          asset_type: string
          checksum_sha256: string | null
          content_project_id: string | null
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          height: number | null
          id: string
          metadata: Json
          mime_type: string | null
          product_id: string | null
          render_job_id: string | null
          status: string
          storage_path: string | null
          title: string | null
          width: number | null
        }
        Insert: {
          asset_type: string
          checksum_sha256?: string | null
          content_project_id?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          product_id?: string | null
          render_job_id?: string | null
          status?: string
          storage_path?: string | null
          title?: string | null
          width?: number | null
        }
        Update: {
          asset_type?: string
          checksum_sha256?: string | null
          content_project_id?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          product_id?: string | null
          render_job_id?: string | null
          status?: string
          storage_path?: string | null
          title?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_assets_content_project_id_fkey"
            columns: ["content_project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_assets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_assets_render_job_fk"
            columns: ["render_job_id"]
            isOneToOne: false
            referencedRelation: "render_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          caption: string | null
          channel: string
          content_project_id: string | null
          id: string
          product_id: string | null
          scheduled_at: string | null
          status: string
        }
        Insert: {
          caption?: string | null
          channel: string
          content_project_id?: string | null
          id?: string
          product_id?: string | null
          scheduled_at?: string | null
          status?: string
        }
        Update: {
          caption?: string | null
          channel?: string
          content_project_id?: string | null
          id?: string
          product_id?: string | null
          scheduled_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_content_project_id_fkey"
            columns: ["content_project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      content_projects: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          audience: string | null
          brief: Json
          channel: string | null
          content_type: string
          copy_draft: Json
          created_at: string
          created_by: string | null
          id: string
          objective: string | null
          product_id: string | null
          status: string
          title: string
          tone: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          audience?: string | null
          brief?: Json
          channel?: string | null
          content_type: string
          copy_draft?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          objective?: string | null
          product_id?: string | null
          status?: string
          title: string
          tone?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          audience?: string | null
          brief?: Json
          channel?: string | null
          content_type?: string
          copy_draft?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          objective?: string | null
          product_id?: string | null
          status?: string
          title?: string
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_projects_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          content_type: string
          dimensions: Json
          id: string
          is_active: boolean
          name: string
          template_data: Json
        }
        Insert: {
          content_type: string
          dimensions?: Json
          id?: string
          is_active?: boolean
          name: string
          template_data?: Json
        }
        Update: {
          content_type?: string
          dimensions?: Json
          id?: string
          is_active?: boolean
          name?: string
          template_data?: Json
        }
        Relationships: []
      }
      demo_policies: {
        Row: {
          allow_renewal: boolean
          allowed_modules: string[]
          disclaimer: string
          duration_minutes: number
          enabled: boolean
          id: string
          idle_timeout_seconds: number
          iframe_url: string | null
          max_active_sessions: number
          max_concurrent_sessions: number
          mode: string
          product_id: string
          sessions_per_visitor_per_hour: number
          updated_at: string
          watermark_text: string
        }
        Insert: {
          allow_renewal?: boolean
          allowed_modules?: string[]
          disclaimer?: string
          duration_minutes?: number
          enabled?: boolean
          id?: string
          idle_timeout_seconds?: number
          iframe_url?: string | null
          max_active_sessions?: number
          max_concurrent_sessions?: number
          mode?: string
          product_id: string
          sessions_per_visitor_per_hour?: number
          updated_at?: string
          watermark_text?: string
        }
        Update: {
          allow_renewal?: boolean
          allowed_modules?: string[]
          disclaimer?: string
          duration_minutes?: number
          enabled?: boolean
          id?: string
          idle_timeout_seconds?: number
          iframe_url?: string | null
          max_active_sessions?: number
          max_concurrent_sessions?: number
          mode?: string
          product_id?: string
          sessions_per_visitor_per_hour?: number
          updated_at?: string
          watermark_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_policies_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_session_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          session_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          session_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_session_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "demo_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_sessions: {
        Row: {
          ended_at: string | null
          expires_at: string
          id: string
          last_seen_at: string
          metadata: Json
          product_id: string
          session_token_hash: string
          started_at: string
          status: string
          visitor_hash: string
        }
        Insert: {
          ended_at?: string | null
          expires_at: string
          id?: string
          last_seen_at?: string
          metadata?: Json
          product_id: string
          session_token_hash: string
          started_at?: string
          status?: string
          visitor_hash: string
        }
        Update: {
          ended_at?: string | null
          expires_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json
          product_id?: string
          session_token_hash?: string
          started_at?: string
          status?: string
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_sessions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_check_logs: {
        Row: {
          checked_at: string
          checked_by: string | null
          error: string | null
          http_status: number | null
          id: string
          integration_id: string
          latency_ms: number | null
          result: string
        }
        Insert: {
          checked_at?: string
          checked_by?: string | null
          error?: string | null
          http_status?: number | null
          id?: string
          integration_id: string
          latency_ms?: number | null
          result: string
        }
        Update: {
          checked_at?: string
          checked_by?: string | null
          error?: string | null
          http_status?: number | null
          id?: string
          integration_id?: string
          latency_ms?: number | null
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_check_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "product_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          due_at: string | null
          id: string
          lead_id: string
          metadata: Json
          notes: string | null
        }
        Insert: {
          activity_type: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          lead_id: string
          metadata?: Json
          notes?: string | null
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string
          metadata?: Json
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          consent_marketing: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          industry: string | null
          interest_label: string | null
          last_contacted_at: string | null
          lost_reason: string | null
          marketing_consented_at: string | null
          need_description: string | null
          next_follow_up_at: string | null
          owner_id: string | null
          phone: string | null
          privacy_consent: boolean
          privacy_consented_at: string | null
          product_id: string | null
          score: number
          score_reasons: Json
          source: string
          status: string
          updated_at: string
          utm: Json
        }
        Insert: {
          company?: string | null
          consent_marketing?: boolean
          created_at?: string
          email: string
          full_name: string
          id?: string
          industry?: string | null
          interest_label?: string | null
          last_contacted_at?: string | null
          lost_reason?: string | null
          marketing_consented_at?: string | null
          need_description?: string | null
          next_follow_up_at?: string | null
          owner_id?: string | null
          phone?: string | null
          privacy_consent?: boolean
          privacy_consented_at?: string | null
          product_id?: string | null
          score?: number
          score_reasons?: Json
          source?: string
          status?: string
          updated_at?: string
          utm?: Json
        }
        Update: {
          company?: string | null
          consent_marketing?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          industry?: string | null
          interest_label?: string | null
          last_contacted_at?: string | null
          lost_reason?: string | null
          marketing_consented_at?: string | null
          need_description?: string | null
          next_follow_up_at?: string | null
          owner_id?: string | null
          phone?: string | null
          privacy_consent?: boolean
          privacy_consented_at?: string | null
          product_id?: string | null
          score?: number
          score_reasons?: Json
          source?: string
          status?: string
          updated_at?: string
          utm?: Json
        }
        Relationships: [
          {
            foreignKeyName: "leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          expires_at: string | null
          id: string
          issued_at: string | null
          lead_id: string | null
          license_type: string
          metadata: Json
          product_id: string
          status: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          lead_id?: string | null
          license_type: string
          metadata?: Json
          product_id: string
          status?: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          lead_id?: string | null
          license_type?: string
          metadata?: Json
          product_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_packages: {
        Row: {
          translations: Json
          billing_period: string
          currency: string
          description: string | null
          features: Json
          id: string
          is_public: boolean
          name: string
          price_amount: number | null
          product_id: string
          sort_order: number
          tier: string | null
          updated_at: string
        }
        Insert: {
          translations?: Json
          billing_period?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_public?: boolean
          name: string
          price_amount?: number | null
          product_id: string
          sort_order?: number
          tier?: string | null
          updated_at?: string
        }
        Update: {
          translations?: Json
          billing_period?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_public?: boolean
          name?: string
          price_amount?: number | null
          product_id?: string
          sort_order?: number
          tier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_packages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          translations: Json
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          translations?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          translations?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_features: {
        Row: {
          translations: Json
          created_at: string
          description: string | null
          id: string
          product_id: string
          sort_order: number
          title: string
        }
        Insert: {
          translations?: Json
          created_at?: string
          description?: string | null
          id?: string
          product_id: string
          sort_order?: number
          title: string
        }
        Update: {
          translations?: Json
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_features_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_integrations: {
        Row: {
          application_url: string | null
          check_path: string
          configuration: Json
          created_at: string
          display_name: string | null
          health_status: string
          id: string
          integration_type: string
          is_enabled: boolean
          last_checked_at: string | null
          last_error: string | null
          last_latency_ms: number | null
          last_status_code: number | null
          product_id: string
          updated_at: string
        }
        Insert: {
          application_url?: string | null
          check_path?: string
          configuration?: Json
          created_at?: string
          display_name?: string | null
          health_status?: string
          id?: string
          integration_type: string
          is_enabled?: boolean
          last_checked_at?: string | null
          last_error?: string | null
          last_latency_ms?: number | null
          last_status_code?: number | null
          product_id: string
          updated_at?: string
        }
        Update: {
          application_url?: string | null
          check_path?: string
          configuration?: Json
          created_at?: string
          display_name?: string | null
          health_status?: string
          id?: string
          integration_type?: string
          is_enabled?: boolean
          last_checked_at?: string | null
          last_error?: string | null
          last_latency_ms?: number | null
          last_status_code?: number | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_integrations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_media: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_public: boolean
          media_type: string
          product_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          media_type: string
          product_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          media_type?: string
          product_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          translations: Json
          application_url: string | null
          benefits: string[]
          category_id: string | null
          created_at: string
          default_demo_minutes: number
          demo_enabled: boolean
          demo_url: string | null
          demo_video_url: string | null
          description: string | null
          faq: Json
          id: string
          is_featured: boolean
          logo_path: string | null
          name: string
          pricing_model: string | null
          problem_statement: string | null
          publication_status: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          status: string
          target_market: string | null
          technology_stack: string[]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          translations?: Json
          application_url?: string | null
          benefits?: string[]
          category_id?: string | null
          created_at?: string
          default_demo_minutes?: number
          demo_enabled?: boolean
          demo_url?: string | null
          demo_video_url?: string | null
          description?: string | null
          faq?: Json
          id?: string
          is_featured?: boolean
          logo_path?: string | null
          name: string
          pricing_model?: string | null
          problem_statement?: string | null
          publication_status?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          status?: string
          target_market?: string | null
          technology_stack?: string[]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          translations?: Json
          application_url?: string | null
          benefits?: string[]
          category_id?: string | null
          created_at?: string
          default_demo_minutes?: number
          demo_enabled?: boolean
          demo_url?: string | null
          demo_video_url?: string | null
          description?: string | null
          faq?: Json
          id?: string
          is_featured?: boolean
          logo_path?: string | null
          name?: string
          pricing_model?: string | null
          problem_statement?: string | null
          publication_status?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          status?: string
          target_market?: string | null
          technology_stack?: string[]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      render_jobs: {
        Row: {
          attempts: number
          content_project_id: string | null
          cost_estimate: number | null
          created_at: string
          duration_seconds: number | null
          error: string | null
          finished_at: string | null
          height: number
          id: string
          input: Json
          job_type: string
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          output_asset_id: string | null
          output_format: string
          product_id: string | null
          progress: number
          provider: string
          requested_by: string | null
          started_at: string | null
          status: string
          template_key: string
          width: number
        }
        Insert: {
          attempts?: number
          content_project_id?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration_seconds?: number | null
          error?: string | null
          finished_at?: string | null
          height: number
          id?: string
          input?: Json
          job_type: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          output_asset_id?: string | null
          output_format: string
          product_id?: string | null
          progress?: number
          provider?: string
          requested_by?: string | null
          started_at?: string | null
          status?: string
          template_key: string
          width: number
        }
        Update: {
          attempts?: number
          content_project_id?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration_seconds?: number | null
          error?: string | null
          finished_at?: string | null
          height?: number
          id?: string
          input?: Json
          job_type?: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          output_asset_id?: string | null
          output_format?: string
          product_id?: string | null
          progress?: number
          provider?: string
          requested_by?: string | null
          started_at?: string | null
          status?: string
          template_key?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "render_jobs_content_project_id_fkey"
            columns: ["content_project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_jobs_output_asset_id_fkey"
            columns: ["output_asset_id"]
            isOneToOne: false
            referencedRelation: "content_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_jobs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_inquiries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          budget_range: string | null
          closed_at: string | null
          created_at: string
          currency: string
          id: string
          inquiry_type: string
          lead_id: string | null
          message: string
          owner_id: string | null
          pricing_package_id: string | null
          product_id: string | null
          proposal_notes: string | null
          quoted_amount: number | null
          sent_at: string | null
          status: string
          timeline: string | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          budget_range?: string | null
          closed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          inquiry_type: string
          lead_id?: string | null
          message: string
          owner_id?: string | null
          pricing_package_id?: string | null
          product_id?: string | null
          proposal_notes?: string | null
          quoted_amount?: number | null
          sent_at?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          budget_range?: string | null
          closed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          inquiry_type?: string
          lead_id?: string | null
          message?: string
          owner_id?: string | null
          pricing_package_id?: string | null
          product_id?: string | null
          proposal_notes?: string | null
          quoted_amount?: number | null
          sent_at?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_inquiries_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_inquiries_pricing_package_id_fkey"
            columns: ["pricing_package_id"]
            isOneToOne: false
            referencedRelation: "pricing_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_inquiries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          created_at: string
          is_active: boolean
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          ends_at: string | null
          external_reference: string | null
          id: string
          lead_id: string | null
          pricing_package_id: string | null
          starts_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          external_reference?: string | null
          id?: string
          lead_id?: string | null
          pricing_package_id?: string | null
          starts_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          external_reference?: string | null
          id?: string
          lead_id?: string | null
          pricing_package_id?: string | null
          starts_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_pricing_package_id_fkey"
            columns: ["pricing_package_id"]
            isOneToOne: false
            referencedRelation: "pricing_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          company: string | null
          created_at: string
          customer_name: string
          id: string
          is_published: boolean
          product_id: string | null
          quote: string
          rating: number | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          customer_name: string
          id?: string
          is_published?: boolean
          product_id?: string | null
          quote: string
          rating?: number | null
        }
        Update: {
          company?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          is_published?: boolean
          product_id?: string | null
          quote?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analytics_overview: { Args: { p_days?: number }; Returns: Json }
      claim_render_job: {
        Args: { p_worker: string }
        Returns: {
          attempts: number
          content_project_id: string | null
          cost_estimate: number | null
          created_at: string
          duration_seconds: number | null
          error: string | null
          finished_at: string | null
          height: number
          id: string
          input: Json
          job_type: string
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          output_asset_id: string | null
          output_format: string
          product_id: string | null
          progress: number
          provider: string
          requested_by: string | null
          started_at: string | null
          status: string
          template_key: string
          width: number
        }
        SetofOptions: {
          from: "*"
          to: "render_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_render_job: {
        Args: {
          p_checksum: string
          p_duration: number
          p_height: number
          p_job: string
          p_mime: string
          p_size: number
          p_storage_path: string
          p_width: number
          p_worker: string
        }
        Returns: string
      }
      demo_admin_revoke: { Args: { p_session_id: string }; Returns: boolean }
      demo_cleanup: { Args: { p_retention_days?: number }; Returns: Json }
      demo_end: {
        Args: { p_session_id: string; p_token: string }
        Returns: Json
      }
      demo_heartbeat: {
        Args: { p_activity?: boolean; p_session_id: string; p_token: string }
        Returns: Json
      }
      demo_start: {
        Args: { p_slug: string; p_visitor_hash: string }
        Returns: Json
      }
      fail_render_job: {
        Args: { p_error: string; p_job: string; p_worker: string }
        Returns: boolean
      }
      grant_staff_role: {
        Args: { p_email: string; p_role: string }
        Returns: string
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      staff_directory: {
        Args: never
        Returns: {
          created_at: string
          email: string
          is_active: boolean
          last_sign_in_at: string
          role: string
          user_id: string
        }[]
      }
      submit_inquiry: { Args: { p: Json }; Returns: Json }
      track_event: {
        Args: {
          p_event: string
          p_metadata?: Json
          p_path?: string
          p_product_slug?: string
          p_session_hash?: string
          p_source?: string
        }
        Returns: boolean
      }
      update_render_progress: {
        Args: { p_job: string; p_progress: number; p_worker: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
