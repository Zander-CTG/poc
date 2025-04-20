import { SettingIdEnum } from '@/shared/enums'
import type { SettingType } from '@/shared/types'
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // -----State
  /**
   * Must set settings in `App.vue` on startup.
   */
  const settings: Ref<SettingType[]> = ref([])

  // -----Actions

  // -----Getters
  const getAllSettings = () => settings.value as SettingType[]
  // For App
  const getConsoleLogsSetting = () =>
    settings.value.find((s: SettingType) => s.id === SettingIdEnum.CONSOLE_LOGS)
      ?.value as boolean
  const getInfoPopupsSetting = () =>
    settings.value.find((s: SettingType) => s.id === SettingIdEnum.INFO_POPUPS)
      ?.value as boolean
  const getLogRetentionDurationSetting = () =>
    settings.value.find(
      (s: SettingType) => s.id === SettingIdEnum.LOG_RETENTION_DURATION,
    )?.value as string
  const getLoginOverlaySetting = () =>
    settings.value.find(
      (s: SettingType) => s.id === SettingIdEnum.LOGIN_OVERLAY,
    )?.value as boolean
  // For Supabase
  const getUserEmailSetting = () =>
    settings.value.find((s: SettingType) => s.id === SettingIdEnum.USER_EMAIL)
      ?.value as string
  const getProjectUrlSetting = () =>
    settings.value.find((s: SettingType) => s.id === SettingIdEnum.PROJECT_URL)
      ?.value as string
  const getProjectAnonApiKeySetting = () =>
    settings.value.find(
      (s: SettingType) => s.id === SettingIdEnum.PROJECT_ANON_API_KEY,
    )?.value as string
  // For OpenAI
  const getOpenAiApiKeySetting = () =>
    settings.value.find(
      (s: SettingType) => s.id === SettingIdEnum.OPENAI_API_KEY,
    )?.value as string
  const getSystemPromptSetting = () =>
    settings.value.find(
      (s: SettingType) => s.id === SettingIdEnum.SYSTEM_PROMPT,
    )?.value as string
  const getUserPromptSetting = () =>
    settings.value.find((s: SettingType) => s.id === SettingIdEnum.USER_PROMPT)
      ?.value as string
  const getMaxTokensSetting = () =>
    settings.value.find((s: SettingType) => s.id === SettingIdEnum.MAX_TOKENS)
      ?.value as number
  const getModelNameSetting = () =>
    settings.value.find((s: SettingType) => s.id === SettingIdEnum.MODEL_NAME)
      ?.value as string

  return {
    settings,
    getAllSettings,
    getConsoleLogsSetting,
    getInfoPopupsSetting,
    getLogRetentionDurationSetting,
    getLoginOverlaySetting,
    getUserEmailSetting,
    getProjectUrlSetting,
    getProjectAnonApiKeySetting,
    getOpenAiApiKeySetting,
    getSystemPromptSetting,
    getUserPromptSetting,
    getMaxTokensSetting,
    getModelNameSetting,
  }
})
