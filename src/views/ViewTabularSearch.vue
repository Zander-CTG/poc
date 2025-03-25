<script setup lang="ts">
import type { ChildItem } from '@/models/Item'
import { DB } from '@/services/db'
import { appName } from '@/shared/constants'
import { TableEnum } from '@/shared/enums'
import { closeIcon, columnsIcon, itemsIcon, searchIcon } from '@/shared/icons'
import {
  columnOptionsFromTableColumns,
  recordsCount,
  tableColumn,
  visibleColumnsFromTableColumns,
} from '@/shared/utils'
import useLogger from '@/use/useLogger'
import useRouting from '@/use/useRouting'
import { liveQuery } from 'dexie'
import { useMeta, type QTableColumn } from 'quasar'
import { onUnmounted, ref, type Ref } from 'vue'

useMeta({ title: `${appName} - Data Table` })

const { log } = useLogger()
const { goBack } = useRouting()

const searchFilter: Ref<string> = ref('')
const tableColumns = [
  // hiddenTableColumn('id'),
  // tableColumn('id', 'Id', 'UUID'),
  // tableColumn('image_id', 'Image Id', 'UUID'),
  tableColumn('createdAt', 'Created Date', 'DATE'),
  tableColumn('type', 'Type', 'TEXT'),
  tableColumn('categories', 'Categories', 'LONG-LIST-PRINT'),
  tableColumn('brand', 'Brand', 'TEXT'),
  tableColumn('name', 'Name', 'TEXT'),
  tableColumn('description', 'Description', 'LONG-TEXT'),
]
const columnOptions: Ref<QTableColumn[]> = ref(
  columnOptionsFromTableColumns(tableColumns),
)
const visibleColumns: Ref<string[]> = ref(
  visibleColumnsFromTableColumns(tableColumns),
)

const liveData: Ref<ChildItem[]> = ref([])

const subscription = liveQuery(() =>
  DB.table(TableEnum.ITEMS).toArray(),
).subscribe({
  next: (data: ChildItem[]) => (liveData.value = data),
  error: (error) => log.error('Error fetching live Items', error),
})

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
      <q-tr :props="props">
        <q-td v-for="col in props.cols" :key="col.name" :props="props">
          {{ col.value }}
        </q-td>
      </q-tr>
    </template>

    <template v-slot:top>
      <div class="row justify-start full-width q-mb-md">
        <div class="col-10 text-h6 text-bold ellipsis">
          <q-icon class="q-pb-xs q-mr-xs" :name="itemsIcon" />
          Tabular Items
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
      {{ recordsCount(liveData, 'Item', 'Items') }}
    </template>
  </q-table>
</template>
