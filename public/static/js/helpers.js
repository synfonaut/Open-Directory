const isNode = (typeof window == "undefined");
const isBrowser = (typeof window == "object");

var axios;
if (isNode) {
    axios = require("axios");
    markdownit = require("markdown-it");
}

const BSV_PRICE = 54.00;
const B_MEDIA_PROTOCOL = "19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut";
const BCAT_MEDIA_PROTOCOL = "15DHFxWZJT58f9nhyGnsRBqrgwK4W6h4Up";

const OPENDIR_TIP_AMOUNT = 0.05;
const OPENDIR_TIP_CURRENCY = "USD";
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

function satoshisToDollars(satoshis, bitcoin_price=BSV_PRICE) {
    var amount;
    if (satoshis > 0) {
        var val = ((satoshis / 100000000) * bitcoin_price).toFixed(2).toLocaleString();
        if (val == "0.00" || val == "0.01") {
            val = ((satoshis / 100000000) * bitcoin_price).toFixed(3).toLocaleString();
        }
        amount = "$" + val;
    }
    return amount;
}

function calculateTipchainSplits(tipchain) {
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
        const tip_address = tipchain[i].address;
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
    const satoshis = (result.satoshis ? result.satoshis : 0);
    var args = Object.values(result.data);
    const protocol_id = args.shift();
    const opendir_action = args.shift();

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
        [item_type, item_action] = opendir_action.split(".");
    }

    var obj = {
        type: item_type,
        type: item_type,
        action: item_action,
        txid: txid,
        address: address,
        height: height,
        time: time,
        satoshis: satoshis
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

function convertOutputs(results) {
    const address_space = results.map(r => { return r.address });
    address_space.push("1LPe8CGxypahVkoBbYyoHMUAHuPb4S2JKL");
    return results.map(r => { return convertOutput(r, address_space) });
}

function convertOutput(result, address_space=[]) {
    var started = true;
    var satoshis = 0;
    console.log("----");
    console.log("FINDING OUTPUTS FOR", JSON.stringify(result));

    for (const output of result.outputs) {
        if (output.address == OPENDIR_TIP_ADDRESS) {
            started = true;
        }
        if (address_space.indexOf(output.address) == -1) {
            started = false;
        }
        if (started) {
            console.log("ADDING OUTPUT", output);
            satoshis += output.sats;
        } else {
            console.log("SKIPPING OUTPUT", output);
        }
    }

    console.log("SATS = ", satoshis);
    result.satoshis = satoshis;
    delete result["outputs"];
    return result;
}

function preprocessing(results) {
    return convertOutputs(results);
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

    // this is a monster query. if you're thinking of building a query this complex, you might
    // reconsider and build a Planaria instead—future versions will

    const query = {
        "v": 3,
        "q": {

            // querying both confirmed and unconfirmed transactions
            // mongodb doesn't have a clean way to join on both so nearly every query below is doubled, on for each db
            "db": ["u", "c"],
            "limit": limit,

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
                { "$graphLookup": { "from": "c", "startWith": "$tx.h", "connectFromField": "tx.h", "connectToField": "out.s3", "as": "confirmed_children" } },

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
                { "$graphLookup": { "from": "u", "startWith": "$tx.h", "connectFromField": "tx.h", "connectToField": "out.s3", "as": "unconfirmed_children" } },
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
            "$and": [
                {"out.s2": "category.create"},
                {"out.s3": "name"}
            ]
        });
    }

    //console.log("QUERY = ", JSON.stringify(query, null, 4));

    return query;
}

// https://stackoverflow.com/a/6109105
function timeDifference(current, previous) {

    if (!current || !previous) {
        return "just now";
    }

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        return pluralize(Math.round(elapsed/1000), 'second', 'seconds') + ' ago';
    }

    else if (elapsed < msPerHour) {
        return pluralize(Math.round(elapsed/msPerMinute), 'minute', 'minutes') + ' ago';
    }

    else if (elapsed < msPerDay ) {
        return pluralize(Math.round(elapsed/msPerHour), 'hour', 'hours') + ' ago';
    }

    else if (elapsed < msPerMonth) {
        return pluralize(Math.round(elapsed/msPerDay), 'day', 'days') + ' ago';
    }

    else if (elapsed < msPerYear) {
        return pluralize(Math.round(elapsed/msPerMonth), 'month', 'months') + ' ago';
    }

    else {
        return pluralize(Math.round(elapsed/msPerYear ), 'year', 'years') + ' ago';
    }
}

function pluralize(val, singular, plural) {
    if (val == 1) {
        return val + " " + singular;
    }
    return val + " " + plural;
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
        /*
        //TODO: remove
        for (const row of rows) {
            console.log("ROW", JSON.stringify(row, null, 4));
        }

        console.log("ROWS", rows.length);

        throw "E";
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

            console.log("ITEMS", items);

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

    var roots = new Map(results.filter(r => { return r.type != "undo" }).map(r => { return [r.txid, r] }));
    var undos = results.filter(r => { return r.type == "undo" });

    while (roots.size != results.length) {
        for (const root of roots.values()) {
            for (const undo of undos) {
                if (undo.action_id == root.txid && !roots[undo.txid]) {
                    roots.set(undo.txid, undo);
                }
            }
        }
    }

    const reversed = Array.from(roots.values()).slice(0).reverse();
    const undos_txids = {};

    for (const result of reversed) {
        if (result.type == "undo") {
            if (!undos_txids[result.txid]) {
                undos_txids[result.action_id] = result.txid;
            }
        }
    }

    return Object.keys(undos_txids);
}

function processResults(results) {
    const processed = processOpenDirectoryTransactions(results);
    var processing = [];

    // process them in this order because blockchain may be out of order and we need to build hierarchy in correct way
    // split out create/update/delete incase they're in the same block

    const undo_txids = processUndos(processed);

    const txpool = processed.filter(r => { return r.type == "other" } );

    // category
    for (const result of processed.filter(r => { return r.type == "category" && r.action == "create" })) {
        processing = processResult(result, processing, txpool, undo_txids)
    }
    for (const result of processed.filter(r => { return r.type == "category" && r.action == "update" })) {
        processing = processResult(result, processing, txpool, undo_txids)
    }
    for (const result of processed.filter(r => { return r.type == "category" && r.action == "delete" })) {
        processing = processResult(result, processing, txpool, undo_txids)
    }

    // entry
    for (const result of processed.filter(r => { return r.type == "entry" && r.action == "create" })) {
        processing = processResult(result, processing, txpool, undo_txids)
    }
    for (const result of processed.filter(r => { return r.type == "entry" && r.action == "update" })) {
        processing = processResult(result, processing, txpool, undo_txids)
    }
    for (const result of processed.filter(r => { return r.type == "entry" && r.action == "delete" })) {
        processing = processResult(result, processing, txpool, undo_txids)
    }

    // vote
    for (const result of processed.filter(r => { return r.type == "vote" })) {
        processing = processResult(result, processing, txpool, undo_txids)
    }


    return updateCategoryEntryCounts(processing.map(r => {
        return processBMediaTipChainResult(r, txpool);
    }));
}

// Convert b:// links into the tipchain if possible
function processBMediaTipChainResult(result, txpool=[]) {

    if (result.type !== "entry") { return result; }

    const supported_protocols = [
        "bit://" + B_MEDIA_PROTOCOL + "/",
        "b://",
        "bit://" + BCAT_MEDIA_PROTOCOL + "/",
        "bcat://",
    ];

    for (const protocol of supported_protocols) {
        const bmedia_parts = result.link.split(protocol);
        if (bmedia_parts.length == 2) {
            const bmedia_txid = bmedia_parts[1];
            if (bmedia_txid.length == 64) {
                const bmedia = findObjectByTX(bmedia_txid, txpool);
                if (bmedia && bmedia.address) {
                    result.tipchain.push({
                        "type": "media",
                        "address": bmedia.address,
                        "txid": bmedia.txid
                    });
                    break;
                }
            }
        }
    }

    return result;
}


function processCategoryResult(result, existing, txpool) {
    if (result.action == "create") {
        const obj = result.change;

        if (obj.description) {
            const markdown = new markdownit();
            obj.rendered_description = markdown.renderInline(obj.description);
        }

        const result_tip = {"address": result.address, txid: result.txid, "type": "category"};

        var tipchain = [
            {"address": OPENDIR_TIP_ADDRESS, "name": "Open Directory", "type": "opendirectory"},
            result_tip,
        ];

        if (result.action_id) {
            obj.category = result.action_id;

            const category = findObjectByTX(obj.category, existing);
            if (category && category.tipchain) {
                tipchain = category.tipchain.concat([result_tip]);
            }
        }

        obj.tipchain = tipchain;

        obj.type = result.type;
        obj.txid = result.txid;
        obj.address = result.address;
        obj.height = result.height;
        obj.time = result.time;
        obj.satoshis = result.satoshis;
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

function processEntryResult(result, existing, txpool) {
    if (result.action == "create") {
        const obj = result.change;

        if (obj.description) {
            const markdown = new markdownit();
            obj.rendered_description = markdown.renderInline(obj.description);
        }

        const result_tip = {address: result.address, txid: result.txid, type: "entry"};
        var tipchain = [
            {"address": OPENDIR_TIP_ADDRESS, "name": "Open Directory"},
            result_tip,
        ];

        if (result.action_id) {
            obj.category = result.action_id;

            const category = findObjectByTX(obj.category, existing);
            if (category && category.tipchain) {
                tipchain = category.tipchain.concat([result_tip]);
            }
        }

        obj.tipchain = tipchain;

        obj.type = result.type;
        obj.txid = result.txid;
        obj.address = result.address;
        obj.height = result.height;
        obj.time = result.time;
        obj.satoshis = result.satoshis;
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

function processVoteResult(result, existing, txpool) {
    const obj = findObjectByTX(result.action_id, existing);
    if (obj) {
        obj.votes += 1;
        obj.satoshis += result.satoshis;
    } else {
        console.log("couldn't find object for vote", obj, result);
    }
    return existing;
}

function processResult(result, existing, txpool, undo) {
    if (undo.indexOf(result.txid) !== -1) {
        return existing;
    }

    switch (result.type) {
        case "category":
            return processCategoryResult(result, existing, txpool, undo);
        case "entry":
            return processEntryResult(result, existing, txpool, undo);
        case "vote":
            return processVoteResult(result, existing, txpool, undo);
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
        "calculateTipchainSplits": calculateTipchainSplits,
        "calculateTipPayment": calculateTipPayment,
        "OPENDIR_TIP_ADDRESS": OPENDIR_TIP_ADDRESS,
        "OPENDIR_TIP_AMOUNT": OPENDIR_TIP_AMOUNT,
        "OPENDIR_TIP_CURRENCY": OPENDIR_TIP_CURRENCY,
        "OPENDIR_PROTOCOL": OPENDIR_PROTOCOL,
        "OPENDIR_ACTIONS": OPENDIR_ACTIONS,
    };
}
