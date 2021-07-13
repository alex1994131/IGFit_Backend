"use strict";

const config = require("./config");
const cors = require("cors");
const bodyParser = require("body-parser");
const moment = require("moment-timezone");
const axios = require("axios");
const mongoose = require("mongoose");

const {
  UserModel,
  SessionModel,
  PortfolioModel,
  priceSchema /*, TransactionModel */,
} = require("./model");

const {
  create,
  signAccessToken,
  sessionUpdate,
  getPortfolio,
  updateUserByPortfolio,
  getTransaction,
  updatePortfolioByTransaction,
  updatePrice,
} = require("./helper");

module.exports = async (config) => {
  const routing = new Routing(config.app);
  routing.configure();
  routing.bind(routing.handle);
};

class Routing {
  constructor(app) {
    this.app = app;
    const connection = config.connection;
  }

  configure() {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.raw());
    this.app.use(bodyParser.text({ type: "text/*" }));
    this.app.disable("x-powered-by");
    this.app.use(cors());
  }

  bind(route) {
    this.app.post("/*", route);
    this.app.get("/*", route);
    this.app.patch("/*", route);
    this.app.put("/*", route);
    this.app.delete("/*", route);
  }

  async handle(req, res, next) {
    if (req.path == "/signin") {
      const user = req.body;

      const userInfo = await UserModel.findOne({ email: user.email });
      if (!userInfo) {
        return res.json({
          status: false,
          message: "Sorry, we can't find this email or username.",
        });
      }
      if (!userInfo.validPassword(user.password, userInfo.password)) {
        return res.json({
          status: false,
          message: "You entered wrong password.",
        });
      }
      const session = await signAccessToken(req, userInfo._id, SessionModel);
      const row = {
        email: userInfo.email,
        username: userInfo.username,
        portofolio: userInfo.portofolio,
      };
      return res.json({ status: true, user: row, accessToken: session });
    } else if (req.path == "/signup") {
      const user = req.body;

      const emailExit = await UserModel.findOne({ email: user.email });
      if (emailExit) {
        return res.json({ status: false, message: "It have already created" });
      }

      const result = await create(user, UserModel);
      if (!result) {
        return res.json({ status: false, message: "Internal server error" });
      } else {
        return res.json({ status: true, message: "Sign up success" });
      }
    } else if (req.path == "/get_user") {
      const user_id = await sessionUpdate(req, SessionModel);
      console.log(user_id);
      if (!user_id) {
        return res.json({
          status: false,
          message: "Sorry, we can't find Session record.",
        });
      }

      const userInfo = await UserModel.findById(user_id);
      if (!userInfo) {
        return res.json({
          status: false,
          message: "Sorry, we can't find user record.",
        });
      }

      const row = {
        email: userInfo.email,
        username: userInfo.username,
        portofolio: userInfo.portfolio,
        currency: userInfo.currency,
      };

      return res.json({ status: true, user: row });
    } else if (req.path == "/update_basecurrency") {
      const currency = req.body.currency;

      const user_id = await sessionUpdate(req, SessionModel);
      if (!user_id) {
        return res.json({
          status: false,
          message: "Sorry, we can't find Session record.",
        });
      } else {
        let result = await UserModel.updateOne(
          { _id: user_id },
          { $set: { currency: currency } }
        );
        const userInfo = await UserModel.findById(user_id);
        if (userInfo) {
          const row = {
            email: userInfo.email,
            username: userInfo.username,
            portofolio: userInfo.portfolio,
            currency: userInfo.currency,
          };

          return res.json({ status: true, data: row });
        } else {
          return res.json({
            status: false,
            data: "Sorry, we can't update user base currency.",
          });
        }
      }
    } else if (req.path == "/signout") {
      const token = req.body;
      const accessToken = token.token;

      await SessionModel.findOneAndDelete({ token: accessToken });
      return res.json({ status: true });
    } else if (req.path == "/get_portfolio") {
      const user_id = await sessionUpdate(req, SessionModel);
      if (user_id) {
        const result = await getPortfolio(user_id, PortfolioModel);
        return res.json({ status: true, data: result });
      } else {
        return res.json({
          status: false,
          message: "Sorry, we can't find user record.",
        });
      }
    } else if (req.path == "/get_portfolioOne") {

      const portfolio_id = req.body.id

      const user_id = await sessionUpdate(req, SessionModel);
      if (user_id) {
        const result = await PortfolioModel.findOne({ _id: portfolio_id });
        return res.json({ status: true, data: result });
      } else {
        return res.json({
          status: false,
          data: "Sorry, we can't find portfolio record.",
        });
      }
    } else if (req.path == "/calc_portfolio") {
			let today_date = new Date();
			today_date = today_date.toISOString().slice(0, 10)

			let user_id
			let auth_key = req.body.auth_key
			if(auth_key == "SECRET_BACKEND_IG_API") {
				user_id = 1
			}
			else {
				user_id = await sessionUpdate(req, SessionModel);
			}

			if (user_id) {
				const result = await PortfolioModel.find({});
			
				for(let i=0; i<result.length; i++) {
					const transaction = result[i].transaction

					result[i].position = {}
					let position = {}

					for(let j=0; j<transaction.length; j++) {
						const name = transaction[j].name;
						const ticker = transaction[j].ticker;
						const exchange = transaction[j].exchange;
						const quantity = transaction[j].quantity;
						
						if(!(`${ticker}-${exchange}` in position)) {

							// let api_result = await axios.get(`${config.eodhistorical_price_api}${ticker}.${exchange}?from=${today_date}&to=${today_date}&period=d&fmt=json&api_token=${config.eodhistorical_token}`,
							// 	{
							// 		"Content-type": "application/json",
							// 	}
							// );
							const parameter = {
								ticker: ticker,
								exchange: exchange,
								from: today_date,
								to: today_date,
								auth_key: auth_key
							}

							let api_result = await axios.create({
								headers: {
									"Access-Control-Allow-Origin": "*",
									'Content-Type': 'application/json'
								}
							}).post('https://faasd.tyap.cloud/function/userapi/get_price', parameter);

							// if(!api_result || api_result.data.length == 0) { 
							// 	let temp_date = today_date;
							// 	while(1) {
							// 		temp_date = new Date(temp_date)
							// 		temp_date.setDate(temp_date.getDate() - 1)
							// 		temp_date = temp_date.toISOString().slice(0, 10)
									
							// 		api_result = await axios.get(`${config.eodhistorical_price_api}${ticker}.${exchange}?from=${temp_date}&to=${temp_date}&period=d&fmt=json&api_token=${config.eodhistorical_token}`,
							// 			{
							// 				"Content-type": "application/json",
							// 			}
							// 		);

							// 		if(api_result && api_result.data.length > 0) { 
							// 			break;
							// 		}
							// 	}

							// 	console.log(temp_date)
							// }
							
							api_result = api_result.data.data

							console.log(api_result)

							position[`${ticker}-${exchange}`] = {}

							position[`${ticker}-${exchange}`].name = name
							position[`${ticker}-${exchange}`].ticker = ticker;
							position[`${ticker}-${exchange}`].exchange = exchange;
							position[`${ticker}-${exchange}`].price = api_result[0].adjusted_close;
							position[`${ticker}-${exchange}`].quantity = Number(quantity);
						}
						else {
							position[`${ticker}-${exchange}`].quantity = Number(position[`${ticker}-${exchange}`].quantity) + Number(quantity)
						}
					}

					let total_value = 0

					for (let [key, element] of Object.entries(position)) {
						total_value += Number(element.quantity) * Number(element.price)
					}

					console.log(total_value)
					console.log(position)

					await PortfolioModel.updateOne(
						{ _id: result[i]._id },
						{ 
							$set: { 
								value: total_value,
								position: position
							} 
						}
					);
				}

				return res.json({ status: true });
			}
			else {
				return res.json({ status: false });
			}
    } else if (req.path == "/new_portfolio") {
      const portfolio = req.body;

      const user_id = await sessionUpdate(req, SessionModel);
      if (user_id) {
        portfolio.user_id = user_id;

        const result = await create(portfolio, PortfolioModel);
        if (!result) {
          return res.json({
            status: false,
            flag: 2,
            message: "Internal server error",
          });
        } else {
          const update_data = {
            id: result._id,
            name: result.name,
          };
          const user_update = await updateUserByPortfolio(
            user_id,
            update_data,
            UserModel
          );
          const ports = await getPortfolio(user_id, PortfolioModel);
          return res.json({ status: true, data: ports });
        }
      } else {
        return res.json({
          status: false,
          flag: 1,
          message: "Sorry, we can't find user record.",
        });
      }
    } else if (req.path == "/get_transaction") {
      const portfolio = req.body.portfolio;
      const user_id = await sessionUpdate(req, SessionModel);

      if (user_id) {
        const result = await getTransaction(portfolio, PortfolioModel);
        return res.json({ status: true, data: result });
      } else {
        return res.json({
          status: false,
          data: "Sorry, we can't find user record.",
        });
      }
    } else if (req.path == "/add_transaction") {
      const transaction = req.body;

      const user_id = await sessionUpdate(req, SessionModel);
      if (user_id) {
        const tickerArray = transaction.ticker.split(":");
        const name = tickerArray[0];
        const exchange = tickerArray[1];
        const ticker = tickerArray[2];
        const currency = tickerArray[3];

        const new_transaction = {
          _id: new mongoose.Types.ObjectId(),
          name: name,
          ticker: ticker,
          exchange: exchange,
          date: transaction.date,
          direction: transaction.direction,
          price: Number(transaction.price),
          quantity: Number(transaction.quantity),
          commission: Number(transaction.commission),
          currency: currency,
          total: Number(transaction.price) * Number(transaction.quantity) - Number(transaction.commission),
        };

        // const flag = await create(new_transaction, TransactionModel)
        // if (!flag) {
        //     return res.json({ status: false, data: 'Internal server error' })
        // } else {
        //     const user_update = await updatePortfolioByTransaction(transaction.portfolio, flag, PortfolioModel)
        //     const result = await getTransaction(transaction.portfolio, PortfolioModel);
        //     return res.json({ status: true, data: result })
        // }

        const user_update = await updatePortfolioByTransaction(
          transaction.portfolio,
          new_transaction,
          PortfolioModel
        );
        if (user_update) {
          const result = await getTransaction(
            transaction.portfolio,
            PortfolioModel
          );
          return res.json({ status: true, data: result });
        } else {
          return res.json({ status: false, data: "Add failure" });
        }
      } else {
        return res.json({
          status: false,
          data: "Sorry, we can't find user record.",
        });
      }
    } else if (req.path == "/delete_transaction") {
      const transaction_id = req.body.transaction;
      const portfolio_id = req.body.portfolio;

      const user_id = await sessionUpdate(req, SessionModel);
      if (user_id) {
        // const transaction = await TransactionModel.findOne({ _id: transaction_id })
        // TransactionModel.findByIdAndRemove(transaction_id).exec();
        let transactionByPort = await PortfolioModel.find({
          _id: portfolio_id,
        });

        if (transactionByPort && transactionByPort.length > 0) {
          transactionByPort = transactionByPort[0].transaction;
        } else {
          transactionByPort = [];
        }

        transactionByPort.map((item, idx) => {
          if (item["_id"].toString() == transaction_id) {
            transactionByPort.splice(idx, 1);
            console.log(JSON.stringify(transactionByPort));
            return 0;
          }
        });

        const update_flag = await PortfolioModel.updateOne(
          { _id: portfolio_id },
          { $set: { transaction: transactionByPort } }
        );
        if (update_flag) {
          return res.json({ status: true, data: transactionByPort });
        } else {
          return res.json({ status: false, data: "Some error occur" });
        }
      } else {
        return res.json({
          status: false,
          data: "Sorry, we can't find user record.",
        });
      }
    } else if (req.path == "/get_ticker") {
      const search_string = req.body.search_string;
      const user_id = await sessionUpdate(req, SessionModel);
      if (user_id) {
        axios
          .get(
            `${config.eodhistorical_ticker_api}${search_string}?api_token=${config.eodhistorical_token}&limit=15`,
            {
              "Content-type": "application/json",
            }
          )
          .then((result) => {
            const datum = result.data;
            const final_result = [];

            datum.map((item, index) => {
              if (item.ISIN != null) {
                final_result.push(item);
              }
              return;
            });

            if (final_result.length === 0) {
              final_result.push(datum[0]);
            }

            return res.json({ status: true, data: final_result });
          })
          .catch((error) => {
            return res.json({ status: false, data: "Error" });
          });
      }
    } else if (req.path == "/get_price") {
      let ticker = req.body.ticker;
      let exchange = req.body.exchange;
      let from = req.body.from;
      let to = req.body.to;

      // let ticker = req.query.ticker;
      // let exchange = req.query.exchange;
      // let from = req.query.from
      // let to = req.query.to

      from = new Date(from).toISOString().slice(0, 10);
      to = new Date(to).toISOString().slice(0, 10);

      if (ticker !== undefined && exchange !== undefined) {
        let user_id
				
				if(req.body.auth_key == "SECRET_BACKEND_IG_API") {
					user_id = 1
				}
				else {
					user_id = await sessionUpdate(req, SessionModel);
				}
				
        if (user_id) {
          const collection_name = `${ticker}_${exchange}`;
          const PriceModel = mongoose.model(collection_name, priceSchema);

          let recent_data = await PriceModel.find({
            date: {
              $gte: moment.tz(new Date(from), "Etc/UTC").add("5", "hours"),
              $lte: moment.tz(new Date(to), "Etc/UTC").add("5", "hours"),
            },
          }); /*.select({ date: 1 }).exec();*/
          const DAY_TIME = 24 * 60 * 60 * 1000;

          let new_from = new Date(from);
          new_from.setDate(new_from.getDate() - 14);
          const new_from_str = new_from.toISOString().slice(0, 10);

          if (recent_data.length === 0) {
            let api_result;
            try {
              api_result = await axios.get(
                `${config.eodhistorical_price_api}${ticker}.${exchange}?from=${new_from_str}&to=${to}&period=d&fmt=json&api_token=${config.eodhistorical_token}`,
                {
                  "Content-type": "application/json",
                }
              );
            } catch (err) {
              return res.json({ status: 0 });
            }

            console.log("-----------------", 1);

            const datum = api_result.data;
            let cur,
              lst,
              idx,
              cnt,
              from_date = new Date(from);

            for (
              cur = new Date(to), idx = datum.length - 1, cnt = 0;
              cur.getTime() >= from_date.getTime();
              cur.setDate(cur.getDate() - 1)
            ) {
              if (idx == -1) {
                break;
              } else {
                const tmp_date = new Date(datum[idx].date);
                if (tmp_date.getTime() / DAY_TIME == cur.getTime() / DAY_TIME) {
                  const result = await create(datum[idx], PriceModel);
                  idx--;
                } else {
                  if (idx != datum.length - 1) {
                    const result = await create(
                      { ...datum[idx], date: cur },
                      PriceModel
                    );
                  } else {
                    cnt++;
                  }
                }
              }
            }

            if (cnt > 0 && datum.length > 0) {
              for (
                lst = new Date(to);
                cnt > 0 && datum.length > 0;
                lst.setDate(lst.getDate() - 1), cnt--
              ) {
                const result = await create(
                  { ...datum[datum.length - 1], date: lst },
                  PriceModel
                );
              }
            }

            if (idx == -1 && cur.getTime() > from_date.getTime()) {
              let newer_from = new Date(from);
              newer_from.setDate(newer_from.getDate() - 50);
              const newer_from_str = newer_from.toISOString().slice(0, 10);

              let new_api_result;
              try {
                new_api_result = await axios.get(
                  `${config.eodhistorical_price_api}${ticker}.${exchange}?from=${newer_from_str}&to=${from}&period=d&fmt=json&api_token=${config.eodhistorical_token}`,
                  {
                    "Content-type": "application/json",
                  }
                );
              } catch (err) {
                return res.json({ status: 0 });
              }

              const new_datum = new_api_result.data;

              if (new_datum.length == 0) {
                for (
                  ;
                  cur.getTime() >= from_date.getTime();
                  cur.setDate(cur.getDate() - 1)
                ) {
                  const result = await create(
                    { ...datum[0], date: cur },
                    PriceModel
                  );
                }
              } else {
                for (
                  ;
                  cur.getTime() >= from_date.getTime() && cnt == 0;
                  cur.setDate(cur.getDate() - 1)
                ) {
                  const result = await create(
                    { ...new_datum[new_datum.length - 1], date: cur },
                    PriceModel
                  );
                }
                if (cnt > 0) {
                  for (
                    lst = new Date(to);
                    cnt > 0;
                    lst.setDate(lst.getDate() - 1), cnt--
                  ) {
                    const result = await create(
                      { ...new_datum[new_datum.length - 1], date: lst },
                      PriceModel
                    );
                  }
                }
              }
            }

            return PriceModel.find({
              date: {
                $gte: moment.tz(new Date(from), "Etc/UTC").add("5", "hours"),
                $lte: moment.tz(new Date(to), "Etc/UTC").add("5", "hours"),
              },
            })
              .sort({ date: 1 })
              .exec()
              .then((data) => {
                return res.json({ status: 1, data: data });
              })
              .catch(console.log);
          } else {
            const from_d = new Date(from);
            const to_d = new Date(to);
            const days = (to_d.getTime() - from_d.getTime()) / DAY_TIME + 1;

            if (recent_data.length == days) {
              console.log("---------------------", 0);
              return res.json({ status: 1, data: recent_data });
            } else {
              let api_result;
              try {
                api_result = await axios.get(
                  `${config.eodhistorical_price_api}${ticker}.${exchange}?from=${new_from_str}&to=${to}&period=d&fmt=json&api_token=${config.eodhistorical_token}`,
                  {
                    "Content-type": "application/json",
                  }
                );
              } catch (err) {
                return res.json({ status: 0 });
              }

              console.log("-----------------", 1);

              const datum = api_result.data;
              let cur,
                lst,
                idx,
                cnt,
                from_date = new Date(from);

              for (
                cur = new Date(to), idx = datum.length - 1, cnt = 0;
                cur.getTime() >= from_date.getTime();
                cur.setDate(cur.getDate() - 1)
              ) {
                if (idx == -1) {
                  break;
                } else {
                  const tmp_date = new Date(datum[idx].date);
                  if (
                    tmp_date.getTime() / DAY_TIME ==
                    cur.getTime() / DAY_TIME
                  ) {
                    const result = await updatePrice(datum[idx], PriceModel);
                    idx--;
                  } else {
                    if (idx != datum.length - 1) {
                      const result = await updatePrice(
                        { ...datum[idx], date: cur },
                        PriceModel
                      );
                    } else {
                      cnt++;
                    }
                  }
                }
              }

              if (cnt > 0 && datum.length > 0) {
                for (
                  lst = new Date(to);
                  cnt > 0 && datum.length > 0;
                  lst.setDate(lst.getDate() - 1), cnt--
                ) {
                  const result = await updatePrice(
                    { ...datum[datum.length - 1], date: lst },
                    PriceModel
                  );
                }
              }

              if (idx == -1 && cur.getTime() > from_date.getTime()) {
                let newer_from = new Date(from);
                newer_from.setDate(newer_from.getDate() - 50);
                const newer_from_str = newer_from.toISOString().slice(0, 10);

                let new_api_result;
                try {
                  new_api_result = await axios.get(
                    `${config.eodhistorical_price_api}${ticker}.${exchange}?from=${newer_from_str}&to=${from}&period=d&fmt=json&api_token=${config.eodhistorical_token}`,
                    {
                      "Content-type": "application/json",
                    }
                  );
                } catch (err) {
                  return res.json({ status: 0 });
                }

                const new_datum = new_api_result.data;

                if (new_datum.length == 0) {
                } else {
                  for (
                    ;
                    cur.getTime() >= from_date.getTime() && cnt == 0;
                    cur.setDate(cur.getDate() - 1)
                  ) {
                    const result = await updatePrice(
                      { ...new_datum[new_datum.length - 1], date: cur },
                      PriceModel
                    );
                  }
                  if (cnt > 0) {
                    for (
                      lst = new Date(to);
                      cnt > 0;
                      lst.setDate(lst.getDate() - 1), cnt--
                    ) {
                      const result = await updatePrice(
                        { ...new_datum[new_datum.length - 1], date: lst },
                        PriceModel
                      );
                    }
                  }
                }
              }

              return PriceModel.find({
                date: {
                  $gte: moment.tz(new Date(from), "Etc/UTC").add("5", "hours"),
                  $lte: moment.tz(new Date(to), "Etc/UTC").add("5", "hours"),
                },
              })
                .sort({ date: 1 })
                .exec()
                .then((data) => {
                  return res.json({ status: 1, data: data });
                })
                .catch(console.log);
            }
          }
        } else {
          return res.json({ status: 0, flag: 1 });
        }
      } else {
        return res.json({ status: 0, flag: 2 });
      }
    } else if (req.path == "/get_currency") {
      let current_currency = req.body.current_currency;
      let base_currency = req.body.base_currency;
      let from = req.body.from;
      let to = req.body.to;

      // let current_currency = req.query.current_currency;
      // let base_currency = req.query.base_currency;
      // let from = req.query.from
      // let to = req.query.to

      from = new Date(from).toISOString().slice(0, 10);
      to = new Date(to).toISOString().slice(0, 10);

      if (current_currency !== undefined && base_currency !== undefined) {
        // const user_id = await sessionUpdate(req, SessionModel);
        // if (user_id) {
          const collection_name = `${base_currency}_${current_currency}`;
          const PriceModel = mongoose.model(collection_name, priceSchema);

          let recent_data = await PriceModel.find({
            date: {
              $gte: moment.tz(new Date(from), "Etc/UTC").add("5", "hours"),
              $lte: moment.tz(new Date(to), "Etc/UTC").add("5", "hours"),
            },
          }); /*.select({ date: 1 }).exec();*/
          const DAY_TIME = 24 * 60 * 60 * 1000;

          let new_from = new Date(from);
          new_from.setDate(new_from.getDate() - 14);
          const new_from_str = new_from.toISOString().slice(0, 10);

          if (recent_data.length === 0) {
            if(current_currency === base_currency) {
              let cur;
              console.log('This is place')
              for(cur = new Date(from); cur.getTime() <= new Date(to).getTime(); cur.setDate(cur.getDate() + 1)) {
                const temp = {
                  date: cur,
                  open: 1,
                  high: 1,
                  low: 1,
                  close: 1,
                  adjusted_close: 1,
                  volume: 1
                }
                
                const result = await create(
                  { ...temp, date: cur },
                  PriceModel
                );
              }

              return PriceModel.find({
                date: {
                  $gte: moment.tz(new Date(from), "Etc/UTC").add("5", "hours"),
                  $lte: moment.tz(new Date(to), "Etc/UTC").add("5", "hours"),
                },
              })
                .sort({ date: 1 })
                .exec()
                .then((data) => {
                  return res.json({ status: 1, data: data });
                })
                .catch(console.log);
            }
            else {
                let api_result;
                try {
                  api_result = await axios.get(
                    `${config.eodhistorical_price_api}${base_currency}${current_currency}.FOREX?api_token=${config.eodhistorical_token}&order=d&fmt=json&from=${new_from_str}&to=${to}`,
                    {
                      "Content-type": "application/json",
                    }
                  );
                } catch (err) {
                  return res.json({ status: 0 });
                }

                console.log(api_result, "11111111111");

                const datum = api_result.data;
                let lst,
                  cur,
                  idx,
                  cnt,
                  from_date = new Date(from);

                for (
                  cur = new Date(to), idx = 0, cnt = 0;
                  cur.getTime() >= from_date.getTime();
                  cur.setDate(cur.getDate() - 1)
                ) {
                  if (idx >= datum.length) {
                    break;
                  } else {
                    const tmp_date = new Date(datum[idx].date);

                    if (tmp_date.getTime() / DAY_TIME == cur.getTime() / DAY_TIME) {
                      const result = await create(datum[idx], PriceModel);
                      idx++;
                    } else {
                      if (idx != 0) {
                        const result = await create(
                          { ...datum[idx], date: cur },
                          PriceModel
                        );
                      } else {
                        cnt++;
                      }
                    }
                  }
                }

                if (cnt > 0 && datum.length > 0) {
                  for (
                    lst = new Date(to);
                    cnt > 0;
                    lst.setDate(lst.getDate() - 1), cnt--
                  ) {
                    const result = await create(
                      { ...datum[0], date: lst },
                      PriceModel
                    );
                  }
                }

                if (idx == datum.length && cur.getTime() >= from_date.getTime()) {
                  let newer_from = new Date(from);
                  newer_from.setDate(newer_from.getDate() - 50);
                  const newer_from_str = newer_from.toISOString().slice(0, 10);

                  let new_api_result;
                  try {
                    new_api_result = await axios.get(
                      `${config.eodhistorical_price_api}${base_currency}${current_currency}.FOREX?api_token=${config.eodhistorical_token}&order=d&fmt=json&from=${newer_from_str}&to=${from}`,
                      {
                        "Content-type": "application/json",
                      }
                    );
                  } catch (err) {
                    return res.json({ status: 0 });
                  }

                  const new_datum = new_api_result.data;

                  if (new_datum.length == 0) {
                    for (
                      ;
                      cur.getTime() >= from_date.getTime();
                      cur.setDate(cur.getDate() - 1)
                    ) {
                      const result = await create(
                        { ...datum[length - 1], date: cur },
                        PriceModel
                      );
                }
              } else {
                for (
                  ;
                  cur.getTime() >= from_date.getTime() && cnt == 0;
                  cur.setDate(cur.getDate() - 1)
                ) {
                  const result = await create(
                    { ...new_datum[0], date: cur },
                    PriceModel
                  );
                }
                if (cnt > 0) {
                  for (
                    lst = new Date(to);
                    cnt > 0;
                    lst.setDate(lst.getDate() - 1), cnt--
                  ) {
                    const result = await create(
                      { ...new_datum[0], date: lst },
                      PriceModel
                    );
                  }
                }
              }
            }

            return PriceModel.find({
              date: {
                $gte: moment.tz(new Date(from), "Etc/UTC").add("5", "hours"),
                $lte: moment.tz(new Date(to), "Etc/UTC").add("5", "hours"),
              },
            })
              .sort({ date: 1 })
              .exec()
              .then((data) => {
                return res.json({ status: 1, data: data });
              })
              .catch(console.log);
            }
          } else {
            const from_d = new Date(from);
            const to_d = new Date(to);
            const days = (to_d.getTime() - from_d.getTime()) / DAY_TIME + 1;

            if (recent_data.length == days) {
              console.log("---------------------", 0);
              return res.json({ status: 1, data: recent_data });
            } else {
              if(current_currency === base_currency) {
                let cur;
                console.log('This is upsert place')
                for(cur = new Date(from); cur.getTime() <= new Date(to).getTime(); cur.setDate(cur.getDate() + 1)) {
                  const temp = {
                    date: cur,
                    open: 1,
                    high: 1,
                    low: 1,
                    close: 1,
                    adjusted_close: 1,
                    volume: 1
                  }
                  
                  const result = await create(
                    { ...temp, date: cur },
                    PriceModel
                  );
                }
  
                return PriceModel.find({
                  date: {
                    $gte: moment.tz(new Date(from), "Etc/UTC").add("5", "hours"),
                    $lte: moment.tz(new Date(to), "Etc/UTC").add("5", "hours"),
                  },
                })
                  .sort({ date: 1 })
                  .exec()
                  .then((data) => {
                    return res.json({ status: 1, data: data });
                  })
                  .catch(console.log);
              }
              else {
                let api_result;
              try {
                api_result = await axios.get(
                  `${config.eodhistorical_price_api}${base_currency}${current_currency}.FOREX?api_token=${config.eodhistorical_token}&order=d&fmt=json&from=${new_from_str}&to=${to}`,
                  {
                    "Content-type": "application/json",
                  }
                );
              } catch (err) {
                return res.json({ status: 0 });
              }
  
              console.log(api_result, "2222222222222222");
  
              const datum = api_result.data;
              let lst,
                cur,
                idx,
                cnt,
                from_date = new Date(from);
  
              for (
                cur = new Date(to), idx = 0, cnt = 0;
                cur.getTime() >= from_date.getTime();
                cur.setDate(cur.getDate() - 1)
              ) {
                if (idx >= datum.length) {
                  break;
                } else {
                  const tmp_date = new Date(datum[idx].date);
  
                  if (tmp_date.getTime() / DAY_TIME == cur.getTime() / DAY_TIME) {
                    const result = await updatePrice(datum[idx], PriceModel);
                    idx++;
                  } else {
                    if (idx != 0) {
                      const result = await updatePrice(
                        { ...datum[idx], date: cur },
                        PriceModel
                      );
                    } else {
                      cnt++;
                    }
                  }
                }
              }
  
              if (cnt > 0 && datum.length > 0) {
                for (
                  lst = new Date(to);
                  cnt > 0;
                  lst.setDate(lst.getDate() - 1), cnt--
                ) {
                  const result = await updatePrice(
                    { ...datum[0], date: lst },
                    PriceModel
                  );
                }
              }
  
              if (idx == datum.length && cur.getTime() >= from_date.getTime()) {
                let newer_from = new Date(from);
                newer_from.setDate(newer_from.getDate() - 50);
                const newer_from_str = newer_from.toISOString().slice(0, 10);
  
                let new_api_result;
                try {
                  new_api_result = await axios.get(
                    `${config.eodhistorical_price_api}${base_currency}${current_currency}.FOREX?api_token=${config.eodhistorical_token}&order=d&fmt=json&from=${newer_from_str}&to=${from}`,
                    {
                      "Content-type": "application/json",
                    }
                  );
                } catch (err) {
                  return res.json({ status: 0 });
                }
  
                const new_datum = new_api_result.data;
  
                if (new_datum.length == 0) {
                  for (
                    ;
                    cur.getTime() >= from_date.getTime();
                    cur.setDate(cur.getDate() - 1)
                  ) {
                    const result = await updatePrice(
                      { ...datum[length - 1], date: cur },
                      PriceModel
                    );
                  }
                } else {
                  for (
                    ;
                    cur.getTime() >= from_date.getTime() && cnt == 0;
                    cur.setDate(cur.getDate() - 1)
                  ) {
                    const result = await updatePrice(
                      { ...new_datum[0], date: cur },
                      PriceModel
                    );
                  }
                  if (cnt > 0) {
                    for (
                      lst = new Date(to);
                      cnt > 0;
                      lst.setDate(lst.getDate() - 1), cnt--
                    ) {
                      const result = await updatePrice(
                        { ...new_datum[0], date: lst },
                        PriceModel
                      );
                    }
                  }
                }
              }
  
              return PriceModel.find({
                date: {
                  $gte: moment.tz(new Date(from), "Etc/UTC").add("5", "hours"),
                  $lte: moment.tz(new Date(to), "Etc/UTC").add("5", "hours"),
                },
              })
                .sort({ date: 1 })
                .exec()
                .then((data) => {
                  return res.json({ status: 1, data: data });
                })
                .catch(console.log);
              }
            }
          }
        // } else {
        //   return res.json({ status: 0, flag: 1 });
        // }
      } else {
        return res.json({ status: 0, flag: 2 });
      }
    }
  }
}
