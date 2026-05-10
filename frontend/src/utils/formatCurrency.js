export const formatCurrency = (amount) => {
  const value = Number(amount || 0)

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value)
}

export const formatCompactCurrency = (amount) => {
  const value = Number(amount || 0)

  if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `Rs ${(value / 1000).toFixed(1)}k`
  return `Rs ${value.toFixed(0)}`
}

export const formatDate = (date) => {
  if (!date) return '-'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export const formatDateOnly = (date) => {
  if (!date) return '-'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN').format(Number(value || 0))
