/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  // Imposta la porta predefinita a 3000
  env: {
    PORT: '3000'
  }
}

module.exports = nextConfig