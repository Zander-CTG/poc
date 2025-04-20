import { ParentImage } from '@/models/Image'
import { ChildItem } from '@/models/Item'
import { Log } from '@/models/Log'
import { Prompt } from '@/models/Prompt'
import { Setting } from '@/models/Setting'
import {
  appDatabaseVersion,
  appName,
  systemPrompt,
  userPrompt,
} from '@/shared/constants'
import {
  DurationEnum,
  DurationMSEnum,
  SettingIdEnum,
  TableEnum,
} from '@/shared/enums'
import type { LogType, SettingType, SettingValueType } from '@/shared/types'
import Dexie, { liveQuery, type Observable, type Table } from 'dexie'

/**
 * The database for the application defining the tables that are available and the models that are
 * mapped to those tables. An instance of this class is created and exported at the end of the file.
 */
export class Database extends Dexie {
  // Required for easier TypeScript usage
  [TableEnum.SETTINGS]!: Table<Setting>;
  [TableEnum.LOGS]!: Table<Log>;
  [TableEnum.PROMPTS]!: Table<Prompt>

  constructor(name: string) {
    super(name)

    this.version(1).stores({
      [TableEnum.SETTINGS]: '&id',
      [TableEnum.LOGS]: '&id, createdAt',
      [TableEnum.PROMPTS]: '&id, createdAt',
    })

    this[TableEnum.SETTINGS].mapToClass(Setting)
    this[TableEnum.LOGS].mapToClass(Log)
    this[TableEnum.PROMPTS].mapToClass(Prompt)
  }

  /**
   * Initializes the settings in the database. If the settings already exist, they are not
   * overwritten. If the settings do not exist, they are created with default values.
   * @note This MUST be called in `App.vue` on startup
   */
  async initializeSettings(): Promise<void> {
    const defaultSettings: {
      [key in SettingIdEnum]: SettingValueType
    } = {
      // For App
      [SettingIdEnum.CONSOLE_LOGS]: false,
      [SettingIdEnum.INFO_POPUPS]: true,
      [SettingIdEnum.LOG_RETENTION_DURATION]:
        DurationEnum[DurationEnum['Six Months']],
      [SettingIdEnum.LOGIN_OVERLAY]: false,
      // For Supabase
      [SettingIdEnum.USER_EMAIL]: '',
      [SettingIdEnum.PROJECT_URL]: '',
      [SettingIdEnum.PROJECT_ANON_API_KEY]: '',
      // For OpenAI
      [SettingIdEnum.OPENAI_API_KEY]: '',
      [SettingIdEnum.SYSTEM_PROMPT]: systemPrompt,
      [SettingIdEnum.USER_PROMPT]: userPrompt,
      [SettingIdEnum.MAX_TOKENS]: 2048,
      [SettingIdEnum.MODEL_NAME]: 'gpt-4-turbo',
    }

    const settingids = Object.values(SettingIdEnum)

    // Get all settings or create them with default values
    const settings = await Promise.all(
      settingids.map(async (id) => {
        const setting = await this.table(TableEnum.SETTINGS).get(id)
        if (setting) {
          return setting
        } else {
          return new Setting({
            id,
            value: defaultSettings[id],
          })
        }
      }),
    )

    await Promise.all(
      settings.map((setting) => this.table(TableEnum.SETTINGS).put(setting)),
    )
  }

  /**
   * Deletes all logs that are older than the retention time set in the settings. If the
   * retention time is set to 'Forever', no logs will be deleted.
   * @returns The number of logs deleted
   */
  async deleteExpiredLogs() {
    const setting = await this.table(TableEnum.SETTINGS).get(
      SettingIdEnum.LOG_RETENTION_DURATION,
    )
    const logRetentionDuration = setting?.value as DurationEnum

    if (
      !logRetentionDuration ||
      logRetentionDuration === DurationEnum.Forever
    ) {
      return 0 // No logs purged
    }

    const allLogs = await this.table(TableEnum.LOGS).toArray()
    const maxLogAgeMs = DurationMSEnum[logRetentionDuration]
    const now = Date.now()

    // Find Logs that are older than the retention time and map them to their keys
    const removableLogs = allLogs
      .filter((log: LogType) => {
        const logTimestamp = log.createdAt ?? 0
        const logAge = now - logTimestamp
        return logAge > maxLogAgeMs
      })
      .map((log: LogType) => log.id) // Map remaining Log ids for removal

    await this.table(TableEnum.LOGS).bulkDelete(removableLogs)
    return removableLogs.length // Number of logs deleted
  }

  /**
   * Returns an observable of the logs in the database. The logs are ordered by createdAt in
   * descending order. This is a live query, so it will update automatically when the database
   * changes.
   */
  liveLogs(): Observable<LogType[]> {
    return liveQuery(() =>
      this.table(TableEnum.LOGS).orderBy('createdAt').reverse().toArray(),
    )
  }

  /**
   * Returns an observable of the images in the database. The images are ordered by createdAt in
   * descending order. This is a live query, so it will update automatically when the database
   * changes.
   */
  liveSettings(): Observable<SettingType[]> {
    return liveQuery(() => this.table(TableEnum.SETTINGS).toArray())
  }

  /**
   * Returns an observable of the images in the database. The images are ordered by createdAt in
   * descending order. This is a live query, so it will update automatically when the database
   * changes.
   */
  livePrompts(): Observable<Prompt[]> {
    return liveQuery(() =>
      this.table(TableEnum.PROMPTS).orderBy('createdAt').reverse().toArray(),
    )
  }

  /**
   * Returns an observable of the images in the database. The images are ordered by createdAt in
   * descending order. This is a live query, so it will update automatically when the database
   * changes.
   */
  liveImages(): Observable<ParentImage[]> {
    return liveQuery(() =>
      this.table(TableEnum.IMAGES).orderBy('createdAt').reverse().toArray(),
    )
  }

  /**
   * Returns an observable of the items in the database. The items are ordered by createdAt in
   * descending order. This is a live query, so it will update automatically when the database
   * changes.
   */
  liveItems(): Observable<ChildItem[]> {
    return liveQuery(() =>
      this.table(TableEnum.ITEMS).orderBy('createdAt').reverse().toArray(),
    )
  }
}

/**
 * Pre-instantiated database instance that can be used throughout the application.
 */
export const DB = new Database(`${appName} v${appDatabaseVersion}`)
