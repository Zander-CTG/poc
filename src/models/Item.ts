import { TableEnum } from '@/shared/enums'
import type { IdType, TimestampType } from '@/shared/types'
import { createId } from '@/shared/utils'

interface ChildItemParams {
  id?: IdType
  createdAt?: TimestampType
  image_id: IdType // Parent reference required, never defaulted
  type?: string
  brand?: string
  label?: string
  description?: string
  categories?: string[]
}

/**
 * The child item of a parent image.
 */
export class ChildItem {
  id: IdType
  createdAt: TimestampType
  image_id: IdType
  type?: string
  brand?: string
  label?: string
  description?: string
  categories?: string[]

  constructor(params: ChildItemParams) {
    this.id = params.id ?? createId(TableEnum.ITEMS)
    this.createdAt = params.createdAt ?? Date.now()
    this.image_id = params.image_id // Parent reference required, never defaulted
    this.type = params.type ?? undefined
    this.brand = params.brand ?? undefined
    this.label = params.label ?? undefined
    this.description = params.description ?? undefined
    this.categories = params.categories ?? []
  }
}
