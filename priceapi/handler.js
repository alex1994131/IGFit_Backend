"use strict"

const cors = require('cors');
const bodyParser = require('body-parser')
const axios = require('axios')
const { model } = require('mongoose')

const config = require('./config');
const { priceSchema } = require('./model')
const { create, update, sessionUpdate, prepareDB, getExpiredtime } = require('./helper')

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
        if (req.path == '/get_price') {
            const ticker = req.query.ticker;
            const exchange = req.query.exchange;
            const from = req.query.from
            const to = req.query.to

            // const result = await create(insert_data, PriceModel)

            // const user_id = await sessionUpdate(req, SessionModel);

            const collection_name = `${ticker}_${exchange}`

            //if (user_id) {
            const PriceModel = model(collection_name, priceSchema)


            let recent_data = await PriceModel.find({ date: { $gte: new Date(from), $lte: new Date(to) } })/*.select({ date: 1 }).exec();*/
            const DAY_TIME = 24 * 60 * 60 * 1000

            if (recent_data.length === 0) {
                const api_result = await axios.get(`${config.eodhistorical_api}${ticker}.${exchange}?from=${from}&to=${to}&period=d&fmt=json&api_token=${config.eodhistorical_token}`, {
                    "Content-type": "application/json",
                })

                const datum = api_result.data
                let return_data = [], cur, idx, cnt, to_date = new Date(to);
                for (cur = new Date(from), idx = 0, cnt = 0; cur.getTime() <= to_date.getTime(); cur.setDate(cur.getDate() + 1)) {
                    if (idx >= datum.length) {
                        await create(
                            {
                                "date": cur,
                                "open": 0,
                                "high": 0,
                                "low": 0,
                                "close": 0,
                                "adjusted_close": 0,
                                "volume": 0
                            }
                            , PriceModel)
                        idx++
                    } else {
                        const tmp_date = new Date(datum[idx].date)
                        if (tmp_date.getTime() / DAY_TIME == cur.getTime() / DAY_TIME) {
                            const result = await create(datum[idx], PriceModel)
                            return_data.push(result);
                            idx++
                        }
                        else {
                            if (idx != 0) {
                                const result = await create({ ...datum[idx - 1], date: cur }, PriceModel)
                                return_data.push(result);
                            }
                            else {
                                await create(
                                    {
                                        "date": cur,
                                        "open": 0,
                                        "high": 0,
                                        "low": 0,
                                        "close": 0,
                                        "adjusted_close": 0,
                                        "volume": 0
                                    }
                                    , PriceModel)
                            }
                        }
                    }
                }

                return res.json({ status: 1, data: return_data })
            }
            else {
                const from_d = new Date(from);
                const to_d = new Date(to);
                const days = (to_d.getTime() - from_d.getTime()) / DAY_TIME + 1;

                if (recent_data.length == days) {
                    return res.json({ status: 1, data: recent_data })
                }
                else {
                    const api_result = await axios.get(`${config.eodhistorical_api}${ticker}.${exchange}?from=${from}&to=${to}&period=d&fmt=json&api_token=${config.eodhistorical_token}`, {
                        "Content-type": "application/json",
                    })

                    const datum = api_result.data
                    let return_data = [], cur, idx, cnt, to_date = new Date(to);
                    for (cur = new Date(from), idx = 0, cnt = 0; cur.getTime() <= to_date.getTime(); cur.setDate(cur.getDate() + 1)) {
                        if (idx >= datum.length) {
                            await update(
                                {
                                    "date": cur,
                                    "open": 0,
                                    "high": 0,
                                    "low": 0,
                                    "close": 0,
                                    "adjusted_close": 0,
                                    "volume": 0
                                }
                                , PriceModel)
                            idx++
                        } else {
                            const tmp_date = new Date(datum[idx].date)
                            if (tmp_date.getTime() / DAY_TIME == cur.getTime() / DAY_TIME) {
                                const result = await update(datum[idx], PriceModel)
                                return_data.push(result);
                                idx++
                            }
                            else {
                                if (idx != 0) {
                                    const result = await update({ ...datum[idx - 1], date: cur }, PriceModel)
                                    return_data.push(result);
                                    // cnt++
                                }
                                else {
                                    await update(
                                        {
                                            "date": cur,
                                            "open": 0,
                                            "high": 0,
                                            "low": 0,
                                            "close": 0,
                                            "adjusted_close": 0,
                                            "volume": 0
                                        }
                                        , PriceModel)
                                }
                            }
                        }
                    }

                    console.log(`${recent_data.length} : ${days}`);
                    return res.json({ status: 1, data: return_data })
                }
            }
            //}
        }
    }
}
