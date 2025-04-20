<script setup lang="ts">
import DialogConfirm from '@/components/dialogs/DialogConfirm.vue'
import DialogInspectItem from '@/components/dialogs/DialogInspectItem.vue'
import { appName } from '@/shared/constants'
import {
  closeIcon,
  columnsIcon,
  deleteIcon,
  itemsIcon,
  searchIcon,
} from '@/shared/icons'
import {
  columnOptionsFromTableColumns,
  hiddenTableColumn,
  recordsCount,
  tableColumn,
  visibleColumnsFromTableColumns,
} from '@/shared/utils'
import { useBackend } from '@/stores/backend'
import useLogger from '@/use/useLogger'
import useRouting from '@/use/useRouting'
import { useMeta, useQuasar, type QTableColumn } from 'quasar'
import { onMounted, ref, type Ref } from 'vue'

useMeta({ title: `${appName} - Search Items` })

const $q = useQuasar()
const { log } = useLogger()
const { goBack } = useRouting()
const { fetchItems, deleteItem } = useBackend()

const itemRecords: Ref<Record<string, any>[]> = ref([])

const searchFilter: Ref<string> = ref('')
const tableColumns = [
  hiddenTableColumn('id'),
  tableColumn('label', 'Label', 'TEXT'),
  tableColumn('brand', 'Brand', 'TEXT'),
  tableColumn('type', 'Type', 'TEXT'),
  tableColumn('description', 'Description', 'LONG-TEXT'),
  tableColumn('categories', 'Categories', 'LONG-LIST-PRINT'),
  tableColumn('created_at', 'Created Date', 'TEXT'),
  tableColumn('image_metadata_id', 'Image Id', 'UUID'),
  tableColumn('user_id', 'User Id', 'UUID'),
  tableColumn('id', 'Id', 'UUID'),
]
const columnOptions: Ref<QTableColumn[]> = ref(
  columnOptionsFromTableColumns(tableColumns),
)
const visibleColumns: Ref<string[]> = ref(
  visibleColumnsFromTableColumns(tableColumns),
)

onMounted(async () => {
  try {
    itemRecords.value = await fetchItems()
  } catch (error) {
    log.error('Error loading images', error as Error)
  }
})

function onInspect(row: Record<string, any>) {
  $q.dialog({
    component: DialogInspectItem,
    componentProps: { record: row },
  })
}

async function onDeleteItem(row: Record<string, any>) {
  $q.dialog({
    component: DialogConfirm,
    componentProps: {
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?',
      color: 'negative',
      icon: deleteIcon,
      requiresUnlock: false,
    },
  }).onOk(async () => {
    try {
      $q.loading.show()
      await deleteItem(row.id)
      itemRecords.value = itemRecords.value.filter((item) => item.id !== row.id)
      log.info('Successfully deleted item')
    } catch (error) {
      log.error(`Error deleting item`, error as Error)
    } finally {
      $q.loading.hide()
    }
  })
}
</script>

<template>
  <q-table
    fullscreen
    :rows="itemRecords"
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
        <q-th auto-width class="text-left">Actions</q-th>
      </q-tr>
    </template>

    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td
          v-for="col in props.cols"
          :key="col.name"
          :props="props"
          class="cursor-pointer"
          @click="onInspect(props.row)"
        >
          {{ col.value }}
        </q-td>
        <q-td>
          <q-btn
            round
            size="sm"
            color="negative"
            :icon="deleteIcon"
            @click="onDeleteItem(props.row)"
          />
        </q-td>
      </q-tr>
    </template>

    <template v-slot:top>
      <div class="row justify-start full-width q-mb-md">
        <div class="col-10 text-h6 text-bold ellipsis">
          <q-icon class="q-pb-xs q-mr-xs" :name="itemsIcon" />
          Items
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
          :disable="!itemRecords.length"
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
              :disable="!itemRecords.length"
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
      {{ recordsCount(itemRecords, 'Item', 'Items') }}
    </template>
  </q-table>
</template>
