import { SettingIdEnum } from '@/shared/enums'
import type { SettingType } from '@/shared/types'
import { defineStore } from 'pinia'

/**
 * Initialize on app startup in `App.vue`.
 */
export const useSettingsStore = defineStore({
  id: 'settings',

  state: () => ({
    settings: [] as SettingType[],
  }),

  getters: {
    consoleLogs: (state) => {
      return state.settings.find(
        (s: SettingType) => s.id === SettingIdEnum.CONSOLE_LOGS,
      )?.value
    },
    infoMessages: (state) => {
      return state.settings.find(
        (s: SettingType) => s.id === SettingIdEnum.INFO_MESSAGES,
      )?.value
    },
    logRetentionDuration: (state) => {
      return state.settings.find(
        (s: SettingType) => s.id === SettingIdEnum.LOG_RETENTION_DURATION,
      )?.value
    },
    loginOverlay: (state) => {
      return state.settings.find(
        (s: SettingType) => s.id === SettingIdEnum.LOGIN_OVERLAY,
      )?.value
    },
    apiKey: (state) => {
      return state.settings.find(
        (s: SettingType) => s.id === SettingIdEnum.API_KEY,
      )?.value
    },
    systemPrompt: (state) => {
      return state.settings.find(
        (s: SettingType) => s.id === SettingIdEnum.SYSTEM_PROMPT,
      )?.value
    },
    userPrompt: (state) => {
      return state.settings.find(
        (s: SettingType) => s.id === SettingIdEnum.USER_PROMPT,
      )?.value
    },
    maxTokens: (state) => {
      return state.settings.find(
        (s: SettingType) => s.id === SettingIdEnum.MAX_TOKENS,
      )?.value
    },
    modelName: (state) => {
      return state.settings.find(
        (s: SettingType) => s.id === SettingIdEnum.MODEL_NAME,
      )?.value
    },
    projectUrl: (state) => {
      return state.settings.find(
        (s: SettingType) => s.id === SettingIdEnum.PROJECT_URL,
      )?.value
    },
    projectApiKey: (state) => {
      return state.settings.find(
        (s: SettingType) => s.id === SettingIdEnum.PROJECT_API_KEY,
      )?.value
    },
  },
})
