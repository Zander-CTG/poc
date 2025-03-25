import { TableEnum } from '@/shared/enums'
import type { IdType, TimestampType } from '@/shared/types'
import { createId } from '@/shared/utils'

interface ParentImageParams {
  id?: IdType
  createdAt?: TimestampType
  file: File // required
  visible_text?: string[]
}

/**
 * The parent image of potentially multiple child items.
 */
export class ParentImage {
  id: IdType
  createdAt: TimestampType
  file: File // required
  visible_text?: string[]

  constructor(params: ParentImageParams) {
    this.id = params.id ?? createId(TableEnum.IMAGES)
    this.createdAt = params.createdAt ?? Date.now()
    this.file = params.file // required
    this.visible_text = params.visible_text ?? []
  }
}
