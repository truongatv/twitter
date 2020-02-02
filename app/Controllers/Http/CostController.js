'use strict'
const Database = use('Database')
const User = use('App/Models/User')
const Home = use('App/Models/Home')
class CostController {
    /*
    create new living cost
    */
    async createCost ({ request, response, auth }){
        try {
            // get home id from user
            const homeId = await Database
                .select('home_id')
                .table('users')
                .where('id', auth.current.user.id)
            const costId = await Database
                .table('living_costs')
                .insert({
                    'name': request.input('name'),
                    'date_pay': request.input('date_pay'),
                    'payer_id': request.input('payer_id'),
                    'home_id': homeId[0].home_id,
                    'price' : request.input('price'),
                    'detail' : request.input('detail')
                })
            //create array separate elements for insert to pivot table
            const user_ids = request.input('user_ids')
            const fieldsToInsert = user_ids.map(user_id => 
                (
                    {
                        living_cost_id: costId,
                        user_id: user_id
                    }
                )); 
            //insert data to pivot table 
            const beneficiariesId = await Database
                .table('beneficiaries')
                .insert(fieldsToInsert)

            return response.status(200).json({
                data: {
                    beneficiariesId: beneficiariesId,
                    costId: costId
                }
            })

        } catch(error) {
            return response.status(400).json({
                message: error.sqlMessage
            })
        }
    }

    /*
    * get cost living of personal
    */
    async getUserCost({request, auth, response}) {
        try {
            const user = await User.find(auth.current.user.id)
            const date_pay_start = request.input('date_pay_start')
            const date_pay_end = request.input('date_pay_start')
            const user_cost = await user
                    .living_costs()
                    .where('date_pay', '>=', date_pay_start)
                    .where('date_pay', '<=', date_pay_end)
                    .fetch()
            return response.json({
                data: user_cost
            })
        } catch (error) {
            return response.status(400).json({
                message: error.sqlMessage
            })
        }
    }

    /*
    get cost living of home
    */
    async getHomeCost({request, auth, response}) {
        try {
            const home = await Home
                .query()
                .with('users', (builder) => {builder.where('id', auth.current.user.id) })
                .with('living_costs')
                .fetch()
            return response.json({
                data: home
            })
        } catch (error) {
            return response.status(400).json({
                message: error.sqlMessage
            })
        }
    }
}

module.exports = CostController
