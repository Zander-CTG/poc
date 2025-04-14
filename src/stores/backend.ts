import { SupabaseClient } from '@supabase/supabase-js'
import { defineStore } from 'pinia'

export const useBackend = defineStore({
  id: 'backend',

  state: () => ({
    supabase: {} as SupabaseClient,
    user: {} as any,
  }),
})
