import { TableEnum } from '@/shared/enums'
import { settingsPageIcon, settingsTableIcon } from '@/shared/icons'
import { settingSchema } from '@/shared/schemas'
import { tableColumn } from '@/shared/utils'
import { BaseService } from './BaseService'

export class SettingService extends BaseService {
  public constructor() {
    super()
  }

  labelSingular = 'Setting'
  labelPlural = 'Settings'
  displayIcon = settingsPageIcon
  tableIcon = settingsTableIcon
  modelSchema = settingSchema
  parentTable = null!
  table = TableEnum.SETTINGS
  childTable = null!
  tableColumns = [
    tableColumn('id', 'Setting Name'),
    tableColumn('value', 'Setting Value', 'SETTING'),
  ]
  supportsColumnFilters = false
  supportsActivityCharts = false
  supportsCharts = false
  supportsInspect = false
  supportsCreate = false
  supportsEdit = false
  supportsDelete = false
}

/**
 * Singleton instance exported for convenience.
 */
export const SettingSI = SettingService.instance()
