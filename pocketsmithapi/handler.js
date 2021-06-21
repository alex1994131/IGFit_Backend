'use strict'

//const express = require('express');
//const puppeteer = require('puppeteer');
const MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
const Pocketsmith = require('./Pocketsmith.js');
const fetch = require("node-fetch");

var clientsDB;  // Cached connection-pool for further requests.

module.exports = async (event, context) => {
  let result = "begin";

  let now = Date.now();

  try {
    let users = await prepareDB();

    let count = await users.collection("last").countDocuments();

    if(!Object.keys(event.query).length) {
      if (count > 0) {
        const inserted_record = await users.collection("last").updateOne({}, { $set: { date: now, loading: true } });
      } else {
        const inserted_record = await users.collection("last").insertOne({ date: now });
      }

      const total = await Pocketsmith.fetchAllTransactions();
      //const inserted_record = await users.collection("tx").insertOne(total);
      //users.collection("tx").drop();
      total.forEach(async (tx) => {
        await users.collection(now.toString()).insertOne(tx);
      });

      const inserted_record = await users.collection("last").updateOne({}, { $set: { date: now, loading: false } });
    } else if("lastupdate" in event.query) {
      const last = await users.collection("last").findOne({});
      result = JSON.stringify(last);
    } else if("updatetransactions" in event.query) {
      result = await fetchapi();
    }

    context
      .status(200)
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

async function fetchapi(query) {
  var header = { method: "POST", headers: { "accept": "application/json", 'Authorization': 'Basic ' + Buffer.from('admin:secure_password').toString("base64"), } };
  let url = "https://faasd.tyap.cloud/async-function/pocketsmithtx";
  let result = await fetch(url+query, header);
  return result;
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

