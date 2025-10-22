/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'apiv2.silverium.id',
        pathname: '/uploads/**'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3010',
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
      },
      {
        protocol: 'https',
        hostname: 'www.minigold.co.id',
        port: '',
        pathname: '/wp-content/uploads/**'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4010',
        pathname: '/**' // Diubah dari '/uploads/**' menjadi '/**'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3012',
        pathname: '/**' // Diubah dari '/uploads/**' menjadi '/**'
      },
    ]
  }
}

module.exports = nextConfig
