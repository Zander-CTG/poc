import { Setting } from '@/models/Setting'
import { systemPrompt, userPrompt } from '@/shared/constants'
import {
  DurationEnum,
  DurationMSEnum,
  SettingIdEnum,
  TableEnum,
} from '@/shared/enums'
import type {
  IdType,
  LogType,
  ServiceType,
  SettingValueType,
} from '@/shared/types'
import { liveQuery, type Observable } from 'dexie'
import type { QDialogOptions, QTableColumn } from 'quasar'
import type { z } from 'zod'
import { DB, Database } from './db'

/**
 * Abstract base class for all Services to extend. This defines properties and database methods that
 * other Services may use. Only need to override the methods that are needed for the specific
 * extending Service (like dialog options).
 */
export abstract class BaseService {
  /**
   * Map of instances of each Service class. This is used to ensure that only one instance of each
   * Service class is created and used throughout the application.
   */
  private static _instances: Map<new () => BaseService, BaseService> = new Map()

  /**
   * Database instance used by all Services. This is set when the first Service is created by
   * the protected constructor.
   */
  private static _database: Database = null!

  protected constructor(database: Database = DB) {
    if (!BaseService._database) {
      BaseService._database = database
    }
  }

  /**
   * Singleton pattern that returns an instance of a class that extends the BaseService class.
   */
  static instance<S extends BaseService>(this: new () => S): S {
    if (!BaseService._instances.has(this)) {
      BaseService._instances.set(this, new this())
    }
    return BaseService._instances.get(this) as S
  }

  /**
   * Convenience method for accessing the Database instance.
   */
  protected get db(): Database {
    return BaseService._database
  }

  abstract labelSingular: string
  abstract labelPlural: string
  abstract displayIcon: string
  abstract tableIcon: string
  abstract modelSchema: z.ZodSchema<any>
  abstract parentTable: TableEnum
  abstract table: TableEnum
  abstract childTable: TableEnum
  abstract tableColumns: QTableColumn[]
  abstract supportsColumnFilters: boolean
  abstract supportsActivityCharts: boolean
  abstract supportsCharts: boolean
  abstract supportsInspect: boolean
  abstract supportsCreate: boolean
  abstract supportsEdit: boolean
  abstract supportsDelete: boolean

  isParentTable(): boolean {
    return !this.parentTable && this.childTable
  }

  isChildTable(): boolean {
    return !this.childTable && this.parentTable
  }

  isStandaloneTable(): boolean {
    return !this.parentTable && !this.childTable
  }

  parentService(): ServiceType {
    throw new Error(`Not supported by the ${this.labelSingular} Service`)
  }

  childService(): ServiceType {
    throw new Error(`Not supported by the ${this.labelSingular} Service`)
  }

  activityChartsDialogOptions(): QDialogOptions {
    throw new Error(`Not supported by the ${this.labelSingular} Service`)
  }

  // eslint-disable-next-line
  chartsDialogOptions(id: IdType): QDialogOptions {
    throw new Error(`Not supported by the ${this.labelSingular} Service`)
  }

  // eslint-disable-next-line
  inspectDialogOptions(id: IdType): QDialogOptions {
    throw new Error(`Not supported by the ${this.labelSingular} Service`)
  }

  // eslint-disable-next-line
  createDialogOptions(parentId?: IdType): QDialogOptions {
    throw new Error(`Not supported by the ${this.labelSingular} Service`)
  }

  // eslint-disable-next-line
  editDialogOptions(id: IdType): QDialogOptions {
    throw new Error(`Not supported by the ${this.labelSingular} Service`)
  }

  // eslint-disable-next-line
  deleteDialogOptions(id: IdType): QDialogOptions {
    throw new Error(`Not supported by the ${this.labelSingular} Service`)
  }

  // eslint-disable-next-line
  toggleFavoriteDialogOptions(id: IdType): QDialogOptions {
    throw new Error(`Not supported by the ${this.labelSingular} Service`)
  }

  // eslint-disable-next-line
  async getChartDatasets(parentId: IdType): Promise<{
    threeMonths: {
      x: any
      y: any
    }[]
    oneYear: {
      x: any
      y: any
    }[]
    allTime: {
      x: any
      y: any
    }[]
    hasRecords: boolean
    hasRecordsBeyondThreeMonths: boolean
    hasRecordsBeyondOneYear: boolean
  }> {
    throw new Error(`Not supported by the ${this.labelSingular} Service`)
  }

  /**
   * Returns a live query of ordered records.
   */
  liveTable<T>(): Observable<T[]> {
    if (this.isParentTable()) {
      return liveQuery(() =>
        this.db.table(this.table).orderBy('name').toArray(),
      )
    } else if (this.isChildTable() || this.table === TableEnum.LOGS) {
      return liveQuery(() =>
        this.db.table(this.table).orderBy('createdAt').reverse().toArray(),
      )
    } else {
      return liveQuery(() => this.db.table(this.table).toArray())
    }
  }

  /**
   * Purges logs based on the log retention duration setting. Returns the number of logs purged.
   * Settings must be initialized app wide before calling this method.
   */
  async purge() {
    if (this.table === TableEnum.LOGS) {
      const setting = await this.db
        .table(TableEnum.SETTINGS)
        .get(SettingIdEnum.LOG_RETENTION_DURATION)
      const logRetentionDuration = setting?.value as DurationEnum

      if (
        !logRetentionDuration ||
        logRetentionDuration === DurationEnum.Forever
      ) {
        return 0 // No logs purged
      }

      const allLogs = await this.db.table(TableEnum.LOGS).toArray()
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

      await this.db.table(TableEnum.LOGS).bulkDelete(removableLogs)
      return removableLogs.length // Number of logs deleted
    } else {
      throw new Error(`Not supported by the ${this.labelSingular} Service`)
    }
  }

  /**
   * Initializes the table with default data if supported.
   */
  async initialize(): Promise<void> {
    if (this.table === TableEnum.SETTINGS) {
      const defaultSettings: {
        [key in SettingIdEnum]: SettingValueType
      } = {
        [SettingIdEnum.ADVANCED_MODE]: false,
        [SettingIdEnum.INSTRUCTIONS_OVERLAY]: true,
        [SettingIdEnum.CONSOLE_LOGS]: false,
        [SettingIdEnum.INFO_MESSAGES]: true,
        [SettingIdEnum.LOG_RETENTION_DURATION]:
          DurationEnum[DurationEnum['Six Months']],
        [SettingIdEnum.API_KEY]: 'NOT SET',
        [SettingIdEnum.SYSTEM_PROMPT]: systemPrompt,
        [SettingIdEnum.USER_PROMPT]: userPrompt,
        [SettingIdEnum.MAX_TOKENS]: 2048,
        [SettingIdEnum.MODEL_NAME]: 'gpt-4-turbo',
      }

      const settingids = Object.values(SettingIdEnum)

      // Get all settings or create them with default values
      const settings = await Promise.all(
        settingids.map(async (id) => {
          const setting = await this.db.table(TableEnum.SETTINGS).get(id)
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
        settings.map((setting) =>
          this.db.table(TableEnum.SETTINGS).put(setting),
        ),
      )
    } else {
      Promise.resolve() // No initialization
    }
  }

  /**
   * Returns a record by ID.
   */
  async getRecord<T>(id: IdType): Promise<T> {
    const recordToGet = await this.db.table(this.table).get(id)
    if (!recordToGet) {
      throw new Error(`${this.labelSingular} ID not found: ${id}`)
    }
    return recordToGet!
  }

  /**
   * Creates a new record in the database.
   */
  async addRecord<T>(record: T): Promise<T> {
    const validatedRecord = this.modelSchema.parse(record)

    if (this.isParentTable()) {
      await this.db.transaction(
        'rw',
        this.db.table(this.table),
        this.db.table(this.childTable),
        async () => {
          await this.db.table(this.table).add(validatedRecord)
        },
      )
    } else if (this.isChildTable()) {
      await this.db.transaction(
        'rw',
        this.db.table(this.table),
        this.db.table(this.parentTable),
        async () => {
          await this.db.table(this.table).add(validatedRecord)
        },
      )
    } else {
      await this.db.table(this.table).add(validatedRecord)
    }

    return validatedRecord
  }

  /**
   * Creates or overwrites a record in the database.
   */
  async putRecord<T>(record: T): Promise<T> {
    const validatedRecord = this.modelSchema.parse(record)

    if (this.isParentTable()) {
      await this.db.transaction(
        'rw',
        this.db.table(this.table),
        this.db.table(this.childTable),
        async () => {
          await this.db.table(this.table).put(validatedRecord)
        },
      )
    } else if (this.isChildTable()) {
      await this.db.transaction(
        'rw',
        this.db.table(this.table),
        this.db.table(this.parentTable),
        async () => {
          await this.db.table(this.table).put(validatedRecord)
        },
      )
    } else {
      await this.db.table(this.table).put(validatedRecord)
    }

    return validatedRecord
  }

  /**
   * Updates a record by ID with the provided properties.
   */
  async updateRecord<T>(id: IdType, props: Partial<T>): Promise<T> {
    const recordToUpdate = await this.db.table(this.table).get(id)
    if (!recordToUpdate) {
      throw new Error(`${this.labelSingular} ID not found: ${id}`)
    }
    const updatedRecord = { ...recordToUpdate, ...props }

    if (this.isParentTable()) {
      await this.db.transaction(
        'rw',
        this.db.table(this.table),
        this.db.table(this.childTable),
        async () => {
          await this.db.table(this.table).update(id, updatedRecord)
        },
      )
    } else if (this.isChildTable()) {
      await this.db.transaction(
        'rw',
        this.db.table(this.table),
        this.db.table(this.parentTable),
        async () => {
          await this.db.table(this.table).update(id, updatedRecord)
        },
      )
    } else {
      await this.db.table(this.table).update(id, updatedRecord)
    }

    return updatedRecord
  }

  /**
   * Removes the record by ID. Associated records will be updated or removed as needed.
   */
  async removeRecord<T>(id: IdType): Promise<T> {
    const recordToDelete = await this.db.table(this.table).get(id)

    if (this.isParentTable()) {
      await this.db.transaction(
        'rw',
        this.db.table(this.table),
        this.db.table(this.childTable),
        async () => {
          await this.db.table(this.table).delete(id)
          await this.db
            .table(this.childTable)
            .where('parentId')
            .equals(id)
            .delete()
        },
      )
    } else if (this.isChildTable()) {
      await this.db.transaction(
        'rw',
        this.db.table(this.table),
        this.db.table(this.parentTable),
        async () => {
          await this.db.table(this.table).delete(id)
        },
      )
    } else {
      await this.db.table(this.table).delete(id)
    }

    return recordToDelete
  }

  /**
   * Removes all records from the table and reinitializes it.
   */
  async clearTable() {
    await this.db.table(this.table).clear()

    if (this.isParentTable()) {
      // Clear child table when parent table is cleared
      await this.db.table(this.childTable).clear()
    } else if (this.isChildTable()) {
      // Remove lastChild property from parent records when child table is cleared
      await this.db
        .table(this.parentTable)
        .toArray()
        .then((records) => {
          records.map((record) => delete record.lastChild)
        })
    }

    await this.initialize()
  }
}
