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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_content: {
        Row: {
          class_id: string | null
          content: Json
          content_type: string
          created_at: string
          id: string
          is_favorite: boolean | null
          prompt: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class_id?: string | null
          content: Json
          content_type: string
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          prompt?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class_id?: string | null
          content?: Json
          content_type?: string
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          prompt?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          class_id: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          teacher_id: string
          title: string
          attachments: Json | null
        }
        Insert: {
          class_id: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          teacher_id: string
          title: string
          attachments?: Json | null
        }
        Update: {
          class_id?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          teacher_id?: string
          title?: string
          attachments?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_late_submissions: boolean | null
          assigned_date: string | null
          category: string | null
          class_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_published: boolean | null
          name: string
          points_possible: number
          rubric_id: string | null
          source: string | null
          source_id: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          allow_late_submissions?: boolean | null
          assigned_date?: string | null
          category?: string | null
          class_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          name: string
          points_possible?: number
          rubric_id?: string | null
          source?: string | null
          source_id?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          allow_late_submissions?: boolean | null
          assigned_date?: string | null
          category?: string | null
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          name?: string
          points_possible?: number
          rubric_id?: string | null
          source?: string | null
          source_id?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          grade_level: string | null
          id: string
          is_archived: boolean | null
          join_code: string | null
          name: string
          period: string | null
          room: string | null
          school_year: string | null
          subject: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          grade_level?: string | null
          id?: string
          is_archived?: boolean | null
          join_code?: string | null
          name: string
          period?: string | null
          room?: string | null
          school_year?: string | null
          subject?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          grade_level?: string | null
          id?: string
          is_archived?: boolean | null
          join_code?: string | null
          name?: string
          period?: string | null
          room?: string | null
          school_year?: string | null
          subject?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          class_id: string
          created_at: string
          enrolled_at: string
          id: string
          is_active: boolean | null
          student_id: string | null
          user_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          is_active?: boolean | null
          student_id?: string | null
          user_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          is_active?: boolean | null
          student_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_items: {
        Row: {
          id: string
          user_id: string
          item_type: string
          item_id: string
          is_read: boolean | null
          is_starred: boolean | null
          is_archived: boolean | null
          is_deleted: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_type: string
          item_id: string
          is_read?: boolean | null
          is_starred?: boolean | null
          is_archived?: boolean | null
          is_deleted?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_type?: string
          item_id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          is_archived?: boolean | null
          is_deleted?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_categories: {
        Row: {
          class_id: string
          color: string | null
          created_at: string
          drop_lowest: number | null
          id: string
          name: string
          weight: number
        }
        Insert: {
          class_id: string
          color?: string | null
          created_at?: string
          drop_lowest?: number | null
          id?: string
          name: string
          weight?: number
        }
        Update: {
          class_id?: string
          color?: string | null
          created_at?: string
          drop_lowest?: number | null
          id?: string
          name?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grade_categories_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          assignment_id: string
          created_at: string
          feedback: string | null
          graded_at: string | null
          id: string
          is_late: boolean | null
          letter_grade: string | null
          percentage: number | null
          points_earned: number | null
          status: string | null
          student_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          id?: string
          is_late?: boolean | null
          letter_grade?: string | null
          percentage?: number | null
          points_earned?: number | null
          status?: string | null
          student_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          id?: string
          is_late?: boolean | null
          letter_grade?: string | null
          percentage?: number | null
          points_earned?: number | null
          status?: string | null
          student_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token: string | null
          account_email: string | null
          account_name: string | null
          created_at: string
          id: string
          is_connected: boolean | null
          last_synced_at: string | null
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_email?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          provider: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_email?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          class_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          parent_message_id: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
          attachments: Json | null
        }
        Insert: {
          class_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          parent_message_id?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
          attachments?: Json | null
        }
        Update: {
          class_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          parent_message_id?: string | null
          recipient_id?: string
          attachments?: Json | null
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          role: string | null
          school_code: string | null
          school_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          role?: string | null
          school_code?: string | null
          school_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          role?: string | null
          school_code?: string | null
          school_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          grade_level: string | null
          id: string
          is_active: boolean | null
          last_name: string
          notes: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          student_id_number: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          last_name: string
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          student_id_number?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          student_id_number?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_items: {
        Row: {
          created_at: string
          destination_id: string | null
          error_message: string | null
          id: string
          item_name: string
          item_type: string
          metadata: Json | null
          source_id: string | null
          status: string
          sync_id: string
        }
        Insert: {
          created_at?: string
          destination_id?: string | null
          error_message?: string | null
          id?: string
          item_name: string
          item_type: string
          metadata?: Json | null
          source_id?: string | null
          status?: string
          sync_id: string
        }
        Update: {
          created_at?: string
          destination_id?: string | null
          error_message?: string | null
          id?: string
          item_name?: string
          item_type?: string
          metadata?: Json | null
          source_id?: string | null
          status?: string
          sync_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_items_sync_id_fkey"
            columns: ["sync_id"]
            isOneToOne: false
            referencedRelation: "syncs"
            referencedColumns: ["id"]
          },
        ]
      }
      syncs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          items_count: number | null
          started_at: string | null
          status: string
          time_saved_minutes: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          items_count?: number | null
          started_at?: string | null
          status?: string
          time_saved_minutes?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          items_count?: number | null
          started_at?: string | null
          status?: string
          time_saved_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "syncs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          created_at: string
          current_month_syncs: number | null
          current_month_time_saved_minutes: number | null
          id: string
          last_sync_at: string | null
          streak_days: number | null
          total_items_synced: number | null
          total_syncs: number | null
          total_time_saved_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_month_syncs?: number | null
          current_month_time_saved_minutes?: number | null
          id?: string
          last_sync_at?: string | null
          streak_days?: number | null
          total_items_synced?: number | null
          total_syncs?: number | null
          total_time_saved_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_month_syncs?: number | null
          current_month_time_saved_minutes?: number | null
          id?: string
          last_sync_at?: string | null
          streak_days?: number | null
          total_items_synced?: number | null
          total_syncs?: number | null
          total_time_saved_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_letter_grade: { Args: { percentage: number }; Returns: string }
      generate_join_code: { Args: never; Returns: string }
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
  public: {
    Enums: {},
  },
} as const
