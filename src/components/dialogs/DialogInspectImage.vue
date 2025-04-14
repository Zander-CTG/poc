<script setup lang="ts">
import type { ParentImage } from '@/models/Image'
import type { ChildItem } from '@/models/Item'
import { DB } from '@/services/db'
import { TableEnum } from '@/shared/enums'
import { closeIcon, inspectIcon } from '@/shared/icons'
import type { IdType } from '@/shared/types'
import { truncateText } from '@/shared/utils'
import { useRecordStore } from '@/stores/record'
import useLogger from '@/use/useLogger'
import { useDialogPluginComponent } from 'quasar'
import { onMounted, onUnmounted, ref, type Ref } from 'vue'
import InspectItemDate from './inspect/InspectItemDate.vue'
import InspectItemList from './inspect/InspectItemList.vue'
import InspectItemString from './inspect/InspectItemString.vue'

const props = defineProps<{
  id: IdType
}>()

defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const { log } = useLogger()
const recordStore = useRecordStore()

const imageUrl: Ref<string | null> = ref(null)

onMounted(async () => {
  try {
    recordStore.record = (await DB.table(TableEnum.IMAGES)
      .where('id')
      .equals(props.id)
      .first()) as ParentImage

    const items = (await DB.table(TableEnum.ITEMS)
      .where('image_id')
      .equals(props.id)
      .toArray()) as ChildItem[]

    recordStore.items = items

    if (recordStore.record?.file) {
      imageUrl.value = URL.createObjectURL(recordStore.record.file)
    }
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
      <q-toolbar-title>Inspect Image</q-toolbar-title>
      <q-btn flat round :icon="closeIcon" @click="onDialogCancel" />
    </q-toolbar>

    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="row justify-center">
          <div class="responsive-container">
            <q-list padding>
              <q-item v-if="imageUrl" class="q-mb-sm">
                <q-item-section top>
                  <q-item-label>
                    <img
                      :src="imageUrl"
                      alt="Uploaded Image"
                      style="max-width: 100%"
                    />
                  </q-item-label>
                </q-item-section>
              </q-item>

              <div v-if="recordStore.record">
                <InspectItemString label="Id" recordKey="id" />
                <InspectItemDate label="Created Date" recordKey="createdAt" />
                <InspectItemList
                  label="Visible Text"
                  recordKey="visible_text"
                />
              </div>
            </q-list>

            <q-separator />

            <q-list padding>
              <q-item
                v-for="item in recordStore.items"
                :key="item.id"
                class="q-mb-sm"
              >
                <q-item-section top>
                  <q-item-label>{{ item.label }}</q-item-label>
                  <q-item-label caption>{{ item.type }}</q-item-label>
                  <q-item-label caption>{{ item.brand }}</q-item-label>
                  <q-item-label caption>{{
                    item.categories &&
                    truncateText(item.categories.join(', '), 100, '...')
                  }}</q-item-label>
                  <q-item-label caption>{{ item.description }}</q-item-label>
                </q-item-section>
              </q-item>
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
