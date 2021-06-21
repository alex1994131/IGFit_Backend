'use strict'

const fetch = require('node-fetch');
const MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

const yahooFinance = require('yahoo-finance');
const util = require('util');
//import {APIClient, Resolution} from 'ig-trading-api';
const IG_API = require('ig-trading-api');

var clientsDB;  // Cached connection-pool for further requests.
var client = new IG_API.APIClient(IG_API.APIClient.URL_DEMO, 'a46c686521bd1fca3aed811f3e3006f5c4d3c1a0');
var lastsession;

module.exports = async (event, context) => {

  if (event.method != "GET")
    return context.status(200).succeed();

  try {
    const ticker = event.query.ticker;
    const from = event.query.from;
    const to = event.query.to;

    let users = await prepareDB();

    var from_date = new Date(from);
    from_date.setUTCHours(5);
    var to_date = new Date(to);
    to_date.setUTCHours(5);

    var i = new Date(from_date);

    var res = [];
    var new_from;

    console.log(ticker+" "+from+" "+to);

    // var collections = await users.listCollections({},{nameOnly:true}).toArray();
    // for(var collection of collections) {
    //   console.log(collection.name);
    //   i = new Date();
    //   i.setUTCHours(5,0,0,0);
    //   i.setDate(i.getDate()-1);
    //   var document = await users.collection(collection.name).findOne({ date: i });
    //   if(document){
    //     console.log("found");
    //     await users.collection(collection.name).remove({date:i});
    //   }
    // }

    // return;

    const ig = await users.collection("tickers").findOne({ epic: ticker });


    while (i <= to_date) {
        var document = await users.collection(ticker).findOne({ date: i });
      if (document) {
        res.push(document);
        // console.log("old data "+document.date.toLocaleDateString("en-CA"));
      } else {
        console.log("trying to get "+i.toLocaleDateString("en-CA")+"to "+to);
        new_from = new Date(i);
        var new_from_14_before = new Date(i);
        new_from_14_before.setDate(new_from_14_before.getDate()-14);
        var new_to = new Date(to_date);
        new_to.setDate(new_to.getDate()+1);
        var resp;
        if (!ig) {
          resp = await yahooFinance.historical({
            symbol: ticker,
            from: new_from_14_before.toLocaleDateString("en-CA"),
            to: new_to.toLocaleDateString("en-CA"),
            // period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
          });
        } else {
          var session;
          if(lastsession) {
            console.log("using last login")
            if(Date.now()-lastsession.lastlogin < 60*60*1000) {
              console.log("using last login 2")
              if(lastsession.ready==0) {
                session = await lastsession.session;
                console.log('waited');
                console.log(lastsession);
              } else {
                session = lastsession.session;
              }
            } else {
              console.log("using last login expired")
              lastsession={session:client.rest.login.createSession('MYWEBAPIACC', 'mywebApi107'),lastlogin:Date.now(),ready:0};
              await lastsession.session;
              lastsession.ready=1;
              // lastsession.session=session;
              // lastsession.lastlogin=Date.now();
            }
          } else {
            lastsession={session:client.rest.login.createSession('MYWEBAPIACC', 'mywebApi107'),lastlogin:Date.now(),ready:0};
            await lastsession.session;
            lastsession.ready=1;
            session = lastsession.session;
              // lastsession.session=session;
              // lastsession.lastlogin=Date.now();
          }
          console.log(session);
          // const resource = IG_API.LoginAPI.URL.SESSION;
          // const response = await client.rest.httpClient.put(
          //   resource,
          //   {
          //     accountId: "Z3JNX7",
          //     defaultAccount: null
          //   }
          // );
          // //console.info(`Your client ID is "${session.clientId}".`);
          // console.log(session);
          // console.log(response.data);
          var getPricesBetweenDates;
          try {
            var type = await client.rest.market.getMarketDetails(ticker);
            getPricesBetweenDates = await client.rest.market.price.getPricesBetweenDates(
              ticker,
              IG_API.Resolution.DAY,
              new_from_14_before.toISOString(),
              new_to.toISOString()
            );

            //console.log(getPricesBetweenDates);
            if (getPricesBetweenDates.prices) {
              resp = [];
              for (var price of getPricesBetweenDates.prices) {
                var divide;
                if(type && type.instrument) {
                  divide = type.instrument.type == "SHARES" ? 100:1;
                }
                var data = {
                  date: new Date(price.snapshotTimeUTC),
                  open: (price.openPrice.bid + price.openPrice.ask)/2 / divide,
                  high: (price.highPrice.bid + price.highPrice.ask)/2 / divide,
                  low: (price.lowPrice.bid + price.lowPrice.ask)/2 / divide,
                  close: (price.closePrice.bid + price.closePrice.ask)/2 / divide,
                  adjClose: (price.closePrice.bid + price.closePrice.ask)/2 / divide,
                  volume: price.lastTradedVolume,
                  symbol: ticker,
                  // type: (type && type.instrument) ? type.instrument.type : undefined
                }
                resp.push(data);
              }
              resp.sort((a,b)=>b.date.getTime() - a.date.getTime());
            }
          } catch (err) {
            console.log("error 2 ");
            console.log(err);
          }
        }
        console.log(JSON.stringify(resp));
        var j = new Date(new_from);
        var document_to_add = [];

        while (j <= to_date) {
          var found = false;
          for (var k = resp.length - 1; k >= 0; k--) {
            //console.log("comparing "+resp[k].date.getTime()+" and"+j.getTime()+" compare "+JSON.stringify(resp[k].date)+" "+JSON.stringify(j));
            if (resp[k].date.getTime() == j.getTime()) {
              console.log("in here");
              found = true;
              document_to_add.push(resp[k]);
              console.log("found in array "+j.toLocaleDateString("en-CA"));
              break;
            }
            if (resp[k].date.getTime() > j.getTime() || (j.getTime() == to_date.getTime() && k==0) || (resp[k].date.getTime() < j.getTime() && k==0)) {
              console.log("not found in array "+j.toLocaleDateString("en-CA"));
              var add2;
              if((j.getTime() == to_date.getTime() && k==0)) {
                add2 = JSON.parse(JSON.stringify(resp[k]));
              } else {
                add2 = JSON.parse(JSON.stringify(k < (resp.length - 1) ? resp[k + 1] : resp[k]));
              }
              add2.date = new Date(j);
              document_to_add.push(add2);
              console.log("adding "+JSON.stringify(add2));
              break;
            }
          }
          j.setDate(j.getDate() + 1);
        }
        for(let index = 0; index<document_to_add.length;index++) {
          
          await users.collection(ticker).insertOne(document_to_add[index]);
        }
        res = res.concat(document_to_add);
        console.log(JSON.stringify(document_to_add));
        console.log("getting new data")
        break;
      }
      i.setDate(i.getDate() + 1);
    }

    context.status(200)
      .succeed(JSON.stringify(res));
  } catch (err) {
    context.fail(err.toString());
  }

}

function  prepareDB() {
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

