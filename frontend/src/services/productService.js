import api from './api'

export const productService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/products', { params })
    return data
  },
  getById: async (id) => {
    const { data } = await api.get(`/products/${id}`)
    return data.data
  },
  getByBarcode: async (barcode) => {
    const { data } = await api.get(`/products/barcode/${barcode}`)
    return data.data
  },
  getLowStock: async () => {
    const { data } = await api.get('/products/low-stock')
    return data.data
  },
  create: async (formData) => {
    const { data } = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },
  update: async (id, formData) => {
    const { data } = await api.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },
  delete: async (id) => {
    const { data } = await api.delete(`/products/${id}`)
    return data
  },
  updateStock: async (id, stockData) => {
    const { data } = await api.put(`/products/${id}/stock`, stockData)
    return data.data
  },
}
