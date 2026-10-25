import api from './api'

export const authService = {
  /**
   * Đăng nhập hệ thống
   * @param {{ phoneOrEmail: string, password: string }} credentials 
   */
  async login(credentials) {
    const payload = {
      identifier: credentials.identifier || credentials.phoneOrEmail,
      password: credentials.password
    }
    return await api.post('/api/v1/auth/login', payload)
  },

  /**
   * Đăng ký tài khoản mới
   * @param {{ fullName: string, phone: string, email: string, password: string, role: string }} data 
   */
  async register(data) {
    return await api.post('/api/v1/auth/register', data)
  },

  /**
   * Làm mới Access Token
   * @param {string} refreshToken 
   */
  async refreshToken(refreshToken) {
    return await api.post('/api/v1/auth/refresh', { refreshToken })
  },

  /**
   * Lấy thông tin profile người dùng hiện tại từ JWT token
   */
  async getMe() {
    return await api.get('/api/v1/auth/me')
  },

  /**
   * Đăng xuất
   */
  async logout() {
    return await api.post('/api/v1/auth/logout')
  }
}
