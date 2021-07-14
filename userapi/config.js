const mongoose = require("mongoose");

const dbconf = "mongodb://root:example_db_mongo@tim.immo:3333/igfit?authSource=admin&readPreference=primary&appname=MongoDB%20Compass";
// const dbconf = "mongodb://localhost:3333/igfit?readPreference=primary&appname=MongoDB%20Compass&ssl=false"
module.exports = {
  USER_SESSION_TIME: 900,
  eodhistorical_ticker_api: "https://eodhistoricaldata.com/api/search/",
  eodhistorical_price_api: "https://eodhistoricaldata.com/api/eod/",
  eodhistorical_token: "60db83f2b0ab55.00463877",
  connection: mongoose
    .connect(dbconf, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })
    .then(() => {
      console.log("Database are connected");
    }),
};
