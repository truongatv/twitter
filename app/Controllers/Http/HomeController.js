'use strict'
const User = use('App/Models/User')
const Home = use('App/Models/Home')
const Database = use('Database')
const Config = use('Config')

class HomeController {
    /**
     * get all info of home 
     */
    async homeInfo({auth, response}) {
        try {
            //setup home's data
            let home_info = {
                admin: {},
                homeInfo: {},
                members: []
            }
            //setup column need get
            const column = {
                full_name: 'users.name', 
                user_id: 'users.id',
                user_email: 'users.email',
                avatar: 'users.avatar'
            }
            home_info.homeInfo = await this.getHomeInfo(auth.current.user.id)
            home_info.admin = await this.getHomeAdminInfo(home_info.homeInfo.id)
            home_info.members = await this.getMemberInfo(home_info.homeInfo.id, column)
            if(home_info.members.length > 0) {
                return response.status(200).json({
                    status: 'success',
                    data: home_info
                })
            } else {
                return response.status(400).json({
                    message: 'error'
                })
            }
        } catch (error) {
            return response.status(400).json({
                message: error.sqlMessage
            })
        }
    }
    
    /**
     * update home info
     * @param {string} name Home's name.
     * @param {string} address Home's address
     * @param {string} admin_id Home's admin id
     */
    async homeUpdate({request, auth, response}) {
        try{
            const homeId = await Database
                .select('home_id')
                .table('users')
                .innerJoin('homes', 'users.home_id', 'homes.id')
                .where('users.id', auth.current.user.id)
                .limit(1)
            if(homeId.length == 0) {
                const id = await Database
                    .table('homes')
                    .insert({
                        'name': request.input('name'),
                        'address': request.input('address'),
                        'admin_id': auth.current.user.id,
                        'currency_id': request.input('currency_id')
                    })
                await Database 
                    .table('users')
                    .update({ 'home_id':  id})
                    .where('id', auth.current.user.id)
            } else {
                const id = await Database
                    .table('homes')
                    .where('id', homeId[0].home_id)
                    .update({
                        'name': request.input('name'),
                        'address': request.input('address'),
                        'admin_id': request.input('admin_id'),
                        'currency_id': request.input('currency_id')
                    })
            }

            return response.status(200).json({
                status: 'success',
                message: Config.get('response.message.saveSuccess')
            })
        } catch(error) {
            return response.status(400).json({
                status: 'error',
                message: Config.get('response.message.cantSave')
            })
        }
    }


    async listUser({auth, response}) {
        const column = {
            admin_id: 'homes.admin_id', 
            full_name: 'users.name', 
            user_id: 'users.id'
        }
        const homeInfo = await this.getHomeInfo(auth.current.user.id, column)

        return response.status(200).json({
            status: 'message',
            data: homeInfo
        })
        
    }

    /**
    *get home info and list user
    * @param {int} userId user's id
    * @param {json} column list column select
    */
    async getHomeInfo(userId) {
        try {
            const home_id = await Database
                .select('home_id')
                .table('users')
                .where('users.id', userId)
            if(home_id.length > 0) {
                const homeInfo = await Database
                    .table('homes')
                    .where('id', home_id[0].home_id)
                return homeInfo[0]
            } else {
                return {}
            }
        } catch (error) {
            return false
        }
    }

    /**
    add new member to home
    * @param {string} email user's email
    */
    async addMember({request, auth, response}) {
        try {
            if(await this.checkIsAdminHome(auth) == false) {
                throw Config.get('errors.message.notAdminHome')
            } else {
                const userEmail = request.input('email')
                //get user's home_id
                const user = await User.findBy('email', userEmail)
                if(!user) { //push throw user not exist
                    throw  Config.get('errors.message.userNotExist')
                } else if(!user.toJSON().home_id) {
                    //get home_id from admin user
                    const home_id = await User
                        .query()
                        .select('home_id')
                        .where('id', auth.current.user.id)
                        .fetch()
                    //push home_id to user | add user to home
                    await User
                        .query()
                        .update({ home_id:  home_id.toJSON()[0].home_id})
                        .where('id', user.toJSON().id)
                    return response.status(201).json({
                        data: user
                    })
                } else {
                    throw Config.get('errors.message.userIsReadyInOtherHome')
                }
            }                                                                                                                                                                                                                                                                                                                          
        } catch (error) {
            if(error == Config.get('errors.message.notAdminHome')) {
                return response.status(400).json({
                    message: Config.get('errors.message.notAdminHome')
                })
            } else if(error == Config.get('errors.message.userIsReadyInOtherHome')) {
                return response.status(400).json({
                    message: Config.get('errors.message.userIsReadyInOtherHome')
                })
            }  else if(error == Config.get('errors.message.userNotExist')) {
                return response.status(400).json({
                    message: Config.get('errors.message.userNotExist')
                })
            }
            else {
                return response.status(400).json({
                    message: error
                })
            }
        }
    }

    /**
    remove user from home
    *@param {int} remove_user_id user's id need remove
    */
    async removeMember({request, auth, response}) {
        try {
            const adminHomeId = await User
                .query()
                .select('home_id')
                .whereIn('id', [auth.current.user.id, request.input('remove_user_id')])
                .fetch()
            if(adminHomeId.toJSON()[0].home_id == adminHomeId.toJSON()[1].home_id) {
                const result = await User
                    .query()
                    .where('id', request.input('remove_user_id'))
                    .update({ home_id: null })
                return response.status(200).json({
                    data: 1
                })
            } else {
                throw Config.get('errors.message.userNotExistInHome')
            }
            
        } catch (error) {
            if(error == Config.get('errors.message.userNotExistInHome')) {
                return response.status(400).json({
                    message: Config.get('errors.message.userNotExistInHome')
                })
            } else {
                return response.status(400).json({
                    message: error.sqlMessage
                })
            }
        }
        
    }

    /**
    *check user is home's admin
    *@param {auth} auth authentication variable
    */
    async checkIsAdminHome(auth) {
        const home = await Home
            .query()
            .select('admin_id')
            .with('users')
            .where('admin_id', auth.current.user.id)
            .fetch()
        if(home.rows.length > 0) {
            return true
        } else {
            return false
        }
    }

    /**
    * get home members
    */
    async getHomeMember({auth, response}) {
        try{
            const currentUser = await User.find(auth.current.user.id)
            if(currentUser.home_id) {
                const homeMember = await User
                    .query()
                    .select(`id`, `name`, `email`, `home_id`, 'avatar')
                    .where('home_id', currentUser.home_id)
                    .fetch()
                
                return response.status(200).json({
                    data: homeMember.toJSON()
                })
            } else {
                const homeMember = [
                    {
                        id: currentUser.id,
                        name: currentUser.name,
                        email: currentUser.email,
                        home_id: currentUser.home_id 
                    }
                ]
                return response.status(200).json({
                    data: homeMember
                })
            }
        } catch(error) {
            return response.status(400).json({
                data: error.sqlMessage
            })
        }
    }

    /**
    *get home's admin info
    *@param int homeId home's id
    */
    async getHomeAdminInfo(homeId) {
        try {
            const result = await Database 
                .select('users.id', 'users.name')
                .table('users')
                .innerJoin('homes', 'users.id', 'homes.admin_id')
                .where('homes.id', homeId)
            return result[0]
        } catch (error) {
            return {}
        }
    }

    /**
    *get home's member info  
    *@param int homeId home's id 
    */
    async getMemberInfo(homeId, column) {
        try {
            const homeInfo = await Database
                .select(column)
                .table('users')
                .innerJoin('homes', 'users.home_id', 'homes.id')
                .where('users.home_id', homeId)
            return homeInfo
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports = HomeController
