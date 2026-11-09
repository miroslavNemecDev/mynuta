import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import subscribeHandler from './api/subscribe.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const smtpKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM', 'EMAIL_TO']

  for (const key of smtpKeys) {
    if (process.env[key] === undefined && env[key] !== undefined) {
      process.env[key] = env[key]
    }
  }

  return {
    plugins: [
      react(),
      {
        name: 'local-subscribe-api',
        configureServer(server) {
          server.middlewares.use('/api/subscribe', async (req, res, next) => {
            try {
              await subscribeHandler(req, {
                status(statusCode: number) {
                  res.statusCode = statusCode
                  return this
                },
                json(body: unknown) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify(body))
                },
              })
            } catch (error) {
              next(error)
            }
          })
        },
      },
    ],
  }
})
