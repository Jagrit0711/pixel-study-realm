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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          points_required: number | null
          streak_required: number | null
          tasks_required: number | null
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          points_required?: number | null
          streak_required?: number | null
          tasks_required?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points_required?: number | null
          streak_required?: number | null
          tasks_required?: number | null
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          ai_insights: Json | null
          created_at: string
          id: string
          points_earned: number
          points_lost: number
          report_date: string
          tasks_completed: number
          tasks_missed: number
          user_id: string
        }
        Insert: {
          ai_insights?: Json | null
          created_at?: string
          id?: string
          points_earned?: number
          points_lost?: number
          report_date: string
          tasks_completed?: number
          tasks_missed?: number
          user_id: string
        }
        Update: {
          ai_insights?: Json | null
          created_at?: string
          id?: string
          points_earned?: number
          points_lost?: number
          report_date?: string
          tasks_completed?: number
          tasks_missed?: number
          user_id?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          created_at: string
          id: string
          name: string
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          amount_owed: number
          amount_to_receive: number
          avatar_seed: string
          created_at: string
          current_streak: number
          exp: number
          id: string
          level: number
          longest_streak: number
          name: string
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_owed?: number
          amount_to_receive?: number
          avatar_seed?: string
          created_at?: string
          current_streak?: number
          exp?: number
          id?: string
          level?: number
          longest_streak?: number
          name?: string
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_owed?: number
          amount_to_receive?: number
          avatar_seed?: string
          created_at?: string
          current_streak?: number
          exp?: number
          id?: string
          level?: number
          longest_streak?: number
          name?: string
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      squad_activity: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          squad_id: string
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          squad_id: string
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          squad_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_activity_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_members: {
        Row: {
          id: string
          joined_at: string
          squad_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          squad_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          squad_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          code: string
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          chapter: string
          completed_at: string | null
          created_at: string
          date: string
          difficulty_justification: string | null
          difficulty_score: number | null
          difficulty_tier: string | null
          exam_id: string | null
          id: string
          points: number
          proof_type: string | null
          proof_url: string | null
          quiz_score: number | null
          status: string
          subject: string
          task_type: string
          title: string
          user_id: string
        }
        Insert: {
          chapter: string
          completed_at?: string | null
          created_at?: string
          date: string
          difficulty_justification?: string | null
          difficulty_score?: number | null
          difficulty_tier?: string | null
          exam_id?: string | null
          id?: string
          points?: number
          proof_type?: string | null
          proof_url?: string | null
          quiz_score?: number | null
          status?: string
          subject: string
          task_type: string
          title: string
          user_id: string
        }
        Update: {
          chapter?: string
          completed_at?: string | null
          created_at?: string
          date?: string
          difficulty_justification?: string | null
          difficulty_score?: number | null
          difficulty_tier?: string | null
          exam_id?: string | null
          id?: string
          points?: number
          proof_type?: string | null
          proof_url?: string | null
          quiz_score?: number | null
          status?: string
          subject?: string
          task_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_squad_by_code: {
        Args: { squad_code: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      is_in_same_squad: { Args: { target_squad_id: string }; Returns: boolean }
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
