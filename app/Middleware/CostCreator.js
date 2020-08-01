'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const LivingCost = use('App/Models/LivingCost')
const Config = use('Config')
class CostCreator {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ params, request, auth, response }, next) {
    if(params.id < 0) {
      return response.status(400).json({
        message: Config.get('errors.message.userIsNotCreatorCost')
      })
    }
    // call next to advance the request
    const payer_id = await LivingCost
      .query()
      .where('id', params.id)
      .where('payer_id', auth.current.user.id)
      .fetch()
    if (payer_id.rows.length > 0) {
      await next()
    } else {
      return response.status(400).json({
        message: Config.get('errors.message.userIsNotCreatorCost')
      })
    }
  }
}

module.exports = CostCreator
