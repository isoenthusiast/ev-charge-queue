import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'
export default defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: {
        connectionString: env.get('DATABASE_URL'),
        ssl: env.get('DB_SSL') ? { rejectUnauthorized: true } : false,
      },
      pool: { min: 0, max: 10 },
      migrations: { naturalSort: true, paths: ['database/migrations'] },
      schemaGeneration: { enabled: false },
    },
  },
})
