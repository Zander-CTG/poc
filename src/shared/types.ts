import { z } from 'zod'
import type {
  idSchema,
  logDetailsSchema,
  logLabelSchema,
  logLevelSchema,
  logSchema,
  routeNameSchema,
  settingIdSchema,
  settingSchema,
  settingValueSchema,
  tableSchema,
  textAreaSchema,
  textLineSchema,
  timestampSchema,
} from './schemas'

//
// Shared
//

export type TableType = z.infer<typeof tableSchema>
export type RouteNameType = z.infer<typeof routeNameSchema>
export type IdType = z.infer<typeof idSchema>
export type TimestampType = z.infer<typeof timestampSchema>
export type TextLineType = z.infer<typeof textLineSchema>
export type TextAreaType = z.infer<typeof textAreaSchema>

//
// Settings
//

export type SettingIdType = z.infer<typeof settingIdSchema>
export type SettingValueType = z.infer<typeof settingValueSchema>
export type SettingType = z.infer<typeof settingSchema>

//
// Logs
//

export type LogLevelType = z.infer<typeof logLevelSchema>
export type LogLabelType = z.infer<typeof logLabelSchema>
export type LogDetailsType = z.infer<typeof logDetailsSchema>
export type LogType = z.infer<typeof logSchema>

// TODO
