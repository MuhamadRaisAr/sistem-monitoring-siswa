import os from 'os';

const getLocalIps = () => {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: getLocalIps(),
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5000/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://127.0.0.1:5000/uploads/:path*',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://127.0.0.1:5000/socket.io/:path*',
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
      {
        source: '/guru',
        destination: '/guru/dashboard',
        permanent: true,
      },
      {
        source: '/wali_siswa',
        destination: '/wali_siswa/dashboard',
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      html2canvas: 'html2canvas-pro',
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      html2canvas: 'html2canvas-pro',
    },
  },
};

export default nextConfig;
