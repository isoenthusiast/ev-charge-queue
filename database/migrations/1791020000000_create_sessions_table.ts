import { BaseSchema } from '@adonisjs/lucid/schema'
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('sessions', (table) => {
      table.string('id').primary()
      table.text('data').notNullable()
      table.string('user_id').nullable().index()
      table.timestamp('expires_at').notNullable().index()
    })
  }
  async down() {
    this.schema.dropTable('sessions')
  }
}
