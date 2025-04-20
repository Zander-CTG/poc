import { SupabaseClient } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'
import { useSettingsStore } from './settings'

export const useBackend = defineStore('backend', () => {
  const settingsStore = useSettingsStore()

  // -----State
  const supabase: Ref<SupabaseClient> = ref(null!)

  // -----Actions
  const initSupabase = () => {
    if (supabase.value) {
      return
    }

    const projectUrl = settingsStore.getProjectUrlSetting()
    const projectAnonApiKey = settingsStore.getProjectAnonApiKeySetting()

    if (!projectUrl) {
      throw new Error('Project URL is not set.')
    }
    if (!projectAnonApiKey) {
      throw new Error('Project Anon API Key is not set.')
    }

    supabase.value = new SupabaseClient(projectUrl, projectAnonApiKey)
  }

  const userLoginRequired = async () => {
    initSupabase()
    const { data } = await supabase.value.auth.getUser()
    if (data.user) {
      return {
        isLoginRequired: false,
        user: data.user,
      }
    }
    return {
      isLoginRequired: true,
      user: {},
    }
  }

  const loginUser = async (email: string, password: string) => {
    initSupabase()

    if (!email) throw new Error('Email is required')
    if (!password) throw new Error('Password is required')

    const { data, error } = await supabase.value.auth.signInWithPassword({
      email,
      password,
    })
    if (error)
      throw new Error(
        `Error logging in user: ${error.message} (${error.status})`,
      )
    return data.user
  }

  const logoutUser = async () => {
    initSupabase()
    const { error } = await supabase.value.auth.signOut()
    if (error) {
      throw new Error(
        `Error logging out user: ${error.message} (${error.status})`,
      )
    }
  }

  // -----Getters

  return { supabase, initSupabase, userLoginRequired, loginUser, logoutUser }
})
