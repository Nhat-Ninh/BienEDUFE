import axios from 'axios'

// Lấy base URL từ biến môi trường (Vite)
const baseURL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor: Tự động đính kèm Bearer token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bienedu_access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Xử lý phản hồi và lỗi 401 (Hết hạn Token)
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    const originalRequest = error.config
    
    // Nếu token hết hạn (401) và chưa thử refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('bienedu_refresh_token')
      
      if (refreshToken) {
        try {
          const res = await axios.post(`${baseURL}/api/v1/auth/refresh`, { refreshToken })
          const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken
          
          if (newAccessToken) {
            localStorage.setItem('bienedu_access_token', newAccessToken)
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
            return api(originalRequest)
          }
        } catch (refreshErr) {
          // Refresh thất bại -> Đăng xuất người dùng
          localStorage.removeItem('bienedu_access_token')
          localStorage.removeItem('bienedu_refresh_token')
          localStorage.removeItem('bienedu_user')
          window.location.href = '/login?expired=true'
          return Promise.reject(refreshErr)
        }
      } else {
        localStorage.removeItem('bienedu_access_token')
        localStorage.removeItem('bienedu_user')
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error.response?.data || error)
  }
)

export default api
