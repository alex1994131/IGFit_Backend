'use strict'

//const express = require('express');
//const puppeteer = require('puppeteer');
const MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

var clientsDB;  // Cached connection-pool for further requests.

module.exports = async (event, context) => {
  let result = "begin";

  let now = Date.now();

  if(event.method!="GET")
    return context.status(200).succeed();

  try {
    let users = await prepareDB();


    // const total = await Pocketsmith.fetchAllTransactions();
    // //const inserted_record = await users.collection("tx").insertOne(total);
    // users.collection("tx").drop();
    // total.forEach(async (tx) => {
    //   await users.collection("tx").insertOne(tx);
    // });

    const page = parseInt(event.query.page);
    const per_page = parseInt(event.query.per_page);
    const records_to_skip = (page-1)*per_page;

    const last = await users.collection("last").findOne({});
console.log(event.referer);
    result = await users.collection(last.date.toString()).find().skip(records_to_skip).project({_id:0}).limit(per_page).toArray();

    context//.headers({"Access-Control-Allow-Origin":"http://localhost:3000","access-control-allow-methods": "HEAD, GET, PUT, POST, DELETE, OPTIONS", "Vary":"Origin", "Access-Control-Max-Age": 86400})
      .status(200)
      .succeed(JSON.stringify(result));
  } catch (err) {
    context.fail(err.toString());
  }


  /* try {
    let users = await prepareDB();
    
    await users.collection("function").insertOne(record, (insertErr) => {
      if (insertErr) {
        return context.fail(insertErr.toString());
      }
      result = {
        status: "Insert done of: " + JSON.stringify(event.body)
      };

      return context.status(200).succeed(result);
    });
  } catch (err) {
    return context.status(200).succeed(err.toString());
  } 

  return context
    .status(200)
    .succeed(result)*/
}

/* async function prepareDB() {
  const url = "mongodb://" + process.env.mongo + ":27017/client2"

  if (clientsDB) {
    console.error("DB already connected.");
    return clientsDB;
  }

  console.error("DB connecting");

  MongoClient.connect(url, { authSource: "admin", auth: { user: "root", password: "example" } }, (err, database) => {
    if (err) {
      return reject(err)
    }

    clientsDB = database.db("client2");
    return clientsDB;
    //clientsDB.createCollection("function");
    
  });
}
 */
/* const prepareDB = () => {
  const url = "mongodb://" + process.env.mongo + ":27017/client2"

  return new Promise((resolve, reject) => {
      if(clientsDB) {
          console.error("DB already connected.");
          return resolve(clientsDB);
      }

      console.error("DB connecting");

      MongoClient.connect(url, {authSource: "admin", auth:{user:"root",password:"example"}},(err, database) => {
          if(err) {
              return reject(err)
          }
  
          clientsDB = database.db("client2");
          return resolve(clientsDB)
      });
  });
} */

function prepareDB() {
  const url = "mongodb://" + process.env.mongo + ":27017/pocketsmith"

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

      clientsDB = database.db("pocketsmith");
      return resolve(clientsDB)
    });
  });
}

