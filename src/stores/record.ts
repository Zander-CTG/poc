import { defineStore } from 'pinia'

/**
 * Stores the currently selected record.
 */
export const useRecordStore = defineStore({
  id: 'record',

  state: () => ({
    record: {} as Record<string, any>,
    items: [] as Record<string, any>[],
  }),
})
