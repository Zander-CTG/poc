import { Log } from '@/models/Log'
import { DB } from '@/services/db'
import { appName } from '@/shared/constants'
import { LogLevelEnum, TableEnum } from '@/shared/enums'
import { debugIcon, errorIcon, infoIcon, warnIcon } from '@/shared/icons'
import type { LogDetailsType } from '@/shared/types'
import { useSettingsStore } from '@/stores/settings'
import { colors, useQuasar } from 'quasar'

/**
 * Logger meant to be used in the Vue application frontend code.
 */
export default function useLogger() {
  const notify = useQuasar().notify
  const loggerName = `%c${appName}`
  const baseStyle =
    'border-radius: 3px; padding: 2px 4px; color: white; background-color:'
  const style = {
    print: `${baseStyle} ${colors.getPaletteColor('secondary')};`,
    debug: `${baseStyle} ${colors.getPaletteColor('accent')};`,
    info: `${baseStyle} ${colors.getPaletteColor('info')};`,
    warn: `${baseStyle} ${colors.getPaletteColor('warning')};`,
    error: `${baseStyle} ${colors.getPaletteColor('negative')};`,
  }

  const { getConsoleLogsSetting, getInfoPopupsSetting } = useSettingsStore() // Use the Pinia settings store

  const log = {
    /**
     * Generic print method for logging messages during testing with no log level.
     */
    print: (message: any, ...args: any) => {
      console.log(loggerName, style.print, message, ...args)
    },

    /**
     * Log a debug message to the console only.
     */
    silentDebug: (name: string, details?: LogDetailsType) => {
      if (import.meta.env.DEV) {
        console.log(
          loggerName,
          style.debug,
          `[${LogLevelEnum.DEBUG}]`,
          name,
          details,
        )
      }
    },

    debug: (name: string, details?: LogDetailsType) => {
      if (import.meta.env.DEV) {
        console.log(
          loggerName,
          style.debug,
          `[${LogLevelEnum.DEBUG}]`,
          name,
          details,
        )
        notify({ message: name, icon: debugIcon, color: 'accent' })
      }
    },

    info: async (name: string, details?: LogDetailsType) => {
      if (getConsoleLogsSetting()) {
        console.log(
          loggerName,
          style.info,
          `[${LogLevelEnum.INFO}]`,
          name,
          details,
        )
      }
      const log = new Log({
        logLevel: LogLevelEnum.INFO,
        label: name,
        details,
      })
      await DB.table(TableEnum.LOGS).add(log)
      if (getInfoPopupsSetting()) {
        notify({ message: name, icon: infoIcon, color: 'info' })
      }
    },

    warn: async (name: string, details?: LogDetailsType) => {
      if (getConsoleLogsSetting()) {
        console.warn(
          loggerName,
          style.warn,
          `[${LogLevelEnum.WARN}]`,
          name,
          details,
        )
      }
      const log = new Log({
        logLevel: LogLevelEnum.WARN,
        label: name,
        details,
      })
      await DB.table(TableEnum.LOGS).add(log)
      notify({ message: name, icon: warnIcon, color: 'warning' })
    },

    error: async (name: string, details?: LogDetailsType) => {
      if (getConsoleLogsSetting()) {
        console.error(
          loggerName,
          style.error,
          `[${LogLevelEnum.ERROR}]`,
          name,
          details,
        )
      }
      const log = new Log({
        logLevel: LogLevelEnum.ERROR,
        label: name,
        details,
      })
      await DB.table(TableEnum.LOGS).add(log)
      notify({ message: name, icon: errorIcon, color: 'negative' })
    },
  }

  return { log }
}
