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
      buku: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          judul: string
          jumlah_tersedia: number
          jumlah_total: number
          kategori_id: string | null
          kode_buku: string
          lokasi_rak: string | null
          penerbit: string | null
          penulis: string | null
          tahun_terbit: number | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          judul: string
          jumlah_tersedia?: number
          jumlah_total?: number
          kategori_id?: string | null
          kode_buku: string
          lokasi_rak?: string | null
          penerbit?: string | null
          penulis?: string | null
          tahun_terbit?: number | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          judul?: string
          jumlah_tersedia?: number
          jumlah_total?: number
          kategori_id?: string | null
          kode_buku?: string
          lokasi_rak?: string | null
          penerbit?: string | null
          penulis?: string | null
          tahun_terbit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buku_kategori_id_fkey"
            columns: ["kategori_id"]
            isOneToOne: false
            referencedRelation: "kategori_buku"
            referencedColumns: ["id"]
          },
        ]
      }
      detail_peminjaman: {
        Row: {
          buku_id: string
          id: string
          jumlah: number
          peminjaman_id: string
        }
        Insert: {
          buku_id: string
          id?: string
          jumlah?: number
          peminjaman_id: string
        }
        Update: {
          buku_id?: string
          id?: string
          jumlah?: number
          peminjaman_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detail_peminjaman_buku_id_fkey"
            columns: ["buku_id"]
            isOneToOne: false
            referencedRelation: "buku"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detail_peminjaman_peminjaman_id_fkey"
            columns: ["peminjaman_id"]
            isOneToOne: false
            referencedRelation: "peminjaman"
            referencedColumns: ["id"]
          },
        ]
      }
      kategori_buku: {
        Row: {
          created_at: string
          id: string
          nama_kategori: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama_kategori: string
        }
        Update: {
          created_at?: string
          id?: string
          nama_kategori?: string
        }
        Relationships: []
      }
      log_aktivitas: {
        Row: {
          aktivitas: string
          id: string
          user_id: string | null
          waktu: string
        }
        Insert: {
          aktivitas: string
          id?: string
          user_id?: string | null
          waktu?: string
        }
        Update: {
          aktivitas?: string
          id?: string
          user_id?: string | null
          waktu?: string
        }
        Relationships: []
      }
      peminjam: {
        Row: {
          alamat: string | null
          created_at: string
          email: string | null
          id: string
          kode_peminjam: string
          nama: string
          no_hp: string | null
          no_identitas: string | null
          status: string
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kode_peminjam: string
          nama: string
          no_hp?: string | null
          no_identitas?: string | null
          status?: string
        }
        Update: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kode_peminjam?: string
          nama?: string
          no_hp?: string | null
          no_identitas?: string | null
          status?: string
        }
        Relationships: []
      }
      peminjaman: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          peminjam_id: string
          petugas_id: string | null
          status: Database["public"]["Enums"]["peminjaman_status"]
          tanggal_dikembalikan: string | null
          tanggal_kembali: string
          tanggal_pinjam: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          peminjam_id: string
          petugas_id?: string | null
          status?: Database["public"]["Enums"]["peminjaman_status"]
          tanggal_dikembalikan?: string | null
          tanggal_kembali: string
          tanggal_pinjam?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          peminjam_id?: string
          petugas_id?: string | null
          status?: Database["public"]["Enums"]["peminjaman_status"]
          tanggal_dikembalikan?: string | null
          tanggal_kembali?: string
          tanggal_pinjam?: string
        }
        Relationships: [
          {
            foreignKeyName: "peminjaman_peminjam_id_fkey"
            columns: ["peminjam_id"]
            isOneToOne: false
            referencedRelation: "peminjam"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nama_lengkap: string | null
          username: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nama_lengkap?: string | null
          username: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nama_lengkap?: string | null
          username?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_roles: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"][]
      }
    }
    Enums: {
      app_role: "admin" | "petugas"
      peminjaman_status: "dipinjam" | "dikembalikan" | "terlambat"
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
      app_role: ["admin", "petugas"],
      peminjaman_status: ["dipinjam", "dikembalikan", "terlambat"],
    },
  },
} as const
