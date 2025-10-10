// lib/api.ts

export const API_BASE_URL = 'https://apiv2.silverium.id' // Pastikan URL ini sesuai

// Fungsi untuk mendapatkan access token baru menggunakan refresh token
async function refreshAccessToken () {
  const refreshToken = localStorage.getItem('admin_refresh_token')
  if (!refreshToken) {
    throw new Error('Refresh token tidak ditemukan.')
  }

  const response = await fetch(`${API_BASE_URL}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: refreshToken })
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Gagal memperbarui token.')
  }

  localStorage.setItem('admin_access_token', data.accessToken)
  return data.accessToken
}

// Pembungkus (wrapper) untuk fetch yang menangani refresh token secara otomatis
export async function apiClient (endpoint: string, options: RequestInit = {}) {
  // PERBAIKAN: Menggunakan const karena variabel tidak diubah lagi
  const accessToken = localStorage.getItem('admin_access_token')

  // Siapkan header otorisasi
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`
  }

  // Lakukan panggilan API pertama
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  })

  // Jika token kedaluwarsa (403 Forbidden)
  if (response.status === 403) {
    try {
      // Coba dapatkan access token baru
      const newAccessToken = await refreshAccessToken()

      // Ulangi panggilan API dengan token baru
      const newHeaders = {
        ...options.headers,
        Authorization: `Bearer ${newAccessToken}`
      }
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: newHeaders
      })
    } catch (refreshError) {
      // Jika refresh token juga gagal, logout pengguna
      console.error('Sesi berakhir:', refreshError)
      localStorage.removeItem('admin_access_token')
      localStorage.removeItem('admin_refresh_token')
      // Arahkan ke halaman login
      window.location.href = '/'
      throw new Error('Sesi Anda telah berakhir. Silakan login kembali.')
    }
  }

  // Cek jika respons tidak memiliki body (misalnya untuk DELETE)
  const contentType = response.headers.get('content-type')
  if (
    response.status === 200 &&
    (!contentType || !contentType.includes('application/json'))
  ) {
    return {} // Kembalikan objek kosong jika tidak ada JSON
  }

  const data = await response.json()
  if (!response.ok) {
    throw new Error(
      data.error || `Terjadi kesalahan pada panggilan API ke ${endpoint}`
    )
  }

  return data
}
