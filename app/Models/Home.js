'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Home extends Model {
    /**
 * A relationship on home to user
 *
 * @method tokens
 *
 * @return {Object}
 */
    users() {
        return this.hasMany('App/Models/User')
    }
}

module.exports = Home
