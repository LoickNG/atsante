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
      births: {
        Row: {
          apgar_10min: number | null
          apgar_1min: number | null
          apgar_5min: number | null
          baby_first_name: string | null
          baby_gender: string
          baby_last_name: string | null
          baby_status: string
          birth_date: string
          birth_height_cm: number | null
          birth_weight_grams: number | null
          clinic_id: string | null
          complications: string | null
          created_at: string
          delivered_by: string | null
          delivery_type: string
          head_circumference_cm: number | null
          id: string
          maternity_admission_id: string
          notes: string | null
          patient_id: string
        }
        Insert: {
          apgar_10min?: number | null
          apgar_1min?: number | null
          apgar_5min?: number | null
          baby_first_name?: string | null
          baby_gender: string
          baby_last_name?: string | null
          baby_status?: string
          birth_date?: string
          birth_height_cm?: number | null
          birth_weight_grams?: number | null
          clinic_id?: string | null
          complications?: string | null
          created_at?: string
          delivered_by?: string | null
          delivery_type?: string
          head_circumference_cm?: number | null
          id?: string
          maternity_admission_id: string
          notes?: string | null
          patient_id: string
        }
        Update: {
          apgar_10min?: number | null
          apgar_1min?: number | null
          apgar_5min?: number | null
          baby_first_name?: string | null
          baby_gender?: string
          baby_last_name?: string | null
          baby_status?: string
          birth_date?: string
          birth_height_cm?: number | null
          birth_weight_grams?: number | null
          clinic_id?: string | null
          complications?: string | null
          created_at?: string
          delivered_by?: string | null
          delivery_type?: string
          head_circumference_cm?: number | null
          id?: string
          maternity_admission_id?: string
          notes?: string | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "births_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "births_maternity_admission_id_fkey"
            columns: ["maternity_admission_id"]
            isOneToOne: false
            referencedRelation: "maternity_admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "births_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          activated_license_key: string | null
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          license_number: string | null
          logo_url: string | null
          name: string
          phone: string | null
          phone2: string | null
          primary_color: string | null
          slogan: string | null
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          activated_license_key?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          license_number?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          phone2?: string | null
          primary_color?: string | null
          slogan?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          activated_license_key?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          license_number?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          phone2?: string | null
          primary_color?: string | null
          slogan?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      consultations: {
        Row: {
          blood_pressure: string | null
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
            foreignKeyName: "consultations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
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
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
            foreignKeyName: "conventions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
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
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          clinic_id: string | null
          created_at: string
          created_by: string
          id: string
          is_group: boolean
          title: string | null
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_group?: boolean
          title?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_group?: boolean
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      emergency_visits: {
        Row: {
          arrival_mode: string
          arrived_at: string
          blood_pressure: string | null
          care_started_at: string | null
          chief_complaint: string
          clinic_id: string | null
          completed_at: string | null
          created_at: string
          diagnosis: string | null
          doctor_id: string | null
          heart_rate: number | null
          hospitalization_id: string | null
          id: string
          nurse_id: string | null
          orientation: string | null
          orientation_notes: string | null
          patient_id: string
          respiratory_rate: number | null
          spo2: number | null
          status: string
          temperature: number | null
          treatment_notes: string | null
          triage_level: string
          triaged_at: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          arrival_mode?: string
          arrived_at?: string
          blood_pressure?: string | null
          care_started_at?: string | null
          chief_complaint: string
          clinic_id?: string | null
          completed_at?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          heart_rate?: number | null
          hospitalization_id?: string | null
          id?: string
          nurse_id?: string | null
          orientation?: string | null
          orientation_notes?: string | null
          patient_id: string
          respiratory_rate?: number | null
          spo2?: number | null
          status?: string
          temperature?: number | null
          treatment_notes?: string | null
          triage_level?: string
          triaged_at?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          arrival_mode?: string
          arrived_at?: string
          blood_pressure?: string | null
          care_started_at?: string | null
          chief_complaint?: string
          clinic_id?: string | null
          completed_at?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          heart_rate?: number | null
          hospitalization_id?: string | null
          id?: string
          nurse_id?: string | null
          orientation?: string | null
          orientation_notes?: string | null
          patient_id?: string
          respiratory_rate?: number | null
          spo2?: number | null
          status?: string
          temperature?: number | null
          treatment_notes?: string | null
          triage_level?: string
          triaged_at?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_visits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_visits_hospitalization_id_fkey"
            columns: ["hospitalization_id"]
            isOneToOne: false
            referencedRelation: "hospitalizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitalization_care: {
        Row: {
          administered_at: string
          administered_by: string
          care_type: string
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
            foreignKeyName: "hospitalization_care_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
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
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
            foreignKeyName: "hospitalizations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
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
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
            foreignKeyName: "imaging_requests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
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
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "insurance_companies_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
            foreignKeyName: "invoice_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
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
          clinic_id: string | null
          company_amount: number
          convention_id: string | null
          created_at: string
          created_by: string
          discount_amount: number
          discount_percent: number
          id: string
          insurance_amount: number
          invoice_number: string
          is_proforma: boolean
          paid_amount: number
          paid_at: string | null
          patient_amount: number
          patient_id: string
          status: string
          total_amount: number
          visit_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          company_amount?: number
          convention_id?: string | null
          created_at?: string
          created_by: string
          discount_amount?: number
          discount_percent?: number
          id?: string
          insurance_amount?: number
          invoice_number: string
          is_proforma?: boolean
          paid_amount?: number
          paid_at?: string | null
          patient_amount?: number
          patient_id: string
          status?: string
          total_amount?: number
          visit_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          company_amount?: number
          convention_id?: string | null
          created_at?: string
          created_by?: string
          discount_amount?: number
          discount_percent?: number
          id?: string
          insurance_amount?: number
          invoice_number?: string
          is_proforma?: boolean
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
            foreignKeyName: "invoices_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
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
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
            foreignKeyName: "lab_requests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
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
      licenses: {
        Row: {
          clinic_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          current_users: number
          enabled_modules: string[]
          expiry_date: string
          id: string
          is_active: boolean
          license_key: string
          max_users: number
          notes: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          clinic_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          current_users?: number
          enabled_modules?: string[]
          expiry_date?: string
          id?: string
          is_active?: boolean
          license_key?: string
          max_users?: number
          notes?: string | null
          start_date?: string
          updated_at?: string
        }
        Update: {
          clinic_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          current_users?: number
          enabled_modules?: string[]
          expiry_date?: string
          id?: string
          is_active?: boolean
          license_key?: string
          max_users?: number
          notes?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      maternity_admissions: {
        Row: {
          admission_date: string
          bed_number: number | null
          blood_group: string | null
          clinic_id: string | null
          created_at: string
          discharge_date: string | null
          doctor_id: string
          expected_due_date: string | null
          gestational_weeks: number | null
          gravida: number | null
          id: string
          notes: string | null
          para: number | null
          patient_id: string
          pregnancy_type: string
          rhesus: string | null
          risk_level: string
          room_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admission_date?: string
          bed_number?: number | null
          blood_group?: string | null
          clinic_id?: string | null
          created_at?: string
          discharge_date?: string | null
          doctor_id: string
          expected_due_date?: string | null
          gestational_weeks?: number | null
          gravida?: number | null
          id?: string
          notes?: string | null
          para?: number | null
          patient_id: string
          pregnancy_type?: string
          rhesus?: string | null
          risk_level?: string
          room_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admission_date?: string
          bed_number?: number | null
          blood_group?: string | null
          clinic_id?: string | null
          created_at?: string
          discharge_date?: string | null
          doctor_id?: string
          expected_due_date?: string | null
          gestational_weeks?: number | null
          gravida?: number | null
          id?: string
          notes?: string | null
          para?: number | null
          patient_id?: string
          pregnancy_type?: string
          rhesus?: string | null
          risk_level?: string
          room_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maternity_admissions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maternity_admissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maternity_admissions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_acts: {
        Row: {
          category: string
          clinic_id: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          unit_price: number
        }
        Insert: {
          category: string
          clinic_id?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          unit_price: number
        }
        Update: {
          category?: string
          clinic_id?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "medical_acts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          alert_threshold: number
          category: string
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "medications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "notifications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_rooms: {
        Row: {
          clinic_id: string | null
          created_at: string
          id: string
          is_available: boolean
          name: string
          notes: string | null
          room_number: string
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          name: string
          notes?: string | null
          room_number: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          name?: string
          notes?: string | null
          room_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operating_rooms_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_companies: {
        Row: {
          address: string | null
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "partner_companies_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string[] | null
          blood_type: string | null
          cause_of_death: string | null
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
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
          clinic_id: string | null
          created_at: string
          id: string
          invoice_id: string
          method: string
          received_by: string
          reference: string | null
        }
        Insert: {
          amount: number
          clinic_id?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          method: string
          received_by: string
          reference?: string | null
        }
        Update: {
          amount?: number
          clinic_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          received_by?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      prenatal_visits: {
        Row: {
          blood_pressure: string | null
          blood_sugar: number | null
          clinic_id: string | null
          complications: string | null
          created_at: string
          edema: string | null
          fetal_heart_rate: number | null
          gestational_weeks: number | null
          hemoglobin: number | null
          id: string
          lab_notes: string | null
          maternity_admission_id: string
          next_appointment: string | null
          notes: string | null
          patient_id: string
          performed_by: string | null
          presentation: string | null
          recommendations: string | null
          ultrasound_date: string | null
          ultrasound_notes: string | null
          urine_protein: string | null
          uterine_height_cm: number | null
          vaccinations: string | null
          visit_date: string
          weight_kg: number | null
        }
        Insert: {
          blood_pressure?: string | null
          blood_sugar?: number | null
          clinic_id?: string | null
          complications?: string | null
          created_at?: string
          edema?: string | null
          fetal_heart_rate?: number | null
          gestational_weeks?: number | null
          hemoglobin?: number | null
          id?: string
          lab_notes?: string | null
          maternity_admission_id: string
          next_appointment?: string | null
          notes?: string | null
          patient_id: string
          performed_by?: string | null
          presentation?: string | null
          recommendations?: string | null
          ultrasound_date?: string | null
          ultrasound_notes?: string | null
          urine_protein?: string | null
          uterine_height_cm?: number | null
          vaccinations?: string | null
          visit_date?: string
          weight_kg?: number | null
        }
        Update: {
          blood_pressure?: string | null
          blood_sugar?: number | null
          clinic_id?: string | null
          complications?: string | null
          created_at?: string
          edema?: string | null
          fetal_heart_rate?: number | null
          gestational_weeks?: number | null
          hemoglobin?: number | null
          id?: string
          lab_notes?: string | null
          maternity_admission_id?: string
          next_appointment?: string | null
          notes?: string | null
          patient_id?: string
          performed_by?: string | null
          presentation?: string | null
          recommendations?: string | null
          ultrasound_date?: string | null
          ultrasound_notes?: string | null
          urine_protein?: string | null
          uterine_height_cm?: number | null
          vaccinations?: string | null
          visit_date?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prenatal_visits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prenatal_visits_maternity_admission_id_fkey"
            columns: ["maternity_admission_id"]
            isOneToOne: false
            referencedRelation: "maternity_admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prenatal_visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
            foreignKeyName: "prescriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
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
          clinic_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          service_id: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          clinic_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          service_id?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          clinic_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          service_id?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          category: string
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "rooms_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
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
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
            foreignKeyName: "stock_movements_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      surgeries: {
        Row: {
          clinic_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          doctor_id: string
          estimated_duration_minutes: number
          hospitalization_id: string | null
          id: string
          notes: string | null
          operating_room_id: string
          patient_id: string
          scheduled_date: string
          started_at: string | null
          status: string
          surgery_type: string
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          doctor_id: string
          estimated_duration_minutes?: number
          hospitalization_id?: string | null
          id?: string
          notes?: string | null
          operating_room_id: string
          patient_id: string
          scheduled_date: string
          started_at?: string | null
          status?: string
          surgery_type: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          doctor_id?: string
          estimated_duration_minutes?: number
          hospitalization_id?: string | null
          id?: string
          notes?: string | null
          operating_room_id?: string
          patient_id?: string
          scheduled_date?: string
          started_at?: string | null
          status?: string
          surgery_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surgeries_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_hospitalization_id_fkey"
            columns: ["hospitalization_id"]
            isOneToOne: false
            referencedRelation: "hospitalizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_operating_room_id_fkey"
            columns: ["operating_room_id"]
            isOneToOne: false
            referencedRelation: "operating_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          clinic_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          assigned_doctor_id: string | null
          blood_pressure: string | null
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
            foreignKeyName: "visits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
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
      can_access_conversation: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      can_add_conversation_participant: {
        Args: {
          _actor_id: string
          _conversation_id: string
          _participant_id: string
        }
        Returns: boolean
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_my_clinic_id: { Args: never; Returns: string }
      get_profile_display: {
        Args: { p_user_id: string }
        Returns: {
          full_name: string
          specialty: string
          user_id: string
        }[]
      }
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
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
        | "daf"
        | "super_admin"
        | "pca"
        | "dg"
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
        "daf",
        "super_admin",
        "pca",
        "dg",
      ],
    },
  },
} as const
