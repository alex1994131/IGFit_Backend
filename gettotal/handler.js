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
    result = await Pocketsmith.getTotal();
    context
      .status(200)
      .succeed(JSON.stringify(result));
  } catch (err) {
    context.fail(err.toString());
  }
}

