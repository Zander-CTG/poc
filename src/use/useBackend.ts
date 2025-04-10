import { useSettingsStore } from '@/stores/settings'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import useLogger from './useLogger'

export default function useBackend() {
  const settingsStore = useSettingsStore()
  const { log } = useLogger()

  let supabase: SupabaseClient = null!

  try {
    supabase = createClient(
      settingsStore.projectUrl as string,
      settingsStore.projectApiKey as string,
    )
  } catch (error) {
    log.error('Backend settings missing', error as Error)
  }

  return { supabase }
}
