import * as fs from 'fs'
import * as path from 'path'
import { resetAndSeedDatabase } from '../lib/seedData'

// Simple environment variable loader for .env.local
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    console.log('Loading environment variables from .env.local...')
    const content = fs.readFileSync(envPath, 'utf8')
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const index = trimmed.indexOf('=')
      if (index === -1) return
      const key = trimmed.slice(0, index).trim()
      const value = trimmed.slice(index + 1).trim()
      // Strip optional quotes
      const cleanedValue = value.replace(/^['"]|['"]$/g, '')
      process.env[key] = cleanedValue
    })
  } else {
    console.warn('.env.local file not found. Relying on system environment variables.')
  }
}

async function run() {
  loadEnv()
  try {
    await resetAndSeedDatabase()
    process.exit(0)
  } catch (error: any) {
    console.error('Seeding process failed:', error.message)
    process.exit(1)
  }
}

run()
