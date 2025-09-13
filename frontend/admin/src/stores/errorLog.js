import { defineStore } from 'pinia'

export const useErrorLogStore = defineStore('errorLog', {
  state: () => ({
    errorLogs: []
  }),

  getters: {
    errorCount: (state) => state.errorLogs.length
  },

  actions: {
    addErrorLog(log) {
      this.errorLogs.push(log)
    },

    clearErrorLog() {
      this.errorLogs.splice(0)
    },

    removeErrorLog(index) {
      this.errorLogs.splice(index, 1)
    }
  }
})