<script setup lang="ts">
import PageResponsive from '@/components/page/PageResponsive.vue'
import { ParentImage } from '@/models/Image'
import { ChildItem } from '@/models/Item'
import { ChildPrompt } from '@/models/Prompt'
import { DB } from '@/services/db'
import { appName } from '@/shared/constants'
import { TableEnum } from '@/shared/enums'
import { importFileIcon } from '@/shared/icons'
import type { IdType } from '@/shared/types'
import { useBackend } from '@/stores/backend'
import { useSettingsStore } from '@/stores/settings'
import useLogger from '@/use/useLogger'
import { QSpinnerGears, useMeta, useQuasar } from 'quasar'
import { ref, type Ref } from 'vue'

useMeta({ title: `${appName} - Upload` })

const $q = useQuasar()
const { log } = useLogger()
const settingsStore = useSettingsStore()
const backendStore = useBackend()

const importImage: Ref<File> = ref(null!)
const imageUrl: Ref<string | null> = ref(null)

const trackedImageId: Ref<IdType> = ref(null!)
const trackedPromptId: Ref<IdType> = ref(null!)

/**
 * Handles rejected files during import and logs a warning.
 */
function onRejectedFile(entries: any) {
  const name = entries?.[0]?.file?.name
  const size = entries?.[0]?.file?.size
  const type = entries?.[0]?.file?.type
  log.warn(`Cannot import ${name}`, { name, size, type })
  importImage.value = null! // Clear input
}

/**
 * Retrieves the base64 representation of the uploaded image.
 */
async function getBase64(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve(reader.result?.toString().split(',')[1] || null)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

/**
 * Processes the uploaded image and saves the resulting records to the database.
 */
async function processImage() {
  try {
    $q.loading.show({
      spinner: QSpinnerGears,
      message: 'Processing Image',
    })

    imageUrl.value = URL.createObjectURL(importImage.value)

    const jsonPayload = {
      model: settingsStore.modelName,
      messages: [
        {
          role: 'system',
          content: settingsStore.systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: settingsStore.userPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${importImage.value.type};base64,${await getBase64(importImage.value)}`,
              },
            },
          ],
        },
      ],
      max_tokens: settingsStore.maxTokens,
      temperature: 0,
    }

    // Create the initial image and prompt records
    const localImageRecord = new ParentImage({ file: importImage.value })
    const localPromptRecord = new ChildPrompt({
      image_id: localImageRecord.id,
      model: settingsStore.modelName as string,
      user_prompt: settingsStore.userPrompt as string,
      system_prompt: settingsStore.systemPrompt as string,
      max_tokens: settingsStore.maxTokens as number,
    })

    // Create initial records in the database
    await DB.table(TableEnum.IMAGES).add(localImageRecord)
    await DB.table(TableEnum.PROMPTS).add(localPromptRecord)
    trackedImageId.value = localImageRecord.id
    trackedPromptId.value = localPromptRecord.id

    log.info('Processing Image', {
      imageRecord: localImageRecord,
      promptRecord: localPromptRecord,
    })

    // Measure the time taken for the API call
    const startTime = Date.now()

    // Call the API with the payload
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settingsStore.aiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonPayload),
    })

    const data = await response.json()

    localPromptRecord.response_data = data
    localPromptRecord.response_time = Date.now() - startTime

    log.info('API Responsed', {
      timeTaken: localPromptRecord.response_time,
      jsonContent:
        localPromptRecord?.response_data?.choices?.[0]?.message?.content ||
        'NO DATA',
    })

    // Process items from the response
    const localItemRecords = processResponseItems(
      localImageRecord,
      localPromptRecord,
    )

    // Store the updated records in the database
    await DB.table(TableEnum.IMAGES).update(
      localImageRecord.id,
      localImageRecord,
    )
    await DB.table(TableEnum.PROMPTS).update(
      localPromptRecord.id,
      localPromptRecord,
    )
    await DB.table(TableEnum.ITEMS).bulkAdd(localItemRecords)

    log.info('Image Processed', {
      imageId: localImageRecord.id,
      promptId: localPromptRecord.id,
      itemsCount: localItemRecords.length,
    })
  } catch (error) {
    log.error('Error processing image', error as Error)
    await DB.table(TableEnum.IMAGES).delete(trackedImageId.value)
    await DB.table(TableEnum.PROMPTS).delete(trackedPromptId.value)
  } finally {
    importImage.value = null!
    $q.loading.hide()
  }
}

/**
 * Parses the API response and creates the item records based on API response.
 */
function processResponseItems(
  localImageRecord: ParentImage,
  localPromptRecord: ChildPrompt,
) {
  // Having to trim the response content to get the JSON object
  const responseContent =
    localPromptRecord.response_data?.choices?.[0]?.message?.content
  const startIndex = responseContent.indexOf('{')
  const endIndex = responseContent.lastIndexOf('}')
  const trimmedContent = responseContent.substring(startIndex, endIndex + 1)
  const parsedContent = JSON.parse(trimmedContent) as Record<string, any>

  const items = parsedContent?.items || []
  const visibleText = parsedContent?.visible_text || []

  localImageRecord.visible_text = visibleText

  // Create all the item records
  return items.map((item: any) => {
    return new ChildItem({
      image_id: localImageRecord.id,
      type: item?.type || undefined,
      brand: item?.brand || undefined,
      label: item?.label || undefined,
      description: item?.description || undefined,
      categories: item?.categories || [],
    })
  })
}

/**
 * TODO
 */
async function supabaseTest() {
  const { supabase, user } = backendStore
  try {
    const record = {
      owner_user_id: user?.id,
    }
    log.print('Inserting Record', {
      record,
      user,
    })

    // Create initial metadata record to get id
    const { data: imageMetadataRecords, error: metadataError } = await supabase
      .from('mjoy_image_metadata')
      .insert(record)
      .select()

    if (metadataError) {
      throw metadataError
    }

    const imageMetadataRecord = imageMetadataRecords?.[0]

    // Upload file to storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('mjoy-uploaded-images')
      .upload(
        `${imageMetadataRecord.owner_user_id}/${imageMetadataRecord.id}`,
        importImage.value,
      )

    if (fileError) {
      throw fileError
    }

    log.info('Inserted record', { imageMetadataRecord, fileData })
  } catch (error) {
    log.error('Error inserting record', error as Error)
  }
}
</script>

<template>
  <PageResponsive>
    <q-list padding>
      <q-item class="q-mb-sm">
        <q-item-section top>
          <q-item-label>Image Uploader</q-item-label>
          <q-item-label caption>
            Add items by choosing an image to upload and have the contents
            processed by the AI. The following fields will be populated based on
            the image content:
            <ul>
              <li>Type</li>
              <li>Brand</li>
              <li>Label</li>
              <li>Description</li>
              <li>Categories</li>
            </ul>
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item class="q-mb-sm">
        <q-item-section top>
          <q-file
            v-model="importImage"
            :disable="$q.loading.isActive"
            label="Image File"
            clearable
            dense
            outlined
            accept="image/*"
            @rejected="onRejectedFile"
          >
            <template v-slot:before>
              <q-btn
                :disable="!importImage || $q.loading.isActive"
                :icon="importFileIcon"
                color="primary"
                @click="processImage()"
              />
            </template>
          </q-file>
        </q-item-section>
      </q-item>

      <q-item class="q-mb-sm">
        <q-item-section top>
          <q-file
            v-model="importImage"
            :disable="$q.loading.isActive"
            label="Supabase Test"
            clearable
            dense
            outlined
            accept="image/*"
            @rejected="onRejectedFile"
          >
            <template v-slot:before>
              <q-btn
                :disable="!importImage || $q.loading.isActive"
                :icon="importFileIcon"
                color="primary"
                @click="supabaseTest()"
              />
            </template>
          </q-file>
        </q-item-section>
      </q-item>

      <q-item v-if="imageUrl" class="q-mb-sm">
        <q-item-section top>
          <q-item-label>
            <img :src="imageUrl" alt="Uploaded Image" style="max-width: 100%" />
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </PageResponsive>
</template>
