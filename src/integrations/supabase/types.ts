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
      consultations: {
        Row: {
          blood_pressure: string | null
          created_at: string
          date: string
          diagnosis: string | null
          doctor_id: string
          follow_up_notes: Json | null
          heart_rate: number | null
          height: number | null
          id: string
          notes: string | null
          patient_id: string
          status: string
          symptoms: string | null
          temperature: number | null
          visit_id: string
          weight: number | null
        }
        Insert: {
          blood_pressure?: string | null
          created_at?: string
          date?: string
          diagnosis?: string | null
          doctor_id: string
          follow_up_notes?: Json | null
          heart_rate?: number | null
          height?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          status?: string
          symptoms?: string | null
          temperature?: number | null
          visit_id: string
          weight?: number | null
        }
        Update: {
          blood_pressure?: string | null
          created_at?: string
          date?: string
          diagnosis?: string | null
          doctor_id?: string
          follow_up_notes?: Json | null
          heart_rate?: number | null
          height?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          status?: string
          symptoms?: string | null
          temperature?: number | null
          visit_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      conventions: {
        Row: {
          company_coverage_percent: number
          company_id: string
          created_at: string
          end_date: string | null
          id: string
          insurance_coverage_percent: number
          insurance_id: string | null
          is_active: boolean
          name: string
          notes: string | null
          patient_coverage_percent: number
          start_date: string
          updated_at: string
        }
        Insert: {
          company_coverage_percent?: number
          company_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          insurance_coverage_percent?: number
          insurance_id?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          patient_coverage_percent?: number
          start_date?: string
          updated_at?: string
        }
        Update: {
          company_coverage_percent?: number
          company_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          insurance_coverage_percent?: number
          insurance_id?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          patient_coverage_percent?: number
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conventions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conventions_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurance_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitalization_care: {
        Row: {
          administered_at: string
          administered_by: string
          care_type: string
          created_at: string
          description: string
          hospitalization_id: string
          id: string
          medication_id: string | null
          notes: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          administered_at?: string
          administered_by: string
          care_type: string
          created_at?: string
          description: string
          hospitalization_id: string
          id?: string
          medication_id?: string | null
          notes?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          administered_at?: string
          administered_by?: string
          care_type?: string
          created_at?: string
          description?: string
          hospitalization_id?: string
          id?: string
          medication_id?: string | null
          notes?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "hospitalization_care_hospitalization_id_fkey"
            columns: ["hospitalization_id"]
            isOneToOne: false
            referencedRelation: "hospitalizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitalization_care_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitalizations: {
        Row: {
          admission_date: string
          bed_number: number | null
          consultation_id: string | null
          created_at: string
          discharge_date: string | null
          discharge_notes: string | null
          doctor_id: string
          id: string
          patient_id: string
          reason: string
          room_id: string | null
          status: string
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          admission_date?: string
          bed_number?: number | null
          consultation_id?: string | null
          created_at?: string
          discharge_date?: string | null
          discharge_notes?: string | null
          doctor_id: string
          id?: string
          patient_id: string
          reason: string
          room_id?: string | null
          status?: string
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          admission_date?: string
          bed_number?: number | null
          consultation_id?: string | null
          created_at?: string
          discharge_date?: string | null
          discharge_notes?: string | null
          doctor_id?: string
          id?: string
          patient_id?: string
          reason?: string
          room_id?: string | null
          status?: string
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospitalizations_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitalizations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitalizations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitalizations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_requests: {
        Row: {
          body_part: string
          completed_at: string | null
          consultation_id: string | null
          exam_type: string
          id: string
          image_url: string | null
          patient_id: string
          performed_by: string | null
          priority: string
          report: string | null
          requested_at: string
          status: string
        }
        Insert: {
          body_part: string
          completed_at?: string | null
          consultation_id?: string | null
          exam_type: string
          id?: string
          image_url?: string | null
          patient_id: string
          performed_by?: string | null
          priority?: string
          report?: string | null
          requested_at?: string
          status?: string
        }
        Update: {
          body_part?: string
          completed_at?: string | null
          consultation_id?: string | null
          exam_type?: string
          id?: string
          image_url?: string | null
          patient_id?: string
          performed_by?: string | null
          priority?: string
          report?: string | null
          requested_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "imaging_requests_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_companies: {
        Row: {
          address: string | null
          code: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          reference_id: string | null
          total_price: number
          type: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          reference_id?: string | null
          total_price: number
          type: string
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          reference_id?: string | null
          total_price?: number
          type?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          company_amount: number
          convention_id: string | null
          created_at: string
          created_by: string
          id: string
          insurance_amount: number
          invoice_number: string
          paid_amount: number
          paid_at: string | null
          patient_amount: number
          patient_id: string
          status: string
          total_amount: number
          visit_id: string | null
        }
        Insert: {
          company_amount?: number
          convention_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          insurance_amount?: number
          invoice_number: string
          paid_amount?: number
          paid_at?: string | null
          patient_amount?: number
          patient_id: string
          status?: string
          total_amount?: number
          visit_id?: string | null
        }
        Update: {
          company_amount?: number
          convention_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          insurance_amount?: number
          invoice_number?: string
          paid_amount?: number
          paid_at?: string | null
          patient_amount?: number
          patient_id?: string
          status?: string
          total_amount?: number
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_requests: {
        Row: {
          completed_at: string | null
          consultation_id: string | null
          id: string
          patient_id: string
          priority: string
          requested_at: string
          result_values: Json | null
          results: string | null
          status: string
          test_type: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          completed_at?: string | null
          consultation_id?: string | null
          id?: string
          patient_id: string
          priority?: string
          requested_at?: string
          result_values?: Json | null
          results?: string | null
          status?: string
          test_type: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          completed_at?: string | null
          consultation_id?: string | null
          id?: string
          patient_id?: string
          priority?: string
          requested_at?: string
          result_values?: Json | null
          results?: string | null
          status?: string
          test_type?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_requests_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_acts: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          unit_price: number
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          unit_price: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          unit_price?: number
        }
        Relationships: []
      }
      medications: {
        Row: {
          alert_threshold: number
          category: string
          created_at: string
          dosage_unit: string
          expiry_date: string | null
          form: string
          generic_name: string | null
          id: string
          name: string
          stock_quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          alert_threshold?: number
          category: string
          created_at?: string
          dosage_unit: string
          expiry_date?: string | null
          form: string
          generic_name?: string | null
          id?: string
          name: string
          stock_quantity?: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          alert_threshold?: number
          category?: string
          created_at?: string
          dosage_unit?: string
          expiry_date?: string | null
          form?: string
          generic_name?: string | null
          id?: string
          name?: string
          stock_quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_companies: {
        Row: {
          address: string | null
          code: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          allergies: string[] | null
          blood_type: string | null
          cause_of_death: string | null
          code: string
          company_id: string | null
          convention_id: string | null
          created_at: string
          date_of_birth: string
          death_declared_by: string | null
          death_notes: string | null
          deceased_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employee_id: string | null
          first_name: string
          gender: string
          id: string
          is_deceased: boolean
          last_name: string
          phone: string
          photo_url: string | null
          place_of_death: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          blood_type?: string | null
          cause_of_death?: string | null
          code: string
          company_id?: string | null
          convention_id?: string | null
          created_at?: string
          date_of_birth: string
          death_declared_by?: string | null
          death_notes?: string | null
          deceased_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_id?: string | null
          first_name: string
          gender: string
          id?: string
          is_deceased?: boolean
          last_name: string
          phone: string
          photo_url?: string | null
          place_of_death?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          blood_type?: string | null
          cause_of_death?: string | null
          code?: string
          company_id?: string | null
          convention_id?: string | null
          created_at?: string
          date_of_birth?: string
          death_declared_by?: string | null
          death_notes?: string | null
          deceased_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_id?: string | null
          first_name?: string
          gender?: string
          id?: string
          is_deceased?: boolean
          last_name?: string
          phone?: string
          photo_url?: string | null
          place_of_death?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: string
          received_by: string
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method: string
          received_by: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          received_by?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          consultation_id: string
          created_at: string
          dispensed: boolean
          dispensed_at: string | null
          dispensed_by: string | null
          dosage: string
          duration: string
          frequency: string
          id: string
          instructions: string | null
          medication_id: string | null
          medication_name: string | null
          quantity: number
        }
        Insert: {
          consultation_id: string
          created_at?: string
          dispensed?: boolean
          dispensed_at?: string | null
          dispensed_by?: string | null
          dosage: string
          duration: string
          frequency: string
          id?: string
          instructions?: string | null
          medication_id?: string | null
          medication_name?: string | null
          quantity?: number
        }
        Update: {
          consultation_id?: string
          created_at?: string
          dispensed?: boolean
          dispensed_at?: string | null
          dispensed_by?: string | null
          dosage?: string
          duration?: string
          frequency?: string
          id?: string
          instructions?: string | null
          medication_id?: string | null
          medication_name?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          category: string
          comfort: string
          created_at: string
          floor: string | null
          id: string
          is_available: boolean
          notes: string | null
          price_per_night: number
          room_number: string
          updated_at: string
        }
        Insert: {
          category: string
          comfort: string
          created_at?: string
          floor?: string | null
          id?: string
          is_available?: boolean
          notes?: string | null
          price_per_night?: number
          room_number: string
          updated_at?: string
        }
        Update: {
          category?: string
          comfort?: string
          created_at?: string
          floor?: string | null
          id?: string
          is_available?: boolean
          notes?: string | null
          price_per_night?: number
          room_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      specialties: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          value?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          medication_id: string
          performed_by: string
          quantity: number
          reason: string | null
          reference_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          medication_id: string
          performed_by: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          medication_id?: string
          performed_by?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          assigned_doctor_id: string | null
          blood_pressure: string | null
          created_at: string
          date: string
          diagnosis: string | null
          heart_rate: number | null
          height: number | null
          id: string
          notes: string | null
          patient_id: string
          specialty: string | null
          status: string
          temperature: number | null
          type: string
          weight: number | null
        }
        Insert: {
          assigned_doctor_id?: string | null
          blood_pressure?: string | null
          created_at?: string
          date?: string
          diagnosis?: string | null
          heart_rate?: number | null
          height?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          specialty?: string | null
          status?: string
          temperature?: number | null
          type: string
          weight?: number | null
        }
        Update: {
          assigned_doctor_id?: string | null
          blood_pressure?: string | null
          created_at?: string
          date?: string
          diagnosis?: string | null
          heart_rate?: number | null
          height?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          specialty?: string | null
          status?: string
          temperature?: number | null
          type?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "accueil"
        | "medecin"
        | "infirmier"
        | "caissier"
        | "pharmacien"
        | "laborantin"
        | "imagerie"
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
    Enums: {
      app_role: [
        "admin",
        "accueil",
        "medecin",
        "infirmier",
        "caissier",
        "pharmacien",
        "laborantin",
        "imagerie",
      ],
    },
  },
} as const
