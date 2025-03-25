import { ParentImage } from '@/models/Image'
import { ChildItem } from '@/models/Item'
import { Log } from '@/models/Log'
import { ChildPrompt } from '@/models/Prompt'
import { Setting } from '@/models/Setting'
import { appDatabaseVersion, appName } from '@/shared/constants'
import { TableEnum } from '@/shared/enums'
import Dexie, { type Table } from 'dexie'

/**
 * The database for the application defining the tables that are available and the models that are
 * mapped to those tables. An instance of this class is created and exported at the end of the file.
 */
export class Database extends Dexie {
  // Required for easier TypeScript usage
  [TableEnum.SETTINGS]!: Table<Setting>;
  [TableEnum.LOGS]!: Table<Log>;
  [TableEnum.IMAGES]!: Table<ParentImage>;
  [TableEnum.ITEMS]!: Table<ChildItem>;
  [TableEnum.PROMPTS]!: Table<ChildPrompt>

  constructor(name: string) {
    super(name)

    this.version(1).stores({
      [TableEnum.SETTINGS]: '&id',
      [TableEnum.LOGS]: '&id, createdAt',
      [TableEnum.IMAGES]: '&id',
      [TableEnum.ITEMS]: '&id, created, image_id',
      [TableEnum.PROMPTS]: '&id, created, image_id',
    })

    this[TableEnum.SETTINGS].mapToClass(Setting)
    this[TableEnum.LOGS].mapToClass(Log)
    this[TableEnum.IMAGES].mapToClass(ParentImage)
    this[TableEnum.ITEMS].mapToClass(ChildItem)
    this[TableEnum.PROMPTS].mapToClass(ChildPrompt)
  }
}

/**
 * Pre-instantiated database instance that can be used throughout the application.
 */
export const DB = new Database(`${appName} v${appDatabaseVersion}`)
