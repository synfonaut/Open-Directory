const isNode = (typeof window == "undefined");
const isBrowser = (typeof window == "object");

var axios;
if (isNode) {
    axios = require("axios");
}

const OPENDIR_PROTOCOL = "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi";
const OPENDIR_ACTIONS = [
    "category.create",
    "category.update",
    "category.delete",
    "entry.create",
    "entry.update",
    "entry.delete",
    "vote",
];

const MAP_PROTOCOL = "1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5";
const MAP_ACTIONS = [
    "SET",
    "DELETE",
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

    if (item_action == "delete") {
        obj.action_id = args.shift();
    } else if (item_action == "create" || item_action == "update") {
        if (item_action == "update") {
            obj.action_id = args.shift();
        }

        const data = convertMAPOPReturnToKeyValues(args);
        if (data) {
            obj.change = data;
        }
    } else if (item_action == "vote") {
        obj.action_id = args.shift();
    }

    return obj;
}

function convertMAPOPReturnToKeyValues(orig_args) {
    var args = JSON.parse(JSON.stringify(orig_args)); // copy

    const protocol_id = args.shift();
    const map_action = args.shift();

    if (protocol_id != MAP_PROTOCOL) { return null; }
    if (MAP_ACTIONS.indexOf(map_action) == -1) { return null; }
    var obj = {action: map_action};

    if (map_action == "SET") {
        obj.value = {};

        // process s* key/value pairs
        var key = null, value = null, tmp = null;

        while (tmp = args.shift()) {
            if (key) {
                value = tmp;
            } else {
                key = tmp;
            }

            if (key && value) {
                obj.value[key] = value;
                key = null;
                value = null;
            }
        }

        return obj;
    } else if (map_action == "DELETE") { // todo
        obj.value = args;
        return obj;
    } else {
        return null;
    }
}

function processOpenDirectoryTransactions(results) {
    return results.map(processOpenDirectoryTransaction).filter(r => { return r });
}


function fetch_from_network(category_id=null, cursor=0, limit=200, results=[]) {
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
                { "$graphLookup": { "from": "c", "startWith": "$out.s6", "connectFromField": "out.s6", "connectToField": "tx.h", "as": "confirmed_category" } },

                { "$graphLookup": { "from": "u", "startWith": "$out.s6", "connectFromField": "out.s6", "connectToField": "tx.h", "as": "unconfirmed_category" } },
                // find votes
                { "$lookup": { "from": "c", "localField": "tx.h", "foreignField": "out.s3", "as": "confirmed_votes" } },
                { "$lookup": { "from": "u", "localField": "tx.h", "foreignField": "out.s3", "as": "unconfirmed_votes" } },

                // climb children
                { "$lookup": { "from": "c", "localField": "tx.h", "foreignField": "out.s6", "as": "confirmed_entries" } },
                { "$lookup": { "from": "u", "localField": "tx.h", "foreignField": "out.s6", "as": "unconfirmed_entries" } },

                {
                    "$project": {
                        "confirmed_category": "$confirmed_category",
                        "confirmed_votes": "$confirmed_votes",
                        "confirmed_entries": "$confirmed_entries",
                        "unconfirmed_entries": "$unconfirmed_entries",
                        "unconfirmed_category": "$unconfirmed_category",
                        "unconfirmed_votes": "$unconfirmed_votes",
                        "object": ["$$ROOT"],
                    }
                },
                {
                    "$project": {
                        "object.confirmed_category": 0,
                        "object.confirmed_votes": 0,
                        "object.confirmed_entries": 0,
                        "object.unconfirmed_entries": 0,
                        "object.unconfirmed_category": 0,
                        "object.unconfirmed_votes": 0,
                    }
                },
                {
                    "$project": {
                        "items": {
                            "$concatArrays": [
                                "$object",
                                "$confirmed_category",
                                "$confirmed_votes",
                                "$confirmed_entries",
                                "$unconfirmed_entries",
                                "$unconfirmed_category",
                                "$unconfirmed_votes"
                            ]
                        }
                    }
                },
                { "$unwind": "$items" },
                { "$replaceRoot": { newRoot: "$items" } },
                { "$project": { "_id": 0, } },
                { "$addFields": { "_id": "$tx.h", } },
                { "$group": { "_id": null, "items": { $addToSet: "$$ROOT" } } },
                { "$unwind": "$items" },
                { "$replaceRoot": { newRoot: "$items" } },
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
                {"out.s5": {"$ne": "category"}}, // TODO: need protocol change because votes aren't filtering and s5 isn't stable
            ]
        });
    }

    // TODO: Split out API key
    var url = "https://bitomation.com/q/1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z/" + toBase64(JSON.stringify(query));
    var header = { headers: { key: "1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z" } };

    function handleResponse(resolve, reject, r) {


        var items = {};
        const rows = r.c.concat(r.u).reverse();

        results = results.concat(rows);
        cursor += rows.length;

        if (rows.length >= limit) {
            console.log("Seems like there's still more... polling for more");
            fetch_from_network(category_id, cursor, limit, results).then(resolve).catch(reject);
        } else {

            const sorted = results.sort(function(a, b) {
                if (!a.height) { return -1; }
                if (a.height < b.height) { return 1; }
                if (a.height > b.height) { return -1; }
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
            }).then(r => { handleResponse(resolve, reject, r) });
        }

    });
}


if (typeof window == "undefined") {
    module.exports = {
        fetch_from_network: fetch_from_network
    };
}
