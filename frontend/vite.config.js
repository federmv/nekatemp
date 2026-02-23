import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [],
            manifest: {
                name: 'Neka Dashboard',
                short_name: 'Neka',
                description: 'Monitor IoT',
                theme_color: '#060608',
                background_color: '#060608',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                skipWaiting: true,
                clientsClaim: true
            }
        })
    ],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                // Required for SSE: don't buffer the response
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes) => {
                        if (proxyRes.headers['content-type'] === 'text/event-stream') {
                            proxyRes.headers['cache-control'] = 'no-cache';
                            proxyRes.headers['x-accel-buffering'] = 'no';
                        }
                    });
                }
            }
        }
    }
})
