export const ROLE_HOME_PATH = {
  admin: '/dashboard',
  cashier: '/billing',
  staff: '/billing',
  customer: '/customer/dashboard',
}

export const ROLE_LABELS = {
  admin: 'Administrator',
  cashier: 'Cashier',
  staff: 'Store Staff',
  customer: 'Customer',
}

export function getRoleHomePath(role) {
  return ROLE_HOME_PATH[role] || '/login'
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || 'User'
}
