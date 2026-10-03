import { BaseSchema } from '@adonisjs/lucid/schema'
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('notes', (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()
      table.string('title', 120).notNullable()
      table.boolean('done').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
    })
  }
  async down() {
    this.schema.dropTable('notes')
  }
}
