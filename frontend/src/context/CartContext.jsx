import { createContext, useContext, useState, useCallback } from 'react'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [customer, setCustomer] = useState(null)

  const addToCart = useCallback((product, qty = 1) => {
    setCartItems(prev => {
      const existing = prev.find(i => i._id === product._id)
      if (existing) {
        if (existing.quantity + qty > product.stock) {
          toast.error(`Max stock: ${product.stock}`)
          return prev
        }
        toast.success(`${product.name} qty updated`)
        return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + qty } : i)
      }
      if (qty > product.stock) { toast.error(`Only ${product.stock} in stock`); return prev }
      toast.success(`${product.name} added to cart`)
      return [...prev, { ...product, quantity: qty }]
    })
  }, [])

  const updateQty = useCallback((productId, quantity) => {
    setCartItems(prev => {
      const item = prev.find(i => i._id === productId)
      if (!item) return prev
      if (quantity <= 0) return prev.filter(i => i._id !== productId)
      if (quantity > item.stock) { toast.error(`Max stock: ${item.stock}`); return prev }
      return prev.map(i => i._id === productId ? { ...i, quantity } : i)
    })
  }, [])

  const removeFromCart = useCallback((productId) => {
    setCartItems(prev => prev.filter(i => i._id !== productId))
    toast.success('Item removed')
  }, [])

  const clearCart = useCallback(() => {
    setCartItems([])
    setCustomer(null)
  }, [])

  // Compute totals
  const subtotal = cartItems.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0)
  const totalDiscount = cartItems.reduce((sum, i) => sum + (i.sellingPrice * i.quantity * (i.discountPercent / 100)), 0)
  const totalGST = cartItems.reduce((sum, i) => {
    const afterDisc = i.sellingPrice * i.quantity * (1 - i.discountPercent / 100)
    return sum + afterDisc * (i.gstPercent / 100)
  }, 0)
  const grandTotal = subtotal - totalDiscount + totalGST

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      cartItems, customer, setCustomer,
      addToCart, updateQty, removeFromCart, clearCart,
      subtotal, totalDiscount, totalGST, grandTotal, cartCount,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
