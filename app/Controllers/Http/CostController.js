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
                    'payer_id': request.input('payer').id,
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
                    beneficiaries_id: beneficiariesId[0],
                    living_cost_id: costId[0]
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
            const user_id = auth.current.user.id
            const user_costs = await this.getCost(user_id, request)
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
    async getHomeCost({request, auth, response}) {
        try {
            //get home's id
            const current_user = await User.find(auth.current.user.id)
            const home_id = current_user.home_id
            //get home's members
            const result = await User.query().where('home_id', home_id).fetch()
            const members = result.toJSON()
            let home_costs = [];
            for(let i = 0; i < members.length; i++) {
                const cost = await this.getCost(members[i].id, request)
                // home_costs.push(cost)
                // push cost to home cost
                for(let j = 0; j < cost.length ; j++) {
                    //check cost is exist home cost ?
                    if(home_costs.some(element => element.id === cost[j].id)) continue
                    else {
                        home_costs.push(cost[j])
                    }
                }
            }
            
            return response.status(200).json({
                data: home_costs
            })
        } catch (error) {
            console.log(error)
            return response.status(400).json({
                message: error.sqlMessage
            })
        }
    }

    /**
     * get cost
     * @param {integer} user user's id 
     * @param {request} request frontend request
     */
    async getCost(user_id, request) {
        //get user info
        const user = await User.find(user_id)
        //set date start , date end
        let date_pay_start = moment().startOf('month').format('YYYY-MM-DD')
        let date_pay_end = moment().endOf('month').format('YYYY-MM-DD');
        if(request.input('date_pay_start')) {
            date_pay_start = request.input('date_pay_start')
            date_pay_start = moment(date_pay_start).startOf('month').format('YYYY-MM-DD')
            console.log(date_pay_start)
        }
        if(request.input('date_pay_end')) {
            date_pay_end = request.input('date_pay_end')
            date_pay_end = moment(date_pay_end).endOf('month').format('YYYY-MM-DD')
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
            user_costs[i].payer = {
                name: user_info.name,
                id: user_info.id,
                email: user_info.email
            }
            user_costs[i].date_pay = moment(user_costs[i].date_pay).format("YYYY-MM-DD")
            const living_cost = await LivingCost.find(user_costs[i].id)
            const list_user_ben = await living_cost
                .users()
                .select('id', 'name', 'email')
                .fetch()
            user_costs[i].receiver = list_user_ben.toJSON()
        }

        return user_costs
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
                    name: request.input('name'),
                    date_pay: request.input('date_pay'),
                    payer_id: request.input('payer').id,
                    price: request.input('price'),
                    detail: request.input('detail'),
                    name: request.input('name')
                })
            //delete data from pivot table
            await Database 
                .table('beneficiaries')
                .where('living_cost_id', request.input('id'))
                .delete()
            //create array separate elements for new insert to pivot table
            const user_ids = request.input('receiver')
            const fieldsToInsert = user_ids.map(user_id => 
                (
                    {
                        living_cost_id: request.input('id'),
                        user_id: user_id.id
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
            console.log(error)
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
    async removeCost({params, request, auth, response}) {
        try {
            const beneficiary = await Beneficiary.findBy('living_cost_id', params.id)
            const living_cost = await LivingCost.find(params.id)
            const result = await beneficiary.delete() && await living_cost.delete()
            return response.status(200).json({
                data: result
            })
        } catch (error) {
            console.log(error)
            return response.status(400).json({
                message: error.sqlMessage
            })
        }
    }
}

module.exports = CostController
