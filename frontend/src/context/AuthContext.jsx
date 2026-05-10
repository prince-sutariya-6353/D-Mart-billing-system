import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('dmart_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('dmart_user') }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password)
    setUser(data)
    localStorage.setItem('dmart_user', JSON.stringify(data))
    return data
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('dmart_user')
    toast.success('Logged out successfully')
  }, [])

  const isAdmin = user?.role === 'admin'
  const isCashier = user?.role === 'cashier'
  const isStaff = user?.role === 'staff'
  const canManageProducts = isAdmin || isStaff
  const canBill = isAdmin || isCashier || isStaff

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isCashier, isStaff, canManageProducts, canBill }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
