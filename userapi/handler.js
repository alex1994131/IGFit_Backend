"use strict"

const config = require('./config');
const cors = require('cors');
const bodyParser = require('body-parser')
const axios = require('axios')

const { UserModel, SessionModel, PortfolioModel, TransactionModel } = require('./model')
const { create, signAccessToken, sessionUpdate, getPortfolio, updateUserByPortfolio, getTransaction, deleteTransaction } = require('./helper')

module.exports = async (config) => {
    const routing = new Routing(config.app);
    routing.configure();
    routing.bind(routing.handle);
}

class Routing {
    constructor(app) {
        this.app = app;
        const connection = config.connection;
    }

    configure() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.raw());
        this.app.use(bodyParser.text({ type: "text/*" }));
        this.app.disable('x-powered-by');
        this.app.use(cors());
    }

    bind(route) {
        this.app.post('/*', route);
        this.app.get('/*', route);
        this.app.patch('/*', route);
        this.app.put('/*', route);
        this.app.delete('/*', route);
    }

    async handle(req, res, next) {
        if (req.path == '/signin') {
            const user = req.body;

            const userInfo = await UserModel.findOne({ email: user.email })
            if (!userInfo) {
                return res.json({ status: false, message: "Sorry, we can't find this email or username." })
            }
            if (!userInfo.validPassword(user.password, userInfo.password)) {
                return res.json({ status: false, message: 'You entered wrong password.' })
            }
            const session = await signAccessToken(req, userInfo._id, SessionModel)
            const row = {
                email: userInfo.email,
                username: userInfo.username,
                portofolio: userInfo.portofolio
            }
            return res.json({ status: true, user: row, accessToken: session })
        }
        else if (req.path == '/signup') {
            const user = req.body

            const emailExit = await UserModel.findOne({ email: user.email })
            if (emailExit) {
                return res.json({ status: false, message: 'It have already created' })
            }

            const result = await create(user, UserModel)
            if (!result) {
                return res.json({ status: false, message: 'Internal server error' })
            } else {
                return res.json({ status: true, message: 'Sign up success' })
            }
        }
        else if (req.path == '/get_user') {
            const token = req.body;
            const accessToken = token.token

            const session_record = await SessionModel.findOne({ token: accessToken })
            const user_id = session_record.user_id
            if (!user_id) {
                return res.json({ status: false, message: "Sorry, we can't find Session record." })
            }

            const userInfo = await UserModel.findById(user_id)
            if (!userInfo) {
                return res.json({ status: false, message: "Sorry, we can't find user record." })
            }

            const row = {
                email: userInfo.email,
                username: userInfo.username,
                portofolio: userInfo.portofolio
            }

            return res.json({ status: true, user: row })
        }
        else if (req.path == '/signout') {
            const token = req.body;
            const accessToken = token.token

            await SessionModel.findOneAndDelete({ token: accessToken })
            return res.json({ status: true })
        }
        else if (req.path == '/get_portfolio') {
            const user_id = await sessionUpdate(req, SessionModel);
            if (user_id) {
                const result = await getPortfolio(user_id, PortfolioModel);
                return res.json({ status: true, data: result })
            }
            else {
                return res.json({ status: false, message: "Sorry, we can't find user record." })
            }
        }
        else if (req.path == '/new_portfolio') {
            const portfolio = req.body;

            const user_id = await sessionUpdate(req, SessionModel);
            if (user_id) {
                portfolio.user_id = user_id;

                const result = await create(portfolio, PortfolioModel)
                if (!result) {
                    return res.json({ status: false, flag: 2, message: 'Internal server error' })
                } else {
                    const update_data = {
                        id: result._id,
                        name: result.name
                    }
                    const user_update = await updateUserByPortfolio(user_id, update_data, UserModel)
                    const ports = await getPortfolio(user_id, PortfolioModel);
                    return res.json({ status: true, data: ports })
                }
            }
            else {
                return res.json({ status: false, flag: 1, message: "Sorry, we can't find user record." })
            }
        }
        else if (req.path == '/get_transaction') {
            const portfolio = req.body.portfolio;
            const user_id = await sessionUpdate(req, SessionModel);

            if (user_id) {
                const result = await getTransaction(portfolio, TransactionModel);
                return res.json({ status: true, data: result })
            }
            else {
                return res.json({ status: false, message: "Sorry, we can't find user record." })
            }
        }
        else if (req.path == '/add_transaction') {
            const transaction = req.body;

            const user_id = await sessionUpdate(req, SessionModel);
            if (user_id) {
                const flag = await create(transaction, TransactionModel)
                if (!flag) {
                    return res.json({ status: false, message: 'Internal server error' })
                } else {
                    const result = await getTransaction(transaction.portfolio, TransactionModel);
                    return res.json({ status: true, data: result })
                }
            }
            else {
                return res.json({ status: false, flag: 1, message: "Sorry, we can't find user record." })
            }
        }

        else if (req.path == '/delete_transaction') {
            const transaction_id = req.body.id;
            const user_id = await sessionUpdate(req, SessionModel);
            if (user_id) {
                const transaction = await TransactionModel.findOne({ _id: transaction_id })
                const portfolio = transaction.portfolio;
                TransactionModel.findByIdAndRemove(transaction_id).exec();
                const result = await getTransaction(portfolio, TransactionModel);
                return res.json({ status: true, data: result })
            }
            else {
                return res.json({ status: false, flag: 1, message: "Sorry, we can't find user record." })
            }
        }
        else if (req.path == '/get_ticker') {
            const search_string = req.body.search_string;
            const user_id = await sessionUpdate(req, SessionModel);
            if (user_id) {
                return axios.get(`${config.eodhistorical_api}${search_string}?api_token=${config.eodhistorical_token}`, {
                    "Content-type": "application/json",
                })
                    .then(result => {
                        return res.json({ status: true, data: result.data })
                    })
                    .catch(error => {
                        return res.json({ status: false, data: "Error" })
                    });
            }
        }
        // else if (req.path == 'changePassword') {
        //     // const { users_id, newPassword, currentPassword } = req.body
        //     // const user = await Models.Users.findById(users_id)
        //     // if (!user.validPassword(currentPassword, user.password)) {
        //     //     return res.json({ status: false, message: 'passwords do not match' })
        //     // }
        //     // const password = user.generateHash(newPassword)
        //     // const result = await Models.Users.findByIdAndUpdate(users_id, { password })
        //     // if (result) {
        //     //     return res.json({ status: true })
        //     // } else {
        //     //     return res.json({ status: false, error: "server error" })
        //     // }
        // }
    }
}
