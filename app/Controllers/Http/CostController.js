'use strict'
const Database = use('Database')
const User = use('App/Models/User')
const Home = use('App/Models/Home')
const LivingCost = use('App/Models/LivingCost')
const Beneficiary = use('App/Models/Beneficiary')
const Config = use('Config')
var moment = require('moment')
class CostController {
    /*
    create new living cost
    * request {name, date_pay, payer_id, price, detail}
    */
    async createCost ({ request, response, auth }){
        try {
            // get home id from user
            const homeId = await Database
                .select('home_id')
                .table('users')
                .where('id', auth.current.user.id)
            //change type of date pay
            const date_pay = new Date(request.input('date_pay') + "Z")
            const costId = await Database
                .table('living_costs')
                .insert({
                    'name': request.input('name'),
                    'date_pay': date_pay,
                    'payer_id': request.input('payer_id'),
                    'home_id': homeId[0].home_id,
                    'price' : request.input('price'),
                    'detail' : request.input('detail')
                })
            //create array separate elements for insert to pivot table
            const user_ids = request.input('receiver')
            const fieldsToInsert = user_ids.map(item => 
                (
                    {
                        living_cost_id: costId,
                        user_id: item.id
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
    * request : {date_pay_start, date_pay_end}
    */
    async getUserCost({request, auth, response}) {
        try {
            //set date start , date end
            let date_pay_start = moment().startOf('month').format('YYYY-MM-DD')
            let date_pay_end = moment().endOf('month').format('YYYY-MM-DD');

            const user = await User.find(auth.current.user.id)
            if(request.input('date_pay_start')) {
                date_pay_start = request.input('date_pay_start')
            }
            if(request.input('date_pay_end')) {
                date_pay_end = request.input('date_pay_end')
            }
            let user_costs = await user
                    .living_costs()
                    .where('date_pay', '>=', date_pay_start)
                    .where('date_pay', '<=', date_pay_end)
                    .fetch()
            user_costs = user_costs.toJSON()
            // push payer info to response data 
            for(let i = 0; i< user_costs.length; i++) {
                const user_info = await User.find(user_costs[i].payer_id)
                user_costs[i].payer_name = user_info.name
                user_costs[i].date_pay = moment(user_costs[i].date_pay).format("YYYY-MM-DD")
                const living_cost = await LivingCost.find(user_costs[i].id)
                const list_user_ben = await living_cost
                    .users()
                    .select('id', 'name', 'username', 'email')
                    .fetch()
                user_costs[i].receiver = list_user_ben.toJSON()
            }
            return response.json({
                data: user_costs
            })
        } catch (error) {
            console.log(error)
            return response.status(400).json({
                message: error.sqlMessage
            })
        }
    }

    /*
    get cost living of home
    */
    async getHomeCost({auth, response}) {
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

    /**
    update cost
    request : { id, date_pay, payer_id, price, detail, user_ids[]}
    */
    async updateCost({request, auth, response}) {
        try {
            const result = await LivingCost
                .query()
                .where('id', request.input('id'))
                .update({
                    date_pay: request.input('date_pay'),
                    payer_id: request.input('payer_id'),
                    price: request.input('price'),
                    detail: request.input('detail')
                })
            //delete data from pivot table
            const beneficiary = await Beneficiary.findBy('living_cost_id', request.input('id'))
            await beneficiary.delete()
            //create array separate elements for new insert to pivot table
            const user_ids = request.input('user_ids')
            const fieldsToInsert = user_ids.map(user_id => 
                (
                    {
                        living_cost_id: request.input('id'),
                        user_id: user_id
                    }
                ));  
            //update data to pivot table 
            const beneficiariesId = await Database
                .table('beneficiaries')
                .insert(fieldsToInsert)
        
            return response.status(200).json({
                data: result
            })
            
        } catch (error) {
            if(error == Config.get('errors.message.userIsNotCreatorCost')) {
                return response.status(400).json({
                    message: Config.get('errors.message.userIsNotCreatorCost')
                })
            }
            return response.status(400).json({
                message: error.sqlMessage
            })
        }

    }

    /**
    remove cost
    request: {id}
    */
    async removeCost({request, auth, response}) {
        try {
            console.log(Config.get('errors.message.userIsNotCreatorCost'))
            const beneficiary = await Beneficiary.findBy('living_cost_id', request.input('id'))
            const result = await beneficiary.delete()

            return response.status(200).json({
                data: result
            })
        } catch (error) {
            return response.status(400).json({
                message: error.sqlMessage
            })
        }
    }
}

module.exports = CostController
