/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'plus.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'ae01.alicdn.com',
            },
            {
                protocol: 'https',
                hostname: '**.cjdropshipping.com',
            },
        ],
    },
};

export default nextConfig;
