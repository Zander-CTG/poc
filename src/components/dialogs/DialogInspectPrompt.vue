<script setup lang="ts">
import type { ChildPrompt } from '@/models/Prompt'
import { DB } from '@/services/db'
import { TableEnum } from '@/shared/enums'
import { closeIcon, inspectIcon } from '@/shared/icons'
import type { IdType } from '@/shared/types'
import { useRecordStore } from '@/stores/record'
import useLogger from '@/use/useLogger'
import { useDialogPluginComponent } from 'quasar'
import { onMounted, onUnmounted } from 'vue'
import InspectItemDate from './inspect/InspectItemDate.vue'
import InspectItemNumber from './inspect/InspectItemNumber.vue'
import InspectItemObject from './inspect/InspectItemObject.vue'
import InspectItemString from './inspect/InspectItemString.vue'

const props = defineProps<{
  id: IdType
}>()

defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const { log } = useLogger()
const recordStore = useRecordStore()

onMounted(async () => {
  try {
    recordStore.record = (await DB.table(TableEnum.PROMPTS)
      .where('id')
      .equals(props.id)
      .first()) as ChildPrompt
  } catch (error) {
    log.error('Error loading record', error as Error)
  }
})

onUnmounted(() => {
  recordStore.$reset()
})
</script>

<template>
  <q-dialog
    ref="dialogRef"
    transition-show="slide-up"
    transition-hide="slide-down"
    maximized
    @hide="onDialogHide"
  >
    <q-toolbar class="bg-info text-white toolbar-height">
      <q-icon :name="inspectIcon" size="sm" class="q-mx-sm" />
      <q-toolbar-title>Inspect Prompt</q-toolbar-title>
      <q-btn flat round :icon="closeIcon" @click="onDialogCancel" />
    </q-toolbar>

    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="row justify-center">
          <div class="responsive-container">
            <q-list padding>
              <div v-if="recordStore.record">
                <InspectItemString label="Id" recordKey="id" />
                <InspectItemString label="Image Id" recordKey="image_id" />
                <InspectItemDate label="Created Date" recordKey="createdAt" />
                <InspectItemString label="Model" recordKey="model" />
                <InspectItemString
                  label="System Prompt"
                  recordKey="system_prompt"
                />
                <InspectItemString
                  label="User Prompt"
                  recordKey="user_prompt"
                />
                <InspectItemNumber label="Max Tokens" recordKey="max_tokens" />
                <InspectItemNumber
                  label="Response Time"
                  recordKey="response_time"
                />
                <InspectItemObject
                  label="Response Data"
                  recordKey="response_data"
                />
              </div>
            </q-list>
            <div class="q-mt-xl" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.toolbar-height {
  max-height: 50px;
}
.responsive-container {
  width: 100%;
  max-width: 800px;
}
</style>
