export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  pgbouncer: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth: {
        Args: { p_usename: string }
        Returns: {
          password: string
          username: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      booking_reschedule_requests: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          new_start_time: string
          original_start_time: string
          reason: string | null
          requested_by: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          new_start_time: string
          original_start_time: string
          reason?: string | null
          requested_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          new_start_time?: string
          original_start_time?: string
          reason?: string | null
          requested_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_reschedule_requests_booking_id_fkey"
            columns: ["booking_id"]
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_statuses: {
        Row: {
          color: string
          created_at: string | null
          id: number
          is_active: boolean | null
          label_zh: string
          status_key: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          label_zh: string
          status_key: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          label_zh?: string
          status_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          course_id: string
          created_at: string
          end_time: string
          feedback_updated_at: string | null
          homework: string | null
          id: string
          notes: string | null
          paid_at: string | null
          price: number | null
          purchase_id: string | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          start_time: string
          status_id: number
          student_id: string
          teacher_feedback: string | null
          teacher_feedback_visible: boolean
          teacher_id: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          course_id: string
          created_at?: string
          end_time: string
          feedback_updated_at?: string | null
          homework?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          price?: number | null
          purchase_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          start_time: string
          status_id: number
          student_id: string
          teacher_feedback?: string | null
          teacher_feedback_visible?: boolean
          teacher_id: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          course_id?: string
          created_at?: string
          end_time?: string
          feedback_updated_at?: string | null
          homework?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          price?: number | null
          purchase_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          start_time?: string
          status_id?: number
          student_id?: string
          teacher_feedback?: string | null
          teacher_feedback_visible?: boolean
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_purchase_id_fkey"
            columns: ["purchase_id"]
            referencedRelation: "course_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "student_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "teacher_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_booking_status"
            columns: ["status_id"]
            referencedRelation: "booking_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      class_type: {
        Row: {
          class_type_id: number
          created_at: string | null
          is_active: boolean | null
          label_zh: string | null
          name: string
          teacher_id: string | null
        }
        Insert: {
          class_type_id?: number
          created_at?: string | null
          is_active?: boolean | null
          label_zh?: string | null
          name: string
          teacher_id?: string | null
        }
        Update: {
          class_type_id?: number
          created_at?: string | null
          is_active?: boolean | null
          label_zh?: string | null
          name?: string
          teacher_id?: string | null
        }
        Relationships: []
      }
      course_class_type: {
        Row: {
          class_type_id: number
          course_id: string
        }
        Insert: {
          class_type_id: number
          course_id: string
        }
        Update: {
          class_type_id?: number
          course_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_class_type_class_type_id_fkey"
            columns: ["class_type_id"]
            referencedRelation: "class_type"
            referencedColumns: ["class_type_id"]
          },
          {
            foreignKeyName: "course_class_type_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_purchases: {
        Row: {
          course_id: string
          created_at: string
          id: string
          price_paid: number
          remaining_hours: number
          status: string
          student_id: string
          total_hours: number
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          price_paid?: number
          remaining_hours?: number
          status?: string
          student_id: string
          total_hours?: number
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          price_paid?: number
          remaining_hours?: number
          status?: string
          student_id?: string
          total_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_purchases_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "student_info"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tags: {
        Row: {
          course_id: string
          created_at: string | null
          tag_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          tag_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tags_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          content: string | null
          course_type: string
          created_at: string | null
          description: string | null
          duration_minutes: number
          expected_learning_outcomes: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: string | null
          price: number | null
          sections: Json | null
          teacher_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          course_type?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          expected_learning_outcomes?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          price?: number | null
          sections?: Json | null
          teacher_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          course_type?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          expected_learning_outcomes?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          price?: number | null
          sections?: Json | null
          teacher_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "teacher_info"
            referencedColumns: ["id"]
          },
        ]
      }
      education_statuses: {
        Row: {
          created_at: string | null
          id: number
          label_zh: string
          status_key: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          label_zh: string
          status_key: string
        }
        Update: {
          created_at?: string | null
          id?: number
          label_zh?: string
          status_key?: string
        }
        Relationships: []
      }
      identity: {
        Row: {
          identity_id: number
          name: string
        }
        Insert: {
          identity_id?: number
          name: string
        }
        Update: {
          identity_id?: number
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "user_info"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_invoices: {
        Row: {
          active_teacher_count: number
          base_fee: number
          billing_month: string
          booking_count: number
          commission_fee: number
          created_at: string | null
          due_date: string
          id: string
          paid_at: string | null
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          active_teacher_count?: number
          base_fee?: number
          billing_month: string
          booking_count?: number
          commission_fee?: number
          created_at?: string | null
          due_date: string
          id?: string
          paid_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          active_teacher_count?: number
          base_fee?: number
          billing_month?: string
          booking_count?: number
          commission_fee?: number
          created_at?: string | null
          due_date?: string
          id?: string
          paid_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          label: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          key: string
          label?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          label?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      portfolio_media: {
        Row: {
          created_at: string | null
          file_type: string | null
          file_url: string
          id: string
          portfolio_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          portfolio_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          portfolio_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_media_portfolio_id_fkey"
            columns: ["portfolio_id"]
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_tags: {
        Row: {
          portfolio_id: string
          tag_id: string
        }
        Insert: {
          portfolio_id: string
          tag_id: string
        }
        Update: {
          portfolio_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_tags_portfolio_id_fkey"
            columns: ["portfolio_id"]
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_types: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_types_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "teacher_info"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          allow_comments: boolean | null
          category: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          likes_count: number | null
          publish_at: string | null
          status: string | null
          teacher_id: string
          title: string
          type_id: string | null
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          allow_comments?: boolean | null
          category?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          likes_count?: number | null
          publish_at?: string | null
          status?: string | null
          teacher_id: string
          title: string
          type_id?: string | null
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          allow_comments?: boolean | null
          category?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          likes_count?: number | null
          publish_at?: string | null
          status?: string | null
          teacher_id?: string
          title?: string
          type_id?: string | null
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "teacher_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_type_id_fkey"
            columns: ["type_id"]
            referencedRelation: "portfolio_types"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          city: string | null
          code: string | null
          country: string | null
          created_at: string | null
          id: string
          name: string
          website: string | null
        }
        Insert: {
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          website?: string | null
        }
        Update: {
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      slot_requests: {
        Row: {
          booking_id: string | null
          course_id: string
          created_at: string | null
          id: string
          notes: string | null
          preference_1_date: string
          preference_1_end: string
          preference_1_start: string
          preference_2_date: string
          preference_2_end: string
          preference_2_start: string
          preference_3_date: string
          preference_3_end: string
          preference_3_start: string
          reject_reason: string | null
          selected_rank: number | null
          status: string
          student_id: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          preference_1_date: string
          preference_1_end: string
          preference_1_start: string
          preference_2_date: string
          preference_2_end: string
          preference_2_start: string
          preference_3_date: string
          preference_3_end: string
          preference_3_start: string
          reject_reason?: string | null
          selected_rank?: number | null
          status?: string
          student_id: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          preference_1_date?: string
          preference_1_end?: string
          preference_1_start?: string
          preference_2_date?: string
          preference_2_end?: string
          preference_2_start?: string
          preference_3_date?: string
          preference_3_end?: string
          preference_3_start?: string
          reject_reason?: string | null
          selected_rank?: number | null
          status?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slot_requests_booking_id_fkey"
            columns: ["booking_id"]
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_requests_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_requests_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "student_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_requests_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "teacher_info"
            referencedColumns: ["id"]
          },
        ]
      }
      student_course_progress: {
        Row: {
          completed_section_ids: Json | null
          course_id: string
          created_at: string
          current_section_id: string | null
          id: string
          progress_percentage: number | null
          status: string
          student_id: string
          teacher_id: string
          teacher_notes: string | null
          updated_at: string
        }
        Insert: {
          completed_section_ids?: Json | null
          course_id: string
          created_at?: string
          current_section_id?: string | null
          id?: string
          progress_percentage?: number | null
          status?: string
          student_id: string
          teacher_id: string
          teacher_notes?: string | null
          updated_at?: string
        }
        Update: {
          completed_section_ids?: Json | null
          course_id?: string
          created_at?: string
          current_section_id?: string | null
          id?: string
          progress_percentage?: number | null
          status?: string
          student_id?: string
          teacher_id?: string
          teacher_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_course_progress_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_course_progress_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "student_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_course_progress_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "teacher_info"
            referencedColumns: ["id"]
          },
        ]
      }
      student_education: {
        Row: {
          created_at: string | null
          degree_level: string | null
          department: string | null
          end_year: number | null
          grade: string | null
          id: string
          school_id: string
          start_year: number | null
          status_id: number
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          degree_level?: string | null
          department?: string | null
          end_year?: number | null
          grade?: string | null
          id?: string
          school_id: string
          start_year?: number | null
          status_id: number
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          degree_level?: string | null
          department?: string | null
          end_year?: number | null
          grade?: string | null
          id?: string
          school_id?: string
          start_year?: number | null
          status_id?: number
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_education_school_id_fkey"
            columns: ["school_id"]
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_education_status_id_fkey"
            columns: ["status_id"]
            referencedRelation: "education_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_education_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "student_info"
            referencedColumns: ["id"]
          },
        ]
      }
      student_info: {
        Row: {
          created_at: string | null
          id: string
          student_code: string | null
          teacher_code: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          student_code?: string | null
          teacher_code: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          student_code?: string | null
          teacher_code?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_student_teacher_code"
            columns: ["teacher_code"]
            referencedRelation: "teacher_info"
            referencedColumns: ["teacher_code"]
          },
          {
            foreignKeyName: "student_info_id_fkey"
            columns: ["id"]
            referencedRelation: "user_info"
            referencedColumns: ["id"]
          },
        ]
      }
      system_modules: {
        Row: {
          badge: string | null
          created_at: string
          icon: string | null
          id: string
          identity_id: number
          is_active: boolean
          key: string
          label: string
          parent_key: string | null
          route: string | null
          sequence: number | null
          updated_at: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          identity_id: number
          is_active?: boolean
          key: string
          label: string
          parent_key?: string | null
          route?: string | null
          sequence?: number | null
          updated_at?: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          identity_id?: number
          is_active?: boolean
          key?: string
          label?: string
          parent_key?: string | null
          route?: string | null
          sequence?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_modules_identity_id_fkey"
            columns: ["identity_id"]
            referencedRelation: "identity"
            referencedColumns: ["identity_id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "teacher_info"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_availability_overrides: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          id: string
          is_unavailable: boolean | null
          start_time: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          is_unavailable?: boolean | null
          start_time?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          is_unavailable?: boolean | null
          start_time?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_overrides_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "teacher_info"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_availability_weekly: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_weekly_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "teacher_info"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_education: {
        Row: {
          created_at: string | null
          degree: string | null
          degree_level: string | null
          department: string | null
          end_year: number | null
          id: string
          is_verified: boolean | null
          school_id: string
          start_year: number | null
          status_id: number
          study_year: number | null
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          degree?: string | null
          degree_level?: string | null
          department?: string | null
          end_year?: number | null
          id?: string
          is_verified?: boolean | null
          school_id: string
          start_year?: number | null
          status_id: number
          study_year?: number | null
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          degree?: string | null
          degree_level?: string | null
          department?: string | null
          end_year?: number | null
          id?: string
          is_verified?: boolean | null
          school_id?: string
          start_year?: number | null
          status_id?: number
          study_year?: number | null
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_education_school_id_fkey"
            columns: ["school_id"]
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_education_status_id_fkey"
            columns: ["status_id"]
            referencedRelation: "education_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_education_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "teacher_info"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_experience: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          organization: string
          start_date: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          organization: string
          start_date: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          organization?: string
          start_date?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_experience_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "teacher_info"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_info: {
        Row: {
          base_price: number | null
          bio: string | null
          booking_settings: Json | null
          created_at: string
          enable_email_reminders: boolean | null
          experience_years: number | null
          google_calendar_enabled: boolean | null
          id: string
          is_public: boolean | null
          line_notify_enabled: boolean | null
          line_notify_token: string | null
          notification_settings: Json | null
          philosophy_items: Json
          philosophy_subtitle: string | null
          reminder_minutes: number | null
          specialties: string[] | null
          teacher_code: string
          title: string | null
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          bio?: string | null
          booking_settings?: Json | null
          created_at?: string
          enable_email_reminders?: boolean | null
          experience_years?: number | null
          google_calendar_enabled?: boolean | null
          id: string
          is_public?: boolean | null
          line_notify_enabled?: boolean | null
          line_notify_token?: string | null
          notification_settings?: Json | null
          philosophy_items?: Json
          philosophy_subtitle?: string | null
          reminder_minutes?: number | null
          specialties?: string[] | null
          teacher_code: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          bio?: string | null
          booking_settings?: Json | null
          created_at?: string
          enable_email_reminders?: boolean | null
          experience_years?: number | null
          google_calendar_enabled?: boolean | null
          id?: string
          is_public?: boolean | null
          line_notify_enabled?: boolean | null
          line_notify_token?: string | null
          notification_settings?: Json | null
          philosophy_items?: Json
          philosophy_subtitle?: string | null
          reminder_minutes?: number | null
          specialties?: string[] | null
          teacher_code?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_info_id_fkey"
            columns: ["id"]
            referencedRelation: "user_info"
            referencedColumns: ["id"]
          },
        ]
      }
      user_info: {
        Row: {
          avatar_url: string | null
          created_at: string
          disabled_at: string | null
          disabled_reason: string | null
          email: string
          id: string
          identity_id: number | null
          is_active: boolean
          is_first_login: boolean | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          disabled_at?: string | null
          disabled_reason?: string | null
          email: string
          id: string
          identity_id?: number | null
          is_active?: boolean
          is_first_login?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          disabled_at?: string | null
          disabled_reason?: string | null
          email?: string
          id?: string
          identity_id?: number | null
          is_active?: boolean
          is_first_login?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_info_identity_id_fkey"
            columns: ["identity_id"]
            referencedRelation: "identity"
            referencedColumns: ["identity_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_check_email_exists: {
        Args: { email_arg: string }
        Returns: boolean
      }
      admin_delete_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_promote_to_teacher: {
        Args: {
          is_active?: boolean
          target_user_id: string
          teacher_name: string
        }
        Returns: undefined
      }
      check_is_student_bound: {
        Args: { target_teacher_code: string }
        Returns: boolean
      }
      check_is_teacher_owner: {
        Args: { target_teacher_code: string }
        Returns: boolean
      }
      check_teacher_code_exists: { Args: { code: string }; Returns: boolean }
      ensure_school: {
        Args: { p_code?: string; p_name: string }
        Returns: string
      }
      generate_student_code: { Args: never; Returns: string }
      generate_teacher_code: { Args: never; Returns: string }
      get_identity_id: { Args: never; Returns: number }
      get_or_create_school: {
        Args: {
          p_city?: string
          p_code: string
          p_name: string
          p_website?: string
        }
        Returns: string
      }
      get_public_teacher_profile: {
        Args: { code: string }
        Returns: {
          avatar_url: string
          base_price: number
          bio: string
          educations: Json
          experience_years: number
          experiences: Json
          name: string
          philosophy_items: Json
          philosophy_subtitle: string
          specialties: string[]
          teacher_code: string
          title: string
        }[]
      }
      has_role: { Args: { target_role_name: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  pgbouncer: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
