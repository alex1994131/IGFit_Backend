'use strict';
const fetch = require('node-fetch');

async function logmsg(param) {
  let msg, channel, json, api;
  if (typeof param == 'object') {
    ({ msg, channel, json, api } = param);
  } else {
    msg = param;
  }

  var header = { headers: { "accept": "application/json", 'Authorization': 'Basic ' + Buffer.from('admin:secure_password').toString("base64"), } };
  let url = "https://faasd.tyap.cloud/function/slack2";
  let query;

  if (!json) {
    query = "?msg=" + encodeURIComponent(msg) + (channel ? "&channel=" + encodeURIComponent(channel) : "");
  }
  else {
    query = "?api=" + api;
    header = { headers: { ...header.headers, "Content-Type": "application/json" }, method: "POST", body: JSON.stringify(json) };
  }

  //console.log(url+query+JSON.stringify(header));
  var result = await fetch(url + query, header);
  return result;
}

module.exports = logmsg;