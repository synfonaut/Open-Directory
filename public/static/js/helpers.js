const isNode = (typeof window == "undefined");
const isBrowser = (typeof window == "object");

var axios;
if (isNode) {
    axios = require("axios");
    markdownit = require("markdown-it");
}

const OPENDIR_TIP_ADDRESS = "1LPe8CGxypahVkoBbYyoHMUAHuPb4S2JKL";
const OPENDIR_PROTOCOL = "1dirxA5oET8EmcdW4saKXzPqejmMXQwg2";
const OPENDIR_ACTIONS = [
    "category.create",
    "category.update",
    "category.delete",
    "entry.create",
    "entry.update",
    "entry.delete",
    "vote",
    "undo",
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

    if (!txid) {
        console.log("Error while processing open directory transaction: no txid", result);
        return null;
    }
    if (protocol_id !== OPENDIR_PROTOCOL) {
        console.log("Error while processing open directory transaction: invalid protocol", result);
        return null;
    }
    if (OPENDIR_ACTIONS.indexOf(opendir_action) == -1) {
        console.log("Error while processing open directory transaction: invalid action", result);
        return null;
    }

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
    } else if (item_type == "undo") {
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
            "limit": limit,
            "aggregate": [
                {
                    "$match": {
                        "$and": [
                            {"out.s1": OPENDIR_PROTOCOL},
                            // other clause gets dynamically inserted below
                        ]
                    }
                },


                { "$graphLookup": { "from": "u", "startWith": "$tx.h", "connectFromField": "tx.h", "connectToField": "out.s3", "as": "unconfirmed_children", "maxDepth": 3 } },
                { "$project": { "unconfirmed_children": "$unconfirmed_children", "object": ["$$ROOT"], } },
                { "$project": { "object.unconfirmed_children": 0, } },
                { "$project": { "items": { "$concatArrays": [ "$object", "$unconfirmed_children", ] } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },
                { "$project": { "_id": 0, } },
                { "$addFields": { "_id": "$tx.h", } },
                { "$group": { "_id": null, "items": { "$addToSet": "$$ROOT" } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },

                { "$graphLookup": { "from": "c", "startWith": "$tx.h", "connectFromField": "tx.h", "connectToField": "out.s3", "as": "confirmed_children", "maxDepth": 3 } },
                { "$project": { "confirmed_children": "$confirmed_children", "object": ["$$ROOT"], } },
                { "$project": { "object.confirmed_children": 0, } },
                { "$project": { "items": { "$concatArrays": [ "$object", "$confirmed_children", ] } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },
                { "$project": { "_id": 0, } },
                { "$addFields": { "_id": "$tx.h", } },
                { "$group": { "_id": null, "items": { "$addToSet": "$$ROOT" } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },

                // confirmed parent
                { "$graphLookup": { "from": "c", "startWith": "$out.s3", "connectFromField": "out.s3", "connectToField": "tx.h", "as": "confirmed_parent" } },
                { "$project": { "confirmed_parent": "$confirmed_parent", "object": ["$$ROOT"], } },
                { "$project": { "object.confirmed_parent": 0, } },
                { "$project": { "items": { "$concatArrays": [ "$object", "$confirmed_parent", ] } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },
                { "$project": { "_id": 0, } },
                { "$addFields": { "_id": "$tx.h", } },
                { "$group": { "_id": null, "items": { "$addToSet": "$$ROOT" } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },

                { "$graphLookup": { "from": "u", "startWith": "$out.s3", "connectFromField": "out.s3", "connectToField": "tx.h", "as": "unconfirmed_parent" } },
                { "$project": { "unconfirmed_parent": "$unconfirmed_parent", "object": ["$$ROOT"], } },
                { "$project": { "object.unconfirmed_parent": 0, } },
                { "$project": { "items": { "$concatArrays": [ "$object", "$unconfirmed_parent", ] } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },
                { "$project": { "_id": 0, } },
                { "$addFields": { "_id": "$tx.h", } },
                { "$group": { "_id": null, "items": { "$addToSet": "$$ROOT" } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },

                // dedupe
                { "$group": { "_id": null, "items": { "$addToSet": "$$ROOT" } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },


                { "$skip": cursor },
            ]
        },
        "r": {
            "f": "[.[] | {\"height\": .blk.i?, \"address\": .in[0].e.a, \"txid\": .tx.h, \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}]"
        }
    };

    if (category_id) {
        query["q"]["aggregate"][0]["$match"]["$and"].push({
            "$or": [
                {"tx.h": category_id},
                {"out.s3": category_id},
            ]
        });
    } else {
        // only select categories that don't have a subcategory id
        query["q"]["aggregate"][0]["$match"]["$and"].push({
            "$and": [
                {"out.s2": "category.create"},
                {"out.s3": "name"}
            ]
        });
    }

    //console.log("QUERY = ", JSON.stringify(query, null, 4));

    return query;
}

function filterChangelog(txids, items=[]) {

    var processing;

    do {
        processing = false;

        for (const item of items) {
            if (txids.indexOf(item.txid) !== -1 ) { continue; }
            if (txids.indexOf(item.data.s3) !== -1) {
                txids.push(item.txid);
                processing = true;
                break;
            }
        }

    } while (processing);


    const changelog = [];

    for (const item of items) {
        if (txids.indexOf(item.txid) !== -1) {
            changelog.push(item);
        } else {
            console.log("filtered out changelog item", item);
        }
    }

    return changelog.reverse();
}

function fetch_from_network(category_id=null, cursor=0, limit=200, results=[]) {

    const query = get_bitdb_query(category_id, cursor, limit);
    
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
                return (a.height===null)-(b.height===null) || +(a.height>b.height) || -(a.height<b.height);
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

function processUndos(results) {

    const reversed_undos = results.filter(r => { return r.type == "undo" }).reverse();
    var undos = new Map();
    for (const result of reversed_undos) {
        undos[result.txid] = result.action_id;
    }

    // pop off undos one at a time
    // better way to do this? need to undo undo undo undo..
    while (vals = Object.values(undos)) {
        var deleting = false;
        for (const txid of vals) {
            if (undos[txid]) {
                delete undos[txid];
                deleting = true;
                break;
            }
        }

        if (!deleting) {
            break;
        }
    }

    return Object.values(undos);
}

function processResults(results) {
    const processed = processOpenDirectoryTransactions(results);
    var processing = []

    // process them in this order because blockchain may be out of order and we need to build hierarchy in correct way
    // split out create/update/delete incase they're in the same block

    const undo_txids = processUndos(processed);

    // category
    for (const result of processed.filter(r => { return r.type == "category" && r.action == "create" })) {
        processing = processResult(result, processing, undo_txids)
    }
    for (const result of processed.filter(r => { return r.type == "category" && r.action == "update" })) {
        processing = processResult(result, processing, undo_txids)
    }
    for (const result of processed.filter(r => { return r.type == "category" && r.action == "delete" })) {
        processing = processResult(result, processing, undo_txids)
    }

    // entry
    for (const result of processed.filter(r => { return r.type == "entry" && r.action == "create" })) {
        processing = processResult(result, processing, undo_txids)
    }
    for (const result of processed.filter(r => { return r.type == "entry" && r.action == "update" })) {
        processing = processResult(result, processing, undo_txids)
    }
    for (const result of processed.filter(r => { return r.type == "entry" && r.action == "delete" })) {
        processing = processResult(result, processing, undo_txids)
    }

    // vote
    for (const result of processed.filter(r => { return r.type == "vote" })) {
        processing = processResult(result, processing, undo_txids)
    }

    return updateCategoryEntryCounts(processing);
}

function processCategoryResult(result, existing) {
    if (result.action == "create") {
        const obj = result.change;

        if (obj.description) {
            const markdown = new markdownit();
            obj.rendered_description = markdown.renderInline(obj.description);
        }

        var tipchain = [OPENDIR_TIP_ADDRESS, result.address];
        if (result.action_id) {
            obj.category = result.action_id;

            const category = findObjectByTX(obj.category, existing);
            if (category && category.tipchain) {
                tipchain = category.tipchain.concat([result.address]);
            }
        }

        obj.tipchain = tipchain;

        obj.type = result.type;
        obj.txid = result.txid;
        obj.address = result.address;
        obj.height = result.height;
        obj.votes = 0;

        existing.push(obj);
    } else if (result.action == "update") {
        var obj = findObjectByTX(result.action_id, existing);
        if (obj) {
            for (const key in result.change) {
                obj[key] = result.change[key];

                if (key == "description") {
                    const markdown = new markdownit();
                    obj["rendered_description"] = markdown.renderInline(obj.description);
                }
            }
        } else {
            console.log("couldn't find category for update", obj, result, existing);
        }
    } else if (result.action == "delete") {
        const obj = findObjectByTX(result.action_id, existing);
        if (obj) {
            obj.deleted = true;
        } else {
            console.log("couldn't find object for delete", obj, result);
        }
    } else {
        console.log("error processing category", result);
    }

    return existing;
}

function processEntryResult(result, existing) {
    if (result.action == "create") {
        const obj = result.change;

        if (obj.description) {
            const markdown = new markdownit();
            obj.rendered_description = markdown.renderInline(obj.description);
        }

        var tipchain = [OPENDIR_TIP_ADDRESS, result.address];
        if (result.action_id) {
            obj.category = result.action_id;

            const category = findObjectByTX(obj.category, existing);
            if (category && category.tipchain) {
                tipchain = category.tipchain.concat([result.address]);
            }
        }

        obj.tipchain = tipchain;

        obj.type = result.type;
        obj.txid = result.txid;
        obj.address = result.address;
        obj.height = result.height;
        obj.votes = 0;
        existing.push(obj);

    } else if (result.action == "update") {
        var obj = findObjectByTX(result.action_id, existing);
        if (obj) {
            for (const key in result.change) {
                obj[key] = result.change[key];

                if (key == "description") {
                    const markdown = new markdownit();
                    obj["rendered_description"] = markdown.renderInline(obj.description);
                }
            }
        } else {
            console.log("couldn't find category for update", obj, result, existing);
        }

    } else if (result.action == "delete") {
        const obj = findObjectByTX(result.action_id, existing);
        if (obj) {
            obj.deleted = true;
        } else {
            console.log("couldn't find object for delete", obj, result);
        }
    } else {
        console.log("error processing entry", result);
    }

    return existing;
}

function processVoteResult(result, existing) {
    const obj = findObjectByTX(result.action_id, existing);
    if (obj) {
        obj.votes += 1;
    } else {
        console.log("couldn't find object for vote", obj, result);
    }
    return existing;
}

function processResult(result, existing, undo) {
    if (undo.indexOf(result.txid) !== -1) {
        return existing;
    }

    switch (result.type) {
        case "category":
            return processCategoryResult(result, existing, undo);
        case "entry":
            return processEntryResult(result, existing, undo);
        case "vote":
            return processVoteResult(result, existing, undo);
        default:
            console.log("error processing result", result);
            return existing;
    }
}

function updateCategoryEntryCounts(results) {
    const counts = {};
    for (const result of results) {
        if (!result.deleted && result.category) {
            if (counts[result.category]) {
                counts[result.category] += 1;
            } else {
                counts[result.category] = 1;
            }
        }
    }


    return results.map(r => {
        if (r.type == "category") {
            var count = counts[r.txid];
            if (!count) { count = 0; }
            r.entries = count;
        }
        return r;
    });
}

function findObjectByTX(txid, results=[]) {
    for (const result of results) {
        if (result.txid == txid) {
            return result;
        }
    }
    return null;
}




if (typeof window == "undefined") {
    module.exports = {
        "fetch_from_network": fetch_from_network,
        "processResults": processResults,
        "OPENDIR_TIP_ADDRESS": OPENDIR_TIP_ADDRESS,
        "OPENDIR_PROTOCOL": OPENDIR_PROTOCOL,
        "OPENDIR_ACTIONS": OPENDIR_ACTIONS,
    };
}
