const isNode = (typeof window == "undefined");
const isBrowser = (typeof window == "object");

var axios;
if (isNode) {
    axios = require("axios");
}

const OPENDIR_PROTOCOL = "1dirxA5oET8EmcdW4saKXzPqejmMXQwg2";
const OPENDIR_ACTIONS = [
    "category.create",
    "category.update",
    "category.delete",
    "entry.create",
    "entry.update",
    "entry.delete",
    "vote",
];

function toBase64(str) {
    if (isNode) {
        return Buffer.from(str).toString('base64');
    }

    return btoa(str);

}

function processOpenDirectoryTransaction(result) {

    if (!result.txid || !result.data || !result.address) {
        return null;
    }

    const txid = result.txid;
    const address = result.address;
    const height = (result.height ? result.height : Math.Infinity);
    var args = Object.values(result.data);
    const protocol_id = args.shift();
    const opendir_action = args.shift();

    if (!txid) { return null; }
    if (protocol_id !== OPENDIR_PROTOCOL) { return null; }
    if (OPENDIR_ACTIONS.indexOf(opendir_action) == -1) { return null; }

    if (opendir_action == "vote") {
        item_type = item_action = "vote";
    } else {
        [item_type, item_action] = opendir_action.split(".");
    }

    var obj = {
        type: item_type,
        action: item_action,
        txid: txid,
        address: address,
        height: height
    };

    if (item_type == "category") {
        if (item_action == "create") {
            // if odd parameters, that means we've added a category
            // this will be unstable long-term, best to check if keys are in schema
            if ((args.length % 2) == 1) {
                obj.action_id = args.shift();
            }

            obj.change = convertKeyValues(args);
        } else if (item_action == "update") {
            obj.action_id = args.shift();
            obj.change = convertKeyValues(args);
        } else if (item_action == "delete") {
            obj.action_id = args.shift();
        } else {
            console.log("unknown category action", result);
        }
    } else if (item_type == "entry") {
        if (item_action == "create") {
            obj.action_id = args.shift();
            obj.change = convertKeyValues(args);
        } else if (item_action == "update") {
            obj.action_id = args.shift();
            obj.change = convertKeyValues(args);
        } else if (item_action == "delete") {
            obj.action_id = args.shift();
        } else {
            console.log("unknown entry action", result);
        }
    } else if (item_type == "vote") {
        obj.action_id = args.shift();
    } else {
        console.log("unknown item type", result);
    }


    return obj;
}

function convertKeyValues(orig_args) {
    var args = JSON.parse(JSON.stringify(orig_args)); // copy

    var keyvalues = {};

    // process key/value pairs
    var key = null, value = null, tmp = null;

    while (tmp = args.shift()) {
        if (key) {
            value = tmp;
        } else {
            key = tmp;
        }

        if (key && value) {
            keyvalues[key] = value;
            key = null;
            value = null;
        }
    }

    return keyvalues;
}

function processOpenDirectoryTransactions(results) {
    return results.map(processOpenDirectoryTransaction).filter(r => { return r });
}

function get_bitdb_query(category_id=null, cursor=0, limit=200) {
    const query = {
        "v": 3,
        "q": {
            "db": ["u", "c"],
            "aggregate": [
                {
                    "$match": {
                        "$and": [
                            {"out.s1": OPENDIR_PROTOCOL},
                        ]
                    }
                },
                // climb parent recursively
                { "$graphLookup": { "from": "c", "startWith": "$out.s3", "connectFromField": "out.s6", "connectToField": "tx.h", "as": "confirmed_category" } },
                { "$graphLookup": { "from": "u", "startWith": "$out.s3", "connectFromField": "out.s6", "connectToField": "tx.h", "as": "unconfirmed_category" } },

                // find votes

                // climb children
                { "$lookup": { "from": "c", "localField": "tx.h", "foreignField": "out.s3", "as": "confirmed_entries" } },
                { "$lookup": { "from": "u", "localField": "tx.h", "foreignField": "out.s3", "as": "unconfirmed_entries" } },

                {
                    "$project": {
                        "confirmed_category": "$confirmed_category",
                        "confirmed_entries": "$confirmed_entries",
                        "unconfirmed_entries": "$unconfirmed_entries",
                        "unconfirmed_category": "$unconfirmed_category",
                        "object": ["$$ROOT"],
                    }
                },
                {
                    "$project": {
                        "object.confirmed_category": 0,
                        "object.confirmed_entries": 0,
                        "object.unconfirmed_entries": 0,
                        "object.unconfirmed_category": 0,
                    }
                },
                {
                    "$project": {
                        "items": {
                            "$concatArrays": [
                                "$object",
                                "$confirmed_category",
                                "$confirmed_entries",
                                "$unconfirmed_entries",
                                "$unconfirmed_category",
                            ]
                        }
                    }
                },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },
                { "$project": { "_id": 0, } },
                { "$addFields": { "_id": "$tx.h", } },
                { "$group": { "_id": null, "items": { "$addToSet": "$$ROOT" } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },

                { "$lookup": { "from": "c", "localField": "tx.h", "foreignField": "out.s3", "as": "confirmed_votes" } },
                { "$lookup": { "from": "u", "localField": "tx.h", "foreignField": "out.s3", "as": "unconfirmed_votes" } },
                {
                    "$project": {
                        "confirmed_votes": "$confirmed_votes",
                        "unconfirmed_votes": "$unconfirmed_votes",
                        "object": ["$$ROOT"],
                    }
                },
                {
                    "$project": {
                        "object.confirmed_votes": 0,
                        "object.unconfirmed_votes": 0,
                    }
                },
                {
                    "$project": {
                        "items": {
                            "$concatArrays": [
                                "$object",
                                "$confirmed_votes",
                                "$unconfirmed_votes"
                            ]
                        }
                    }
                },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },
                { "$project": { "_id": 0, } },
                { "$addFields": { "_id": "$tx.h", } },
                { "$group": { "_id": null, "items": { "$addToSet": "$$ROOT" } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },

                
                { "$skip": cursor },
                { "$limit": limit },
            ]
        },
        "r": {
            "f": "[.[] | {\"height\": .blk.i, \"address\": .in[0].e.a, \"txid\": .tx.h, \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}]"
        },
    };

    if (category_id) {
        query["q"]["aggregate"][0]["$match"]["$and"].push({
            "$or": [
                {"tx.h": category_id},
                {"out.s6": category_id},
            ]
        });
    } else {
        query["q"]["aggregate"][0]["$match"]["$and"].push({
            "$or": [
                {"tx.h": category_id},
                {"out.s5": {"$ne": "category"}}, // TODO: verify s5 is right output
            ]
        });
    }

    return query;
}

function fetch_from_network(category_id=null, cursor=0, limit=200, results=[]) {

    const query = get_bitdb_query(category_id, cursor, limit);
    
    // TODO: Split out API key
    // TODO: Use localstorage to set alternative
    var url = "https://bitomation.com/q/1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z/" + toBase64(JSON.stringify(query));
    var header = { headers: { key: "1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z" } };

    function handleResponse(resolve, reject, r) {

        if (r.errors) {
            reject("error during query " + r.errors);
        }

        var items = {};
        const rows = r.c.concat(r.u).reverse();

        results = results.concat(rows);
        cursor += rows.length;

        if (rows.length >= limit) {
            console.log("Seems like there's still more... polling for more");
            fetch_from_network(category_id, cursor, limit, results).then(resolve).catch(reject);
        } else {

            const sorted = results.sort(function(a, b) {
                if (!a.height || !b.height) { return -1; }
                if (a.height < b.height) { return -1; }
                if (a.height > b.height) { return 1; }
                return 0;
            });

            var items = new Map();
            for (const item of sorted) {
                const matched_item = items[item.txid];
                if (!matched_item || (matched_item && !matched_item.height)) {
                    items.set(item.txid, item)
                }
            }

            const values = Array.from(items.values());
            resolve(values);
        }
    }

    return new Promise((resolve, reject) => {

        console.log("Making HTTP request to server " + cursor + "," + limit);
        if (isNode) {
            axios = require("axios");
            axios(url, header).then(r => {
                if (r.status !== 200) {
                    reject("Error while retrieving response from server " + r.status);
                }

                handleResponse(resolve, reject, r.data)
            }).catch(reject);
        } else {
            fetch(url, header).then(function(r) {
                if (r.status !== 200) {
                    reject("Error while retrieving response from server " + r.status);
                }
                return r.json();
            }).then(r => { handleResponse(resolve, reject, r) }).catch(reject);
        }

    });
}


if (typeof window == "undefined") {
    module.exports = {
        fetch_from_network: fetch_from_network
    };
}
