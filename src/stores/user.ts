import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

export const useBackend = defineStore('user', () => {
  // -----State
  const token: Ref<string> = ref(null!)
  const user: Ref<Record<string, any>> = ref(null!)

  // -----Actions
  const initializeToken = (projectId: string) => {
    if (!projectId) throw new Error('Project ID is missing')

    const token = localStorage.getItem(`sa-${projectId}-auth-token`)
    if (!token) throw new Error('Token is missing')
  }

  // -----Getters

  const hasUser = () => {
    return !!user.value && !!user.value?.id && !!user.value?.email
  }
  const getUserEmail = () => {
    return user.value?.email || 'ERROR'
  }
  const getUserId = () => {
    return user.value?.id || 'ERROR'
  }

  return {
    hasUser,
    getUserEmail,
    getUserId,
  }
})
