<script setup lang="ts">
import { closeIcon, inspectIcon } from '@/shared/icons'
import { useBackend } from '@/stores/backend'
import { useRecordStore } from '@/stores/record'
import useLogger from '@/use/useLogger'
import { useDialogPluginComponent } from 'quasar'
import { onMounted, onUnmounted, ref, type Ref } from 'vue'
import InspectItemList from './inspect/InspectItemList.vue'
import InspectItemString from './inspect/InspectItemString.vue'

const props = defineProps<{
  record: {
    id: string
    user_id: string
    image_metadata_id: string
    created_at: string
    label: string
    brand: string
    type: string
    description: string
    categories: string[]
  }
}>()

defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const { log } = useLogger()
const recordStore = useRecordStore()
const { fetchSingleImage } = useBackend()

const imageUrl: Ref<string | null> = ref(null)

onMounted(async () => {
  try {
    recordStore.record = props.record
    const imageData = await fetchSingleImage(props.record.image_metadata_id)
    imageUrl.value = imageData?.signedUrl || null
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
      <q-toolbar-title>Inspect Item</q-toolbar-title>
      <q-btn flat round :icon="closeIcon" @click="onDialogCancel" />
    </q-toolbar>

    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="row justify-center">
          <div class="responsive-container">
            <q-list padding>
              <q-item v-if="imageUrl">
                <q-img
                  :src="imageUrl"
                  alt="Image Associated with Item"
                  style="max-width: 100%"
                />
              </q-item>

              <div v-if="recordStore.record">
                <InspectItemString label="Label" recordKey="label" />
                <InspectItemString label="Brand" recordKey="brand" />
                <InspectItemString label="Type" recordKey="type" />
                <InspectItemString
                  label="Description"
                  recordKey="description"
                />
                <InspectItemList label="Categories" recordKey="categories" />
                <InspectItemString
                  label="Created Date"
                  recordKey="created_at"
                />
                <InspectItemString label="Id" recordKey="id" />
                <InspectItemString label="User Id" recordKey="user_id" />
                <InspectItemString
                  label="Image Id"
                  recordKey="image_metadata_id"
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
