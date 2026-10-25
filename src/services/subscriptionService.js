import api from './api'

export const subscriptionService = {
  /**
   * Lấy danh sách gói học / gói hội viên
   */
  getPlans() {
    return api.get('/api/v1/subscriptions/plans')
  },

  /**
   * Lấy thông tin gói hội viên của người dùng hiện tại
   */
  getMySubscription() {
    return api.get('/api/v1/subscriptions/my')
  },

  /**
   * Tạo đơn đăng ký gói học / tạo thanh toán VietQR
   * @param {number} planId 
   * @param {string} paymentMethod 'BANK_TRANSFER' | 'MOMO' | 'ZALOPAY'
   */
  checkout(planId, paymentMethod = 'BANK_TRANSFER') {
    return api.post('/api/v1/subscriptions/checkout', { planId, paymentMethod })
  },

  /**
   * Xác nhận thanh toán thành công (Mô phỏng IPN / Kích hoạt tức thì)
   * @param {number} paymentId 
   */
  confirmPayment(paymentId) {
    return api.post(`/api/v1/subscriptions/confirm-payment/${paymentId}`)
  }
}
