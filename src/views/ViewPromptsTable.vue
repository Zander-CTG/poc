<script setup lang="ts">
import DialogInspectPrompt from '@/components/dialogs/DialogInspectPrompt.vue'
import type { Prompt } from '@/models/Prompt'
import { DB } from '@/services/db'
import { appName } from '@/shared/constants'
import {
  closeIcon,
  columnsIcon,
  logsTableIcon,
  searchIcon,
} from '@/shared/icons'
import type { IdType } from '@/shared/types'
import {
  columnOptionsFromTableColumns,
  hiddenTableColumn,
  recordsCount,
  tableColumn,
  visibleColumnsFromTableColumns,
} from '@/shared/utils'
import useLogger from '@/use/useLogger'
import useRouting from '@/use/useRouting'
import { useMeta, useQuasar, type QTableColumn } from 'quasar'
import { onUnmounted, ref, type Ref } from 'vue'

useMeta({ title: `${appName} - Data Table` })

const $q = useQuasar()
const { goBack } = useRouting()
const { log } = useLogger()

const labelSingular = 'Prompt'
const labelPlural = 'Prompts'
const searchFilter: Ref<string> = ref('')
const tableColumns = [
  hiddenTableColumn('id'),
  tableColumn('id', 'Id', 'UUID'),
  tableColumn('image_id', 'Image Id', 'UUID'),
  tableColumn('createdAt', 'Created Date', 'DATE'),
  tableColumn('model', 'Model', 'TEXT'),
  tableColumn('system_prompt', 'System Prompt', 'TEXT'),
  tableColumn('user_prompt', 'User Prompt', 'TEXT'),
  tableColumn('max_tokens', 'Max Tokens', 'TEXT'),
  tableColumn('response_time', 'Response Time', 'TEXT'),
  tableColumn('response_data', 'Response Data', 'JSON'),
  tableColumn('response_content_json', 'Response Content JSON', 'TEXT'),
]
const columnOptions: Ref<QTableColumn[]> = ref(
  columnOptionsFromTableColumns(tableColumns),
)
const visibleColumns: Ref<string[]> = ref(
  visibleColumnsFromTableColumns(tableColumns),
)

const liveData: Ref<Prompt[]> = ref([])
const isLiveQueryFinished = ref(false)

const subscription = DB.livePrompts().subscribe({
  next: (data) => {
    liveData.value = data
    isLiveQueryFinished.value = true
  },
  error: (error) => {
    log.error(`Error loading live ${labelPlural} data`, error as Error)
    isLiveQueryFinished.value = true
  },
})

function onInspect(id: IdType) {
  return $q.dialog({
    component: DialogInspectPrompt,
    componentProps: { id },
  })
}

onUnmounted(() => {
  subscription.unsubscribe()
})
</script>

<template>
  <q-table
    fullscreen
    :rows="liveData"
    :columns="tableColumns"
    :visible-columns="visibleColumns"
    :rows-per-page-options="[0]"
    :filter="searchFilter"
    virtual-scroll
    row-key="id"
  >
    <template v-slot:header="props">
      <q-tr :props="props">
        <q-th
          v-for="col in props.cols"
          v-show="col.name !== 'hidden'"
          :key="col.name"
          :props="props"
        >
          {{ col.label }}
        </q-th>
      </q-tr>
    </template>

    <template v-slot:body="props">
      <q-tr
        :props="props"
        class="cursor-pointer"
        @click="onInspect(props.row.id)"
      >
        <q-td v-for="col in props.cols" :key="col.name" :props="props">
          {{ col.value }}
        </q-td>
      </q-tr>
    </template>

    <template v-slot:top>
      <div class="row justify-start full-width q-mb-md">
        <div class="col-10 text-h6 text-bold ellipsis">
          <q-icon class="q-pb-xs q-mr-xs" :name="logsTableIcon" />
          {{ labelPlural }}
        </div>

        <q-btn
          round
          flat
          class="absolute-top-right q-mr-sm q-mt-sm"
          :icon="closeIcon"
          @click="goBack"
        />
      </div>

      <div class="row justify-start full-width">
        <q-input
          :disable="!liveData.length"
          outlined
          dense
          clearable
          debounce="300"
          v-model="searchFilter"
          placeholder="Search"
          class="full-width"
        >
          <template v-slot:after>
            <q-select
              v-model="visibleColumns"
              :options="columnOptions"
              :disable="!liveData.length"
              multiple
              dense
              options-dense
              emit-value
              map-options
              option-value="name"
              display-value=""
              bg-color="primary"
            >
              <template v-slot:append>
                <q-icon color="white" :name="columnsIcon" />
              </template>
            </q-select>
          </template>

          <template v-slot:append>
            <q-icon :name="searchIcon" />
          </template>
        </q-input>
      </div>
    </template>

    <template v-slot:bottom>
      {{ recordsCount(liveData, labelSingular, labelPlural) }}
    </template>
  </q-table>
</template>
