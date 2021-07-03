"use strict"

const cors = require('cors');
const bodyParser = require('body-parser')
const axios = require('axios')
const { model } = require('mongoose')

const config = require('./config');
const { priceSchema } = require('./model')
const { create, sessionUpdate, prepareDB, getExpiredtime } = require('./helper')

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
        console.log(req.path)
        if (req.path == '/get_price') {
            const ticker = req.body.ticker;
            const exchange = req.body.exchange;
            const from = req.body.from
            const to = req.body.to

            const insert_data = {
                date: "2017-01-03",
                open: 121.86,
                high: 122,
                low: 118.96,
                close: 119.62,
                adjusted_close: 107.0971,
                volume: 5123752
            }

            console.log(req.body);
            // const PriceModel = model(ticker, priceSchema)
            // const result = await create(insert_data, PriceModel)
            // console.log(result)
            return res.json({ data: ticker })

            // const result = await create(insert_data, PriceModel)

            // const user_id = await sessionUpdate(req, SessionModel);
            // if (user_id) {
            //     return axios.get(`${config.eodhistorical_api}${search_string}?api_token=${config.eodhistorical_token}&limit=15`, {
            //         "Content-type": "application/json",
            //     })
            //         .then(result => {
            //             const datum = result.data;
            //             const final_result = [];

            //             datum.map((item, index) => {
            //                 if (item.ISIN != null) {
            //                     final_result.push(item)
            //                 }
            //                 return;
            //             })

            //             if (final_result.length === 0) {
            //                 final_result.push(datum[0])
            //             }

            //             return res.json({ status: true, data: final_result })
            //         })
            //         .catch(error => {
            //             return res.json({ status: false, data: "Error" })
            //         });
            // }
        }
    }
}
