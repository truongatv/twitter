'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Home extends Model {
    living_costs() {
        return this.manyThrough('App/Models/User', 'living_costs')
    }

    users() {
        return this.hasMany('App/Models/User')
    }

    currency() {
        return this.hasOne('App/Models/Currency')
    }
}

module.exports = Home
