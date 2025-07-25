/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**'
      },
      {
        protocol: 'https',
        hostname: 'placehold.co' // Diperbaiki: Sesuai dengan yang digunakan di kode
      },
      // Tambahkan ini untuk mengizinkan semua hostname dari dev tunnels
      {
        protocol: 'https',
        hostname: '*.devtunnels.ms',
        pathname: '/uploads/**'
      }
    ]
  }
}

module.exports = nextConfig
