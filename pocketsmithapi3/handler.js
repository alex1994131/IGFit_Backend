'use strict'

//const express = require('express');
//const puppeteer = require('puppeteer');
const MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
const Pocketsmith = require('./Pocketsmith.js');

var clientsDB;  // Cached connection-pool for further requests.

module.exports = async (event, context) => {
  let result = "begin";
  let code = 200;

  let now = Date.now();

  try {
    let users = await prepareDB();

    // let count = await users.collection("last").countDocuments();
    // if(count>0) {
    //   const inserted_record = await users.collection("last").updateOne({},{$set:{date:now}});
    // } else {
    //   const inserted_record = await users.collection("last").insertOne({date:now});
    // }

    const last = await users.collection("last").findOne({});

    if (event.query.id && event.query.column && "value" in event.query) {
      let tx;
      if (event.query.column == "category.title") {
        tx = await Pocketsmith.updatePocketsmithCategory(event.query.id, event.query.value);
      }
      if (event.query.column == "is_transfer") {
        tx = await Pocketsmith.updatePocketsmithTransfer(event.query.id, event.query.value);
      }

      if (tx) {
        result = "Updated pocketsmith api"
        console.log(result);
        let update = await users.collection(last.date.toString()).findOneAndReplace({ id: tx.id }, tx);
        if (update.lastErrorObject.n) {
          result = update;
        } else {
          code = 404;
        }
      } else {
        result = "Didn't update";
        code = 404;
      }
      console.log(result);

      //result = await users.collection(last.date.toString()).findOneAndUpdate({id:event.query.id},{$set:{[event.query.column]:event.query.value}});
    }
    
    //const total = await Pocketsmith.fetchAllTransactions();
    //const inserted_record = await users.collection("tx").insertOne(total);
    //users.collection("tx").drop();
    // total.forEach(async (tx) => {
    //   await users.collection(now.toString()).insertOne(tx);
    // });

    context
      .status(code)
      .succeed(result);
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

