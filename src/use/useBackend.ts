import { useSettingsStore } from '@/stores/settings'
import { createClient } from '@supabase/supabase-js'

export default function useBackend() {
  const settingsStore = useSettingsStore()

  const supabase = createClient(
    settingsStore.projectUrl as string,
    settingsStore.projectApiKey as string,
  )

  return { supabase }
}
