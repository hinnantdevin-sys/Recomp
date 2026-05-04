import React from 'react'
import ReactDOM from 'react-dom/client'
import Recomp from './Recomp.jsx'

if (!window.storage) {
  window.storage = {
    get: async (key) => {
      const v = localStorage.getItem(key)
      return v ? { key, value: v } : null
    },
    set: async (key, value) => {
      localStorage.setItem(key, value)
      return { key, value }
    },
    delete: async (key) => {
      localStorage.removeItem(key)
      return { key, deleted: true }
    },
    list: async (prefix = '') => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix))
      return { keys, prefix }
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(<Recomp />)
