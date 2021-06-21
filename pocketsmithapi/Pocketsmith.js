const fetch = require("node-fetch");

const X_DEVELOPER_KEY = "X_KEY_HERE";

getTotal = async function () {
    var url = "https://api.pocketsmith.com/v2/users/USER_ID/transactions";
    var header = { headers: { "x-developer-key": X_DEVELOPER_KEY, "accept": "application/json" } };
    var response = await fetch(url, header);
    return parseInt(response.headers.get("total"));
}

fetchAllTransactions = async function () {
    var jsondata = new Array();

    var pages = Math.ceil(await getTotal() / 100);
    //pages = 5;

    var header = { headers: { "x-developer-key": X_DEVELOPER_KEY, "accept": "application/json" } };

    for (var i = 0; i < pages; i++) {
        var url = "https://api.pocketsmith.com/v2/users/USER_ID/transactions?per_page=100&page=" + (i + 1);
        var response = await fetch(url, header);
        var tx = await response.json();
        jsondata = jsondata.concat(...tx);
    }

    return jsondata;
}

exports.getTotal = getTotal;
exports.fetchAllTransactions = fetchAllTransactions;
