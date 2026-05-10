import api from './api'

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data.data
  },
  getMe: async () => {
    const { data } = await api.get('/auth/me')
    return data.data
  },
  getProfile: async () => {
    const { data } = await api.get('/auth/me')
    return data.data
  },
  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData)
    return data.data
  },
  getAllStaff: async () => {
    const { data } = await api.get('/auth/staff')
    return data.data
  },
  updateUser: async (id, userData) => {
    const { data } = await api.put(`/auth/user/${id}`, userData)
    return data.data
  },
  deleteUser: async (id) => {
    const { data } = await api.delete(`/auth/user/${id}`)
    return data
  },
}
