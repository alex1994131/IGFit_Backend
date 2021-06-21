const fetch = require("node-fetch");

const X_DEVELOPER_KEY = "X_KEY_HERE";

getTotal = async function () {
    var url = "https://api.pocketsmith.com/v2/users/USER_ID/transactions";
    var header = { headers: { "x-developer-key": X_DEVELOPER_KEY, "accept": "application/json" } };
    var response = await fetch(url, header);
    return parseInt(response.headers.get("total"));
}

getAllCategories = async function () {
    var url = "https://api.pocketsmith.com/v2/users/USER_ID/categories";
    var header = { headers: { "x-developer-key": X_DEVELOPER_KEY, "accept": "application/json" } };
    var response = await fetch(url, header);
    response = await response.json();

    let categories = [];

    for(let category of response) {
        addCategory(category,categories);
    }

    return categories;

    function addCategory(category,categories) {
        categories.push(category);
        if(category.children && category.children.length) {
            for(let i of category.children) {
                addCategory(i,categories);
            }
        }
    }
}

updatePocketsmithCategory = async function (id,category_name) {
    let categories=await getAllCategories();
    //console.log(categories);
    let category = categories.find(e=>e.title==category_name);
    if(category) {
        return await updateTx(id,"category_id",category.id);
    }
    return null;
}

updatePocketsmithTransfer = async function (id,is_transfer) {
    // let categories=await getAllCategories();
    // //console.log(categories);
    // let category = categories.find(e=>e.title==category_name);
    // if(category) {
    return await updateTx(id,"is_transfer",is_transfer);
    // }
    return null;
}

updateTx = async function (id,param,value) {
    const options = {
        method: 'PUT',
        headers: { "x-developer-key": X_DEVELOPER_KEY, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            [param]: value
        })
    };

    try {
        let resp = await fetch('https://api.pocketsmith.com/v2/transactions/' + id, options);
        console.log(resp.status);
        if (resp.status == 200) {
            return await resp.json();
        } else {
            return null;
        }
    } catch (err) {
        console.log(err);
    }
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
exports.updatePocketsmithCategory = updatePocketsmithCategory;
exports.updatePocketsmithTransfer = updatePocketsmithTransfer;
