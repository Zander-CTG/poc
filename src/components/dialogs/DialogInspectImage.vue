<script setup lang="ts">
import InspectItemList from '@/components/dialogs/inspect/InspectItemList.vue'
import InspectItemString from '@/components/dialogs/inspect/InspectItemString.vue'
import { closeIcon, inspectIcon } from '@/shared/icons'
import { truncateText } from '@/shared/utils'
import { useBackend } from '@/stores/backend'
import { useRecordStore } from '@/stores/record'
import useLogger from '@/use/useLogger'
import { useDialogPluginComponent } from 'quasar'
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  record: {
    id: string
    user_id: string
    visible_text: string[]
    created_at: string
    url: string
  }
}>()

defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const { log } = useLogger()
const recordStore = useRecordStore()
const { fetchImageItems } = useBackend()

onMounted(async () => {
  try {
    recordStore.record = props.record
    recordStore.items = await fetchImageItems(props.record.id)
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
              <q-item>
                <q-img
                  v-if="record?.url"
                  :src="record.url"
                  alt="Uploaded Image"
                  class="uploaded-image"
                />
              </q-item>

              <div v-if="recordStore.record">
                <InspectItemString label="Id" recordKey="id" />
                <InspectItemString label="User Id" recordKey="user_id" />
                <InspectItemString
                  label="Created Date"
                  recordKey="created_at"
                />
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
.uploaded-image {
  max-width: 100%;
  object-fit: contain;
}
.toolbar-height {
  max-height: 50px;
}
.responsive-container {
  width: 100%;
  max-width: 800px;
}
</style>
