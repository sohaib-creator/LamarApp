const API_BASE = '/api'

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Request failed')
  return data.data
}

export function login(email, password) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function register(name, email, password, phone) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, phone }) })
}

export function getProfile() {
  return request('/auth/profile')
}

export function getSettings() {
  return request('/admin/settings')
}

export function updateSettings(data) {
  return request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) })
}

export function getPublicSettings() {
  return request('/settings/public')
}

export function getProducts(params) {
  const q = params ? '?' + new URLSearchParams(params) : ''
  return request('/products' + q)
}

export function getProduct(id) {
  return request('/products/' + id)
}

export function createProduct(data) {
  return request('/products', { method: 'POST', body: JSON.stringify(data) })
}

export function updateProduct(id, data) {
  return request('/products/' + id, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteProduct(id) {
  return request('/products/' + id, { method: 'DELETE' })
}

export function getCategories() {
  return request('/categories')
}

export function createCategory(data) {
  return request('/categories', { method: 'POST', body: JSON.stringify(data) })
}

export function updateCategory(id, data) {
  return request('/categories/' + id, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteCategory(id) {
  return request('/categories/' + id, { method: 'DELETE' })
}

export function getOrders(params) {
  const q = params ? '?' + new URLSearchParams(params) : ''
  return request('/orders' + q)
}

export function getOrder(id) {
  return request('/orders/' + id)
}

export function createOrder(data) {
  return request('/orders', { method: 'POST', body: JSON.stringify(data) })
}

export function updateOrder(id, data) {
  return request('/orders/' + id, { method: 'PUT', body: JSON.stringify(data) })
}

export function updateOrderStatus(id, status) {
  return request('/orders/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status }) })
}

export function assignDriver(orderId, driverId) {
  return request('/orders/' + orderId + '/assign', { method: 'PUT', body: JSON.stringify({ driver_id: driverId }) })
}

export function exportOrders(fields, dateFrom, dateTo, statusFilter) {
  return request('/orders/export', {
    method: 'POST',
    body: JSON.stringify({ fields, date_from: dateFrom, date_to: dateTo, status: statusFilter }),
  })
}

export function getDrivers() {
  return request('/admin/drivers')
}

export function createDriver(data) {
  return request('/admin/drivers', { method: 'POST', body: JSON.stringify(data) })
}

export function toggleUserStatus(id, status) {
  return request('/admin/users/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status }) })
}

export function getUsers(params) {
  const q = params ? '?' + new URLSearchParams(params) : ''
  return request('/admin/users' + q)
}

export function getActivePromotions() {
  return request('/promotions/active')
}

export function getAddresses() {
  return request('/addresses')
}

export function createAddress(data) {
  return request('/addresses', { method: 'POST', body: JSON.stringify(data) })
}

export function getPaymentMethods() {
  return request('/settings/payment-methods')
}

export function togglePaymentMethod(id, isActive) {
  return request('/admin/payment-methods/' + id + '/toggle', { method: 'PUT', body: JSON.stringify({ is_active: isActive }) })
}

export function getDeliveryCities() {
  return request('/settings/delivery-cities')
}

export function addDeliveryCity(name) {
  return request('/admin/delivery-cities', { method: 'POST', body: JSON.stringify({ name }) })
}

export function toggleDeliveryCity(id, isActive) {
  return request('/admin/delivery-cities/' + id + '/toggle', { method: 'PUT', body: JSON.stringify({ is_active: isActive }) })
}

export function deleteDeliveryCity(id) {
  return request('/admin/delivery-cities/' + id, { method: 'DELETE' })
}

export function getFirstOrderDiscount() {
  return request('/settings/first-order-discount')
}

export function getDiscountSettings() {
  return request('/admin/settings')
}

export function updateDiscountSetting(key, value) {
  return request('/admin/settings', { method: 'PUT', body: JSON.stringify({ key, value }) })
}

export function validateDiscountCode(code, subtotal) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${API_BASE}/discount-codes/validate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code, subtotal }),
  }).then(r => r.json())
}

export function getAdminReviews(filter) {
  const q = filter ? '?status=' + filter : ''
  return request('/admin/reviews' + q)
}

export function moderateReview(id, status) {
  return request('/admin/reviews/' + id + '/moderate', { method: 'PUT', body: JSON.stringify({ status }) })
}

export function getSupportTickets() {
  return request('/support/tickets')
}

export function getTicketReplies(id) {
  return request('/support/tickets/' + id)
}

export function replyTicket(id, message) {
  return request('/support/tickets/' + id + '/reply', { method: 'POST', body: JSON.stringify({ message }) })
}

export function updateTicketStatus(id, status) {
  return request('/support/tickets/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status }) })
}

export function getProductReviews(id) {
  return request('/products/' + id + '/reviews')
}

export function getProductRating(id) {
  return request('/products/' + id + '/rating')
}

export function getCanRate(id) {
  return request('/products/' + id + '/can-rate')
}

export function createReview(id, rating, comment) {
  return request('/products/' + id + '/reviews', { method: 'POST', body: JSON.stringify({ rating, comment }) })
}

export function deleteReview(id) {
  return request('/reviews/' + id, { method: 'DELETE' })
}

export async function uploadImage(file) {
  const token = localStorage.getItem('token')
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Upload failed')
  return data.data[0].url
}
