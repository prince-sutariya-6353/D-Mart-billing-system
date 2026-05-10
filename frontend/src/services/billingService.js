import api from './api'

export const billingService = {
  create: async (billData) => {
    const { data } = await api.post('/billing', billData)
    return data.data
  },
  getAll: async (params = {}) => {
    const { data } = await api.get('/billing', { params })
    return data
  },
  getById: async (id) => {
    const { data } = await api.get(`/billing/${id}`)
    return data.data
  },
  downloadPDF: async (id) => {
    const response = await api.get(`/billing/${id}/pdf`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Invoice-${id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
  updatePayment: async (id, paymentData) => {
    const { data } = await api.put(`/billing/${id}/payment`, paymentData)
    return data.data
  },
}

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats').then(res => res.data.data),
  getMonthly: (year) => api.get(`/dashboard/monthly?year=${year}`).then(res => res.data.data),
  getMyBills: () => api.get('/billing/my-bills').then(res => res.data.data),
}

export const customerService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/customers', { params })
    return data
  },
  getByPhone: async (phone) => {
    const { data } = await api.get(`/customers/phone/${phone}`)
    return data.data
  },
  create: async (customerData) => {
    const { data } = await api.post('/customers', customerData)
    return data.data
  },
  getHistory: async (id) => {
    const { data } = await api.get(`/customers/${id}/history`)
    return data.data
  },
  update: async (id, customerData) => {
    const { data } = await api.put(`/customers/${id}`, customerData)
    return data.data
  },
}

export const inventoryService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/inventory', { params })
    return data.data
  },
  getMovements: async (params = {}) => {
    const { data } = await api.get('/inventory/movements', { params })
    return data.data
  },
  getSuppliers: async () => {
    const { data } = await api.get('/inventory/suppliers')
    return data.data
  },
  addSupplier: async (supplierData) => {
    const { data } = await api.post('/inventory/suppliers', supplierData)
    return data.data
  },
}

export const aiService = {
  getPredictions: async () => {
    const { data } = await api.get('/ai/predictions')
    return data.data
  },
  getBestSelling: async (period = 30) => {
    const { data } = await api.get('/ai/best-selling', { params: { period } })
    return data.data
  },
  getSlowSelling: async () => {
    const { data } = await api.get('/ai/slow-selling')
    return data.data
  },
  getReorderSuggestions: async () => {
    const { data } = await api.get('/ai/reorder')
    return data.data
  },
  getSupplierComparison: async (productName) => {
    const { data } = await api.get('/ai/supplier-comparison', { params: { productName } })
    return data.data
  },
}

export const paymentService = {
  createRazorpayOrder: async (amount) => {
    const { data } = await api.post('/payment/razorpay/order', { amount })
    return data.data
  },
  verifyPayment: async (verifyData) => {
    const { data } = await api.post('/payment/razorpay/verify', verifyData)
    return data
  },
}
