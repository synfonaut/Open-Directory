var isNode = (typeof window == "undefined");

if (isNode) {
    axios = require("axios");
    SETTINGS = require("./settings.js");
}

const B_MEDIA_PROTOCOL = "19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut";
const BCAT_MEDIA_PROTOCOL = "15DHFxWZJT58f9nhyGnsRBqrgwK4W6h4Up";
const SUPPORTED_TIPCHAIN_PROTOCOLS = [
    "bit://" + B_MEDIA_PROTOCOL + "/",
    "b://",
    "bit://" + BCAT_MEDIA_PROTOCOL + "/",
];

// Open Directory Bitcom Protocol
const OPENDIR_PROTOCOL = "1dirzgocAsru3SdhetQkEJraQgYTf5xQm";

// Allowed actions
const OPENDIR_ACTIONS = [
    "category.create",
    "category.update",
    "category.delete",
    "entry.create",
    "entry.update",
    "entry.delete",
    "vote",
    "undo",
    "fork.soft",
];

function toBase64(str) {
    if (isNode) {
        return Buffer.from(str).toString('base64');
    }

    return btoa(str);
}

function get_bmedia_bitdb_query(txids, cursor=0, limit=100) {
    const query = {
        "v": 3,
        "q": {

            // querying both confirmed and unconfirmed transactions
            // mongodb doesn't have a clean way to join on both so nearly every query below is doubled, on for each db
            "db": ["u", "c"],

            "limit": limit,

            // need sort here so cursor is consistent
            "sort": {
                "txid": 1
            },
            "aggregate": [
                { "$match": { "tx.h": { "$in": txids } } },

                // let users page results
                { "$skip": cursor },
            ]
        },

        //
        // we can clean up the response to return exactly what we need, saving bandwidth
        // the jq filter below says take all the elements in the array and return this object
        // data is a little tricky, but it grabs all s1,s2,s3,s4 data no matter how many
        "r": {
            "f": "[.[] | {                  \
                \"height\": .blk.i?,        \
                \"time\": .blk.t?,        \
                \"address\": .in[0].e.a,    \
                \"outputs\": [.out[] | {\"address\": .e.a, \"sats\": .e.v}], \
                \"txid\": .tx.h,            \
                \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}]"
        }
    }

    return query;
}

function get_bitdb_query(category_id=null, cursor=0, limit=1000, maxDepth=5) {

    if (category_id == null) {
        category_id = get_root_category_txid();
    }

    // this is a monster query. if you're thinking of building a query this complex, you might
    // reconsider and build a Planaria instead—future versions will

    const query = {
        "v": 3,
        "q": {

            // querying both confirmed and unconfirmed transactions
            // mongodb doesn't have a clean way to join on both so nearly every query below is doubled, on for each db
            "db": ["u", "c"],

            "limit": limit,

            // need sort here so cursor is consistent
            "sort": {
                "txid": 1
            },

            // aggregate is where most of the magic happens. it's the pipeline where we
            //  1. filter for Open Directory data
            //  2. join on related data (links, subcategories, votes)
            //  3. join on bitcoin media
            "aggregate": [
                {
                    // global filter on the OPENDIR_PROTOCOL
                    // the other "$and" clause gets dynamically inserted below,
                    // depending on whether it's a category view or home page view
                    "$match": {
                        "$and": [
                            {"out.s1": OPENDIR_PROTOCOL},
                        ]
                    }
                },

                //
                // Crawl confirmed children (entries, votes, undos)

                // perform recursive join, connecting s3 to txid
                { "$graphLookup": { "from": "c", "startWith": "$tx.h", "connectFromField": "tx.h", "connectToField": "out.s3", "as": "confirmed_children", "maxDepth": maxDepth } },

                // mongo doesn't have an easy way to bring sub-documents up to the parent, so it requires a few steps
                // copy both to surrounding container so they're siblings
                { "$project": { "confirmed_children": "$confirmed_children", "object": ["$$ROOT"], } },
                // delete old copy from sibling in main object
                { "$project": { "object.confirmed_children": 0, } },
                // add siblings arrays together
                { "$project": { "items": { "$concatArrays": [ "$object", "$confirmed_children", ] } } },
                // flatten sibling arrays
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                // remove surrounding container
                { "$replaceRoot": { "newRoot": "$items" } },

                //
                // Crawl confirmed children (entries, votes, undos)
                { "$graphLookup": { "from": "u", "startWith": "$tx.h", "connectFromField": "tx.h", "connectToField": "out.s3", "as": "unconfirmed_children", "maxDepth": maxDepth } },
                { "$project": { "unconfirmed_children": "$unconfirmed_children", "object": ["$$ROOT"], } },
                { "$project": { "object.unconfirmed_children": 0, } },
                { "$project": { "items": { "$concatArrays": [ "$object", "$unconfirmed_children", ] } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },


                //
                // Crawl confirmed parents (tipchain needs path to root), so recursive join up
                { "$graphLookup": { "from": "c", "startWith": "$out.s3", "connectFromField": "out.s3", "connectToField": "tx.h", "as": "confirmed_parent" } },
                { "$project": { "confirmed_parent": "$confirmed_parent", "object": ["$$ROOT"], } },
                { "$project": { "object.confirmed_parent": 0, } },
                { "$project": { "items": { "$concatArrays": [ "$object", "$confirmed_parent", ] } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },

                //
                // Crawl unconfirmed parents (tipchain needs path to root), so recursive join up
                { "$graphLookup": { "from": "u", "startWith": "$out.s3", "connectFromField": "out.s3", "connectToField": "tx.h", "as": "unconfirmed_parent" } },
                { "$project": { "unconfirmed_parent": "$unconfirmed_parent", "object": ["$$ROOT"], } },
                { "$project": { "object.unconfirmed_parent": 0, } },
                { "$project": { "items": { "$concatArrays": [ "$object", "$unconfirmed_parent", ] } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },

                //
                // Crawl associated b:// and bcat:// media so we can include author in the tipchain
                {
                    "$addFields": {
                       "b_txid": [
                           // Split out different versions of b:// and bcat:// txids, works with bit:// general protocol too
                            { "txid": { "$arrayElemAt": [ {"$split": [ {"$arrayElemAt": ["$out.s7", 0]}, "bit://" + B_MEDIA_PROTOCOL + "/" ]}, 1 ] } },
                            { "txid": { "$arrayElemAt": [ {"$split": [ {"$arrayElemAt": ["$out.s7", 0]}, "b://" ]}, 1 ] } },

                            { "txid": { "$arrayElemAt": [ {"$split": [ {"$arrayElemAt": ["$out.s7", 0]}, "bit://" + BCAT_MEDIA_PROTOCOL + "/" ]}, 1 ] } },
                            { "txid": { "$arrayElemAt": [ {"$split": [ {"$arrayElemAt": ["$out.s7", 0]}, "bcat://" ]}, 1 ] } },
                        ]
                    }
                },

                //
                // Crawl confirmed media
                { "$lookup": { "from": "c", "localField": "b_txid.txid", "foreignField": "tx.h", "as": "confirmed_bmediatx" } },
                { "$project": { "confirmed_bmediatx": "$confirmed_bmediatx", "object": ["$$ROOT"], } },
                { "$project": { "object.confirmed_bmediatx": 0, "object.b_txid": 0} },
                // including b:// files could make queries very large, so filter out data—we only need metadata
                {
                    "$project": {
                        "confirmed_bmediatx.tx": 1,
                        "confirmed_bmediatx.blk": 1,
                        "confirmed_bmediatx.in": 1,
                        "confirmed_bmediatx.out.s1": 1,
                        "confirmed_bmediatx.out.e": 1,
                        "object": 1,
                    }
                },
                { "$project": { "items": { "$concatArrays": [ "$object", "$confirmed_bmediatx", ] } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },



                //
                // Crawl unconfirmed media
                { "$lookup": { "from": "u", "localField": "b_txid.txid", "foreignField": "tx.h", "as": "unconfirmed_bmediatx" } },
                {
                    "$project": {
                        "unconfirmed_bmediatx": "$unconfirmed_bmediatx",
                        "object": ["$$ROOT"],
                    }
                },
                { "$project": { "object.unconfirmed_bmediatx": 0, "object.b_txid": 0} },
                {
                    "$project": {
                        "unconfirmed_bmediatx.tx": 1,
                        "unconfirmed_bmediatx.blk": 1,
                        "unconfirmed_bmediatx.in": 1,
                        "unconfirmed_bmediatx.out.s1": 1,
                        "unconfirmed_bmediatx.out.e": 1,
                        "object": 1,
                    }
                },
                { "$project": { "items": { "$concatArrays": [ "$object", "$unconfirmed_bmediatx", ] } } },
                { "$unwind": { "path": "$items", "preserveNullAndEmptyArrays": true } },
                { "$replaceRoot": { "newRoot": "$items" } },


                //
                // mongo will dedupe based on exact document rather than id, so unfortunately some duplicates will slip through
                // this should stop majority of them though—rest will get filtered out on client
                { "$project": { "_id": 0, } },
                { "$addFields": { "_id": "$tx.h", } },
                { "$group": { "_id": null, "items": { "$addToSet": "$$ROOT" } } },
                { "$unwind": { "path": "$items" } },
                { "$replaceRoot": { "newRoot": "$items" } },

                //
                // let users page results
                { "$skip": cursor },
            ]
        },

        //
        // we can clean up the response to return exactly what we need, saving bandwidth
        // the jq filter below says take all the elements in the array and return this object
        // data is a little tricky, but it grabs all s1,s2,s3,s4 data no matter how many
        "r": {
            "f": "[.[] | {                  \
                \"height\": .blk.i?,        \
                \"time\": .blk.t?,        \
                \"address\": .in[0].e.a,    \
                \"outputs\": [.out[] | {\"address\": .e.a, \"sats\": .e.v}], \
                \"txid\": .tx.h,            \
                \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}]"
        }
    };

    //
    // For an explicit category_id we can filter on the txid itself and anything that references the txid
    if (category_id) {
        query["q"]["aggregate"][0]["$match"]["$and"].push({
            "$or": [
                {"tx.h": category_id},
                {"out.s3": category_id},
            ]
        });

    //
    // For the homepage, we grab all categories without parents.
    // This is a bit less stable as the order of properties aren't set in stone, what we really need is != BITCOIN_TRANSACTION
    } else {
        // only select categories that don't have a subcategory id
        query["q"]["aggregate"][0]["$match"]["$and"].push({
            "$or": [
                {
                    "$and": [
                        {"out.s2": "fork.soft"},
                        {"out.s4": null}
                    ]
                },
                {
                    "$and": [
                        {"out.s2": "category.create"},
                        {"out.s3": "name"}
                    ]
                }
            ]
        });
    }

    //console.log("QUERY = ", JSON.stringify(query, null, 4));

    return query;
}


function fetch_from_network(category_id=null, cursor=0, limit=1000, results=[]) {

    if (category_id == null) {
        category_id = get_root_category_txid();
    }


    const query = get_bitdb_query(category_id, cursor, limit);
    const encoded_query = toBase64(JSON.stringify(query));
    const api_url = SETTINGS.api_endpoint.replace("{api_key}", SETTINGS.api_key).replace("{api_action}", "q");;
    const url = api_url.replace("{query}", encoded_query);
    const header = { headers: { key: SETTINGS.api_key } };

    function handleResponse(resolve, reject, r) {

        if (r.errors) {
            reject("error during query " + r.errors);
            return;
        }

        var items = {};
        const rows = r.c.concat(r.u).reverse();

        /*
        for (const row of rows) {
            console.log("ROW", row);
        }

        console.log("ROWS", rows.length);
        throw "E";
        console.log("ROW JSON", JSON.stringify(rows, null, 4));
        */

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

        // Hack to keep the site up...homepage is bringing us down
        if (category_id == null) {
            resolve(CACHED_HOMEPAGE);
            return;
        }


        console.log("Making HTTP request to server " + cursor + "," + limit);
        if (isNode) {
            axios = require("axios");
            axios(url, header).then(r => {
                if (r.status !== 200) {
                    reject("Error while retrieving response from server " + r.status);
                    return;
                }

                handleResponse(resolve, reject, r.data)
            }).catch(reject);
        } else {
            fetch(url, header).then(function(r) {
                if (r.status !== 200) {
                    reject("Error while retrieving response from server " + r.status);
                    return;
                }

                return r.json();
            }).then(r => { handleResponse(resolve, reject, r) }).catch(reject);
        }

    });
}

function fetch_bmedia_from_network(txids, cursor=0, limit=20, results=[]) {

    const query = get_bmedia_bitdb_query(txids, cursor, limit);
    var b64 = btoa(JSON.stringify(query));
    const url = "https://genesis.bitdb.network/q/1FnauZ9aUH2Bex6JzdcV4eNX7oLSSEbxtN/" + b64;
    const header = { headers: { key: "1A4xFjNatCgAK5URARbVwoxo1E3MCMETb6" } };

    function handleResponse(resolve, reject, r) {

        if (r.errors) {
            reject("error during query " + r.errors);
            return;
        }

        var items = {};
        const rows = r.c.concat(r.u).reverse();

        results = results.concat(rows);
        cursor += rows.length;

        if (rows.length >= limit) {
            console.log("Seems like there's still more... polling for more");
            fetch_bmedia_from_network(txids, cursor, limit, results).then(resolve).catch(reject);
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

        console.log("Making genesis HTTP request to server " + cursor + "," + limit);
        fetch(url, header).then(function(r) {
            if (r.status !== 200) {
                reject("Error while retrieving response from server " + r.status);
                return;
            }

            return r.json();
        }).then(r => { handleResponse(resolve, reject, r) }).catch(reject);

    });
}
function processOpenDirectoryTransactions(results) {
    return results.map(processOpenDirectoryTransaction).filter(r => { return r });
}

// find all children of an object that perform an action on it
function findChildrenByActionID(obj, results=[]) {

    var children = [];
    for (const result of results) {
        if (result.action_id == obj.txid) {
            const subchildren = findChildrenByActionID(result, results); children = children.concat([result], subchildren);
        }

    }
    return children;
}

/** Given a set of results, return a set of txid's to undo ... works recursively, so you can undo an undo an undo.... */
function processUndos(results) {

    // build txids
    const txids = {};
    for (const result of results) {
        txids[result.txid] = result;
    }

    // find nodes that aren't referenced by action_id, we start with those
    const nodes = [];
    for (const result of results) {
        if (!txids[result.action_id]) {
            nodes.push(result);
        }
    }

    // Build actual chain by collapsing undos...then go backwards and figure out which undos stuck around

    // loop through nodes and find their children
    const unique_ids = new Set();
    for (const node of nodes) {
        const children = findChildrenByActionID(node, results);

        // process undo
        var undo_ids = {};
        for (var i = (children.length - 1); i >= 0; i--) {
            const child = children[i];
            if (child.type !== "undo") { continue }
            if (!undo_ids[child.txid]) {
                undo_ids[child.action_id] = child;
            }
        }

        for (const undo_id in undo_ids) {
            unique_ids.add(undo_id);
        }
    }

    return Array.from(unique_ids);
}

function processRawResults(rows) {
    const txpool = processOpenDirectoryTransactions(rows);
    return processResults(rows, txpool);
}

function processResults(rows, txpool) {
    var processing = [];

    const undo_txids = processUndos(txpool);

    function process(result) {
        return processResult(result, processing, undo_txids, rows);
    }

    // process them in this order because blockchain may be out of order and we need to build hierarchy in correct way
    // split out create/update/delete incase they're in the same block

    // category
    for (const result of txpool.filter(r => { return r.type == "category" && r.action == "create" })) { processing = process(result) }
    for (const result of txpool.filter(r => { return r.type == "category" && r.action == "update" })) { processing = process(result) }
    for (const result of txpool.filter(r => { return r.type == "category" && r.action == "delete" })) { processing = process(result) }

    // entry
    for (const result of txpool.filter(r => { return r.type == "entry" && r.action == "create" })) { processing = process(result) }
    for (const result of txpool.filter(r => { return r.type == "entry" && r.action == "update" })) { processing = process(result) }
    for (const result of txpool.filter(r => { return r.type == "entry" && r.action == "delete" })) { processing = process(result) }

    // process tipchain, which right now only includes entries and categories
    processing = processTipchain(processing, txpool);

    // vote & forks
    for (const result of txpool.filter(r => { return r.type == "vote" })) { processing = process(result) }
    for (const result of txpool.filter(r => { return r.type == "fork" })) { processing = process(result) }

    // update final counts
    const process_pipeline = [updateCategoryEntryCounts, updateCategoryMoneyCounts, updateEntryHottness];
    for (const fn of process_pipeline) {
        processing = fn(processing);
    }

    return processing;
}

function updateEntryHottness(results) {
    return results.map(result => {
        result.hottness = calculateEntryHottness(result);
        return result;
    });
}

// Hacker News score algorithm, thanks https://medium.com/hacking-and-gonzo/how-hacker-news-ranking-algorithm-works-1d9b0cf2c08d
function calculateEntryHottness(result, gravity=1.8) {
    const val = (result.satoshis + result.votes) * 1.0;
    const now = (new Date()).getTime() / 1000;
    const time_since = (!result.time ? 0 : (now - result.time));
    const hours_since = (time_since / (60 * 60));
    const score = (val / Math.pow((hours_since + 2), gravity));
    return score;
}

function processTipchainResult(result, processing, txpool, media) {

    const opendir_tips = JSON.parse(JSON.stringify(SETTINGS.tip_addresses)); // hacky deep copy

    const result_tip = {address: result.address, txid: result.txid, type: result.type};
    var tipchain = opendir_tips.concat(result_tip);

    if (result.category) {
        const category = findObjectByTX(result.category, processing);

        if (category) {
            processTipchainResult(category, processing, txpool, media);
            tipchain = category.tipchain.concat([result_tip]);
        }

    }

    if (result.type == "entry") {
        const tip = parseTipFromEntryMedia(result, media);
        if (tip) {
            tipchain.push(tip);
        }
    }

    result.tipchain = tipchain;

    const tipchain_addresses = tipchain.map(t => { return t.address });
    const satoshis = convertOutputs(result.outputs, tipchain_addresses);

    result.satoshis = satoshis;
}


function processTipchain(processing, txpool) {
    const media = {};
    for (const tx of txpool.filter(tx => { return tx.type == "other" })) {
        media[tx.txid] = tx;
    }

    for (const item of processing) {
        if (item.type !== "entry" && item.type !== "category") { continue }
        processTipchainResult(item, processing, txpool, media);
    }

    return processing;
}


function processCategoryResult(result, existing, undo, rows) {
    if (undo.indexOf(result.txid) !== -1) {
        return existing;
    }

    if (result.action == "create") {
        const obj = result.change;

        if (result.action_id) {
            obj.category = result.action_id;
        }

        obj.type = result.type;
        obj.txid = result.txid;
        obj.address = result.address;
        obj.height = result.height;
        obj.time = result.time;
        obj.outputs = result.outputs;
        obj.votes = 0;
        obj.entries = 0;
        existing.push(obj);

    } else if (result.action == "update") {
        var obj = findObjectByTX(result.action_id, existing);
        if (obj) {
            for (const key in result.change) {
                obj[key] = result.change[key];
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

function processEntryResult(result, existing, undo, rows) {
    if (undo.indexOf(result.txid) !== -1) {
        return existing;
    }

    if (result.action == "create") {
        const obj = result.change;

        if (result.action_id) {
            obj.category = result.action_id;
        }

        obj.type = result.type;
        obj.txid = result.txid;
        obj.address = result.address;
        obj.height = result.height;
        obj.time = result.time;
        obj.outputs = result.outputs;
        obj.hottness = 0;
        obj.votes = 0;

        existing.push(obj);

    } else if (result.action == "update") {
        var obj = findObjectByTX(result.action_id, existing);
        if (obj) {
            for (const key in result.change) {
                obj[key] = result.change[key];
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

function processVoteResult(result, existing, undo, rows) {

    const obj = findObjectByTX(result.action_id, existing);
    if (obj) {

        const tipchain_addresses = obj.tipchain.map(o => { return o.address });
        const satoshis = convertOutputs(result.outputs, tipchain_addresses);

        if (undo.indexOf(result.txid) == -1) {
            obj.votes += 1;
            obj.satoshis += satoshis;
        }

        // Hacky: Backfill the raw change logs with satoshis
        if (satoshis > 0) {
            for (var i in rows) {
                if (rows[i].txid == result.txid) {
                    rows[i].satoshis = satoshis;
                }
            }
        }

    } else {
        console.log("couldn't find object for vote", obj, result);
    }
    return existing;
}

function processForkResult(result, existing, rows) {

    var tipchain_addresses = [];
    if (result.action_id) {
        const obj = findObjectByTX(result.action_id, existing);
        if (obj) {
            tipchain_addresses = obj.tipchain.map(o => { return o.address });
        }
    } else {
        tipchain_addresses = SETTINGS.tip_address;
    }

    const satoshis = convertOutputs(result.outputs, tipchain_addresses);
    if (!result.satoshis) {
        result.satoshis = satoshis;
    } else {
        result.satoshis += satoshis;
    }

    // Hacky: Backfill the raw change logs with satoshis
    if (satoshis > 0) {
        for (var i in rows) {
            if (rows[i].txid == result.txid) {
                rows[i].satoshis = satoshis;
            }
        }
    }

    return existing;
}

function processResult(result, existing, undo, rows) {
    switch (result.type) {
        case "category":
            return processCategoryResult(result, existing, undo, rows);
        case "entry":
            return processEntryResult(result, existing, undo, rows);
        case "vote":
            return processVoteResult(result, existing, undo, rows);
        case "fork":
            return processForkResult(result, existing, rows);
        default:
            console.log("error processing result", result);
            return existing;
    }
}


function parseTransactionAddressFromURL(url) {
    for (const protocol of SUPPORTED_TIPCHAIN_PROTOCOLS) {
        const bmedia_parts = url.split(protocol);
        if (bmedia_parts.length == 2) {
            const bmedia_txid = bmedia_parts[1];
            if (bmedia_txid.length == 64) {
                return bmedia_txid;
            }
        }
    }
    return null;
}

function parseTipFromEntryMedia(item, media) {
    for (const protocol of SUPPORTED_TIPCHAIN_PROTOCOLS) {
        const bmedia_parts = item.link.split(protocol);
        if (bmedia_parts.length == 2) {
            const bmedia_txid = bmedia_parts[1];
            if (bmedia_txid.length == 64) {
                const bmedia_tx = media[bmedia_txid];
                if (bmedia_tx) {
                    return {
                        "address": bmedia_tx.address,
                        "type": "media",
                    };

                } else {
                    console.log("unable to find associated b media for item", item.txid);
                }
            }
        }
    }
    return null;
}

function updateCategoryMoneyCounts(items) {
    return items.map(item => {
        if (item.type == "category") {
            item.satoshis = countMoneyUnderObject(item, items);
            item.votes = countVotesUnderObject(item, items);
        }
        return item;
    });
}

function countMoneyUnderObject(obj, items) {
    var amount = obj.satoshis;
    for (const item of items) {
        if (!item.deleted && item.category == obj.txid) {
            amount += item.satoshis;

            if (item.type == "category") {
                amount += countMoneyUnderObject(item, items);
            }
        }
    }
    return amount;
}

function countVotesUnderObject(obj, items) {
    var amount = obj.votes;
    for (const item of items) {
        if (!item.deleted && item.category == obj.txid) {
            amount += item.votes;

            if (item.type == "category") {
                amount += countVotesUnderObject(item, items);
            }
        }
    }
    return amount;
}

function updateCategoryEntryCounts(items) {
    return items.map(item => {
        if (item.type == "category") {
            item.entries = countObjectsUnderObject(item, items);
        }
        return item;
    });
}

function countObjectsUnderObject(obj, items) {
    var count = 0;
    for (const item of items) {
        if (!item.deleted && item.category == obj.txid) {
            count += 1;

            if (item.type == "category") {
                count += countObjectsUnderObject(item, items);
            }
        }
    }
    return count;
}

function expandTipchainInformation(tipchain, tipAmount=0, results=[]) {
    const tips = tipchain.slice(0).reverse();
    const tipchain_addresses = tips.map(t => { return t.address; });
    const splits = calculateTipchainSplits(tips).reverse();

    const expanded_tipchain = [];
    for (var i = 0; i < tipchain_addresses.length; i++) {
        const tip = tips[i];
        var name = tip.name;
        if (!name && tip.txid) {
            const obj = findObjectByTX(tip.txid, results);
            if (obj) {
                name = obj.name;
            }
        }
        if (!name) {
            name = "";
        }

        const split = splits[i];
        const amount = tipAmount * split;
        expanded_tipchain.push({
            "address": tip.address,
            "type": tip.type,
            "split": split,
            "amount": amount,
            "name": name
        });
    }

    return expanded_tipchain;
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

function calculateTipchainSplits(tipchain) {

    if (tipchain.length == 0) {
        return [];
    }

    const weights = [];
    for (var i = 1; i <= tipchain.length; i++) {
        weights.push(1 + Math.log(i));
    }

    const total = weights.reduce((a, b) => { return a + b });
    const splits = weights.map(w => {
        return w / total;
    });

    return splits;
}

function calculateTipPayment(tipchain, amount, currency) {

    if (!amount) {
        console.log("error while calculating tip payment, invalid amount");
        return null;
    }

    if (!currency) {
        console.log("error while calculating tip payment, invalid currency");
        return null;
    }

    const weights = calculateTipchainSplits(tipchain);
    if (weights.length != tipchain.length) {
        console.log("error while calculating tip payment, weights didn't match tipchain length");
        return null;
    }

    const tips = [];
    for (var i = 0; i < tipchain.length; i++) {
        const tip_address = (typeof tipchain[i] == "object" ? tipchain[i].address : tipchain[i]);
        const weight = weights[i];
        const tip_amount = Math.round((weight * amount) * 10000) / 10000;

        if (tip_amount > 0) {
            tips.push({
                address: tip_address,
                value: tip_amount,
                currency: currency
            });
        }
    }

    return tips;
}

function processOpenDirectoryTransaction(result) {

    if (!result.txid || !result.data || !result.address) {
        return null;
    }

    const txid = result.txid;
    const address = result.address;
    const height = (result.height ? result.height : Math.Infinity);
    const time = (result.time ? result.time : 0);
    const outputs = (result.outputs ? result.outputs : []);
    var args = Object.values(result.data);
    const protocol_id = args.shift();
    const opendir_action = args.shift();
    var item_type, item_action;

    if (!txid) {
        console.log("Error while processing open directory transaction: no txid", result);
        return null;
    }

    if (protocol_id !== OPENDIR_PROTOCOL) {
        return {
            txid: result.txid,
            address: result.address,
            height: height,
            time: time,
            type: "other",
        };
    }

    if (OPENDIR_ACTIONS.indexOf(opendir_action) == -1) {
        console.log("Error while processing open directory transaction: invalid action", result);
        return null;
    }

    if (opendir_action == "vote" || opendir_action == "undo") {
        item_type = item_action = opendir_action;
    } else {
        const parts = opendir_action.split(".");
        if (parts.length != 2) {
            console.log("Error while processing open directory transaction: invalid action", result);
            return null;
        }

        item_type = parts[0];
        item_action = parts[1];
    }

    var obj = {
        type: item_type,
        type: item_type,
        action: item_action,
        txid: txid,
        address: address,
        height: height,
        time: time,
        outputs: outputs
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

            const desc = args.shift();
            if (desc) {
                obj.description = desc;
                result.description = desc;
            }
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

            const desc = args.shift();
            if (desc) {
                obj.description = desc;
                result.description = desc;
            }
        } else {
            console.log("unknown entry action", result);
        }
    } else if (item_type == "vote") {
        obj.action_id = args.shift();
    } else if (item_type == "fork") {
        if (args.length == 2) {
            obj.fork_url = args.shift();
        } else if (args.length == 3) {
            obj.fork_url = args.shift();
            obj.action_id = args.shift();
        } else {
            console.log("unknown number of args", result);
            return null;
        }
    } else if (item_type == "undo") {
        if (args.length == 1) {
            obj.reference_id = args.shift();
            obj.action_id = obj.reference_id;
        } else if (args.length == 2) {
            obj.reference_id = args.shift();
            obj.action_id = args.shift();
        } else {
            obj.reference_id = args.shift();
            obj.action_id = args.shift();
            obj.description = args.shift();
        }

        // hacky... backfill original references so we have data in changelog
        if (obj.reference_id) {
            result.reference_id = obj.reference_id;
        }

        if (obj.action_id) {
            result.action_id = obj.action_id;
        }

        if (obj.description) {
            result.description = obj.description;
        }
    } else {
        console.log("unknown item type", result);
    }


    return obj;
}

function convertOutputs(outputs, address_space=[]) {
    var satoshis = 0;
    for (const output of outputs) {
        if (address_space.indexOf(output.address) !== -1) {
            satoshis += output.sats;
        }
    }

    return satoshis;
}

function findObjectByTX(txid, results=[]) {
    for (const result of results) {
        if (result.txid == txid) {
            return result;
        }
    }
    return null;
}

function findRootActionID(result, results=[]) {
    if (!result.action_id) {
        return null;
    }

    if (result.type == "undo" && result.action_id) {
        const parent = findObjectByTX(result.action_id, results);
        if (parent && parent.type == "undo") {
            const parent_action_id = findRootActionID(parent, results);
            if (parent_action_id) {
                return parent_action_id;
            }
        }
    }

    return result.action_id;
}



if (typeof window == "undefined") {
    module.exports = {
        "OPENDIR_PROTOCOL": OPENDIR_PROTOCOL,
        "OPENDIR_ACTIONS": OPENDIR_ACTIONS,
        "fetch_from_network": fetch_from_network,
        "processResults": processResults,
        "processRawResults": processRawResults,
        "calculateTipchainSplits": calculateTipchainSplits,
        "calculateTipPayment": calculateTipPayment,
    };
}
