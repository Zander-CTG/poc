<script setup lang="ts">
import { closeIcon, inspectIcon } from '@/shared/icons'
import { useRecordStore } from '@/stores/record'
import useLogger from '@/use/useLogger'
import { useDialogPluginComponent } from 'quasar'
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  record: {
    id: string
    metadata: Record<string, any>
    url: string
    created_at: string
  }
}>()

defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const { log } = useLogger()
const recordStore = useRecordStore()

onMounted(async () => {
  try {
    recordStore.record = props.record
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
              <q-item v-if="record?.url" class="q-mb-sm">
                <q-item-section top>
                  <q-item-label>
                    <q-img
                      :src="record.url"
                      alt="Uploaded Image"
                      class="uploaded-image"
                    />
                  </q-item-label>
                </q-item-section>
              </q-item>

              <!-- <div v-if="recordStore.record">
                <InspectItemString label="Id" recordKey="id" />
                <InspectItemDate label="Created Date" recordKey="createdAt" />
                <InspectItemList
                  label="Visible Text"
                  recordKey="visible_text"
                />
              </div> -->
            </q-list>

            <!-- <q-separator />

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
            </q-list> -->
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
