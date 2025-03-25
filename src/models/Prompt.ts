import { TableEnum } from '@/shared/enums'
import type { IdType, TimestampType } from '@/shared/types'
import { createId } from '@/shared/utils'

interface ChildPromptParams {
  id?: IdType
  createdAt?: TimestampType
  image_id: IdType // Parent reference required, never defaulted
  model: string
  system_prompt: string
  user_prompt: string
  max_tokens: number
  response_time?: number
  response_data?: Record<string, any>
}

/**
 * The child prompt of a parent images.
 */
export class ChildPrompt {
  id: IdType
  createdAt: TimestampType
  image_id: IdType
  model: string
  system_prompt: string
  user_prompt: string
  max_tokens: number
  response_time?: number
  response_data?: Record<string, any>

  constructor(params: ChildPromptParams) {
    this.id = params.id ?? createId(TableEnum.PROMPTS)
    this.createdAt = params.createdAt ?? Date.now()
    this.image_id = params.image_id // Parent reference required, never defaulted
    this.model = params.model ?? ''
    this.system_prompt = params.system_prompt ?? ''
    this.user_prompt = params.user_prompt ?? ''
    this.max_tokens = params.max_tokens ?? 0
    this.response_time = params.response_time ?? undefined
    this.response_data = params.response_data ?? undefined
  }
}
