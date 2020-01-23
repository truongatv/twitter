'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BeneficiarySchema extends Schema {
  up () {
    this.create('beneficiaries', (table) => {
      table.increments()
      table.integer('living_cost_id').notNullable()
      table.integer('user_id').notNullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('beneficiaries')
  }
}

module.exports = BeneficiarySchema
