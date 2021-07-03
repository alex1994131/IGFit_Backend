"use strict"

const config = require('./config');
const cors = require('cors');
const bodyParser = require('body-parser')
const moment = require('moment-timezone')
const axios = require('axios')
const mongoose = require('mongoose')

const { UserModel, SessionModel, PortfolioModel /*, TransactionModel */ } = require('./model')
const { create, signAccessToken, sessionUpdate, getPortfolio, updateUserByPortfolio, getTransaction, updatePortfolioByTransaction } = require('./helper')

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
                const result = await getTransaction(portfolio, PortfolioModel);
                return res.json({ status: true, data: result })
            }
            else {
                return res.json({ status: false, data: "Sorry, we can't find user record." })
            }
        }
        else if (req.path == '/add_transaction') {
            const transaction = req.body;

            const user_id = await sessionUpdate(req, SessionModel);
            if (user_id) {
                const tickerArray = transaction.ticker.split(':');
                const name = tickerArray[0];
                const ticker = tickerArray[1];
                const currency = tickerArray[2];

                const new_transaction = {
                    _id: new mongoose.Types.ObjectId(),
                    name: name,
                    ticker: ticker,
                    date: transaction.date,
                    direction: transaction.direction,
                    price: transaction.price,
                    quantity: transaction.quantity,
                    commission: transaction.commission,
                    currency: currency,
                    total: (Number(transaction.price) * Number(transaction.quantity) + Number(transaction.commission))
                }

                // const flag = await create(new_transaction, TransactionModel)
                // if (!flag) {
                //     return res.json({ status: false, data: 'Internal server error' })
                // } else {
                //     const user_update = await updatePortfolioByTransaction(transaction.portfolio, flag, PortfolioModel)
                //     const result = await getTransaction(transaction.portfolio, PortfolioModel);
                //     return res.json({ status: true, data: result })
                // }

                const user_update = await updatePortfolioByTransaction(transaction.portfolio, new_transaction, PortfolioModel)
                if (user_update) {
                    const result = await getTransaction(transaction.portfolio, PortfolioModel);
                    return res.json({ status: true, data: result })
                }
                else {
                    return res.json({ status: false, data: 'Add failure' })
                }

            }
            else {
                return res.json({ status: false, data: "Sorry, we can't find user record." })
            }
        }
        else if (req.path == '/delete_transaction') {
            const transaction_id = req.body.transaction;
            const portfolio_id = req.body.portfolio;

            const user_id = await sessionUpdate(req, SessionModel);
            if (user_id) {
                // const transaction = await TransactionModel.findOne({ _id: transaction_id })
                // TransactionModel.findByIdAndRemove(transaction_id).exec();
                let transactionByPort = await PortfolioModel.find({ _id: portfolio_id })

                if (transactionByPort && transactionByPort.length > 0) {
                    transactionByPort = transactionByPort[0].transaction
                }
                else {
                    transactionByPort = []
                }

                transactionByPort.map((item, idx) => {
                    if (item['_id'].toString() == transaction_id) {
                        transactionByPort.splice(idx, 1);
                        console.log(JSON.stringify(transactionByPort));
                        return 0;
                    }
                })

                const update_flag = await PortfolioModel.updateOne({ _id: portfolio_id }, { $set: { transaction: transactionByPort } });
                if (update_flag) {
                    return res.json({ status: true, data: transactionByPort })
                }
                else {
                    return res.json({ status: false, data: 'Some error occur' })
                }
            }
            else {
                return res.json({ status: false, data: "Sorry, we can't find user record." })
            }
        }
        else if (req.path == '/get_ticker') {
            const search_string = req.body.search_string;
            const user_id = await sessionUpdate(req, SessionModel);
            if (user_id) {
                return axios.get(`${config.eodhistorical_api}${search_string}?api_token=${config.eodhistorical_token}&limit=15`, {
                    "Content-type": "application/json",
                })
                    .then(result => {
                        const datum = result.data;
                        const final_result = [];

                        datum.map((item, index) => {
                            if (item.ISIN != null) {
                                final_result.push(item)
                            }
                            return;
                        })

                        if (final_result.length === 0) {
                            final_result.push(datum[0])
                        }

                        return res.json({ status: true, data: final_result })
                    })
                    .catch(error => {
                        return res.json({ status: false, data: "Error" })
                    });
            }
        }
    }
}
