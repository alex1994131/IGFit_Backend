'use strict'

const fetch = require('node-fetch');
const MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

const logmsg = require('./logmsg');

var clientsDB;  // Cached connection-pool for further requests.

module.exports = async (event, context) => {

  if (event.method != "GET")
    return context.status(200).succeed();

  try {
    const name = event.query.name;
    const fx = event.query.fx;
    const epic = event.query.epic;

    let users = await prepareDB();

    const document = await users.collection("tickers").findOne({ name: name });

    var resp;
    if(document) {
      resp = document.epic? document.epic : document.ticker;
      console.log("from db");
      // logmsg(resp);
      // logmsg({api: "chat.postMessage", json:{text:"hi"+resp, channel:"general"}});
    } else {
      console.log("adding "+name+" to db");
      resp = await findticker(name, fx);
      console.log("adding "+name+" to db: "+resp);
      const inserted_record = await users.collection("tickers").insertOne({name:name, ticker:resp, epic:epic});
      resp = epic ? epic : resp;
    }

    context.status(200)
      .succeed(resp);
  } catch (err) {
    context.fail(err.toString());
  }

}

async function findticker(name, fx) {
  //name = "The Simply Good Foods Company";
  var regexp = /\s(ltd|limited|inc|b\.v\.|NV.*|plc|AG.*|SE)/i;
  name = name.replace(regexp, "");
  name = name.replace(/\-|\/.*/g, "");
  var response;
  var url = "https://query1.finance.yahoo.com/v1/finance/search?q=" + encodeURIComponent(name) + "&quotesCount=6&newsCount=0&enableFuzzyQuery=false&enableNavLinks=false&enableLists=false";
  try {
  response = await fetch(url);
  }
  catch(e) {
    return "[TICKER]";
  }
  const resp = await response.text();
  console.log(resp);
  var responsetext = JSON.parse(resp);

  console.log(responsetext);

  var length = responsetext["quotes"].length;
  if (length > 0) {
    for (var i = 0; i < length; i++) {
      var data = responsetext["quotes"][i].symbol;
      url = "https://query1.finance.yahoo.com/v7/finance/spark?symbols=" + data;
      response = await fetch(url);
      var newresponse = JSON.parse(await response.text());
      try {
        var result = newresponse["spark"]["result"][0]["response"][0]["meta"]["currency"];
        if (newresponse["spark"]["result"][0]["response"][0]["meta"]["currency"].toUpperCase() == fx.substring(0, 3).toUpperCase())
          return data.replace(/\..*/, "");
      }
      catch (e) { }
    }
  }

  return "[TICKER]";
}

function prepareDB() {
  const url = "mongodb://" + process.env.mongo + ":27017/stocks"

  return new Promise((resolve, reject) => {
    if (clientsDB) {
      console.error("DB already connected.");
      return resolve(clientsDB);
    }

    console.error("DB connecting");

    MongoClient.connect(url, { authSource: "admin", auth: { user: "root", password: "example" } }, (err, database) => {
      if (err) {
        return reject(err)
      }

      clientsDB = database.db("stocks");
      return resolve(clientsDB)
    });
  });
}

