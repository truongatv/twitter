'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class LivingCostSchema extends Schema {
  up () {
    this.create('living_costs', (table) => {
      table.increments()
      table.string('name').notNullable()
      table.date('date_pay').notNullable()
      table.integer('payer_id').notNullable()
      table.float('price').notNullable()
      table.integer('home_id')
      table.string('image')
      table.string('detail')
      table.timestamps()
    })
  }

  down () {
    this.drop('living_costs')
  }
}

module.exports = LivingCostSchema
