import { toBase64, findObjectByTX } from "./helpers";
import SETTINGS from "./settings";

var isNode = (typeof window == "undefined");

if (isNode) {
    var axios = require("axios");
}

export const B_MEDIA_PROTOCOL = "19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut";
export const BCAT_MEDIA_PROTOCOL = "15DHFxWZJT58f9nhyGnsRBqrgwK4W6h4Up";

const API_URL = "https://dir.sv/api";
//const API_URL = "http://localhost:3000/api";

export const SUPPORTED_TIPCHAIN_PROTOCOLS = [
    "bit://" + B_MEDIA_PROTOCOL + "/",
    "b://",
    "bit://" + BCAT_MEDIA_PROTOCOL + "/",
    "https://bico.media/",
    "https://www.bitpaste.app/tx/",
    "https://memo.sv/post/",
    "https://dir.sv/category/",
    "https://dir.sv/link/",
    "https://bitstagram.bitdb.network/m/raw/",
    "https://www.audiob.app/tx/",
];

// Open Directory Bitcom Protocol
export const OPENDIR_PROTOCOL = "1dirzgocAsru3SdhetQkEJraQgYTf5xQm";

// Allowed actions
export const OPENDIR_ACTIONS = [
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

export function get_root_category_txid() {
    if (SETTINGS.category) {
        return SETTINGS.category;
    }

    return null;
}

export function get_txids_query(txids, cursor=0, limit=5000) {
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
                \"data\": .out[0] | with_entries( select(  (((.key | startswith(\"s\")) or (.key | startswith(\"ls\"))) and (.key != \"str\"))  )  )}]"
        }
    }

    return query;
}

export function get_bitdb_query(cursor=0, limit=1000) {

    const query = {
        "v": 3,
        "q": {
            "find": {
                "$or": [
                    {"out.s1": OPENDIR_PROTOCOL},
                    {"out.s2": OPENDIR_PROTOCOL},
                ],
            },

            // querying both confirmed and unconfirmed transactions
            // mongodb doesn't have a clean way to join on both so nearly every query below is doubled, on for each db
            "db": ["u", "c"],

            "limit": limit,
            "skip": cursor,

            // need sort here so cursor is consistent
            "sort": {
                "txid": 1
            }
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
                \"data\": .out[0] | with_entries( select(  (((.key | startswith(\"s\")) or (.key | startswith(\"ls\"))) and (.key != \"str\"))  )  )}]"
        }
    };

    return query;
}


export function fetch_from_network(category_id=null) {

    if (category_id == null) {
        category_id = get_root_category_txid();
    }

    const url = API_URL + "/category/" + category_id;
    const header = {};

    function handleResponse(resolve, reject, r) {
        if (r.slice && r.slice.length > 0) {
            resolve(r);
        } else {
            resolve([]);
        }
    }

    return new Promise((resolve, reject) => {

        console.log("Making HTTP request to server");
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

export function fetch_homepage_from_network(type="links", sort="hot") {

    const url = API_URL + "/homepage/?type=" + type + "&sort=" + sort;
    const header = { };
    //console.log("URL", url);

    function handleResponse(resolve, reject, r) {
        if (r.slice && r.slice.length > 0) {
            resolve(r.slice);
        } else {
            resolve([]);
        }
    }

    return new Promise((resolve, reject) => {

        console.log("Making HTTP request to server");
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

export function fetch_changelog_from_network(category_id=null, cursor) {

    if (category_id == null) {
        category_id = get_root_category_txid();
    }

    const url = API_URL + "/changelog/" + category_id + "/?cursor=" + cursor;
    const header = {};
    //console.log("URL", url);

    function handleResponse(resolve, reject, r) {
        if (r.changelog && r.changelog.length > 0) {
            resolve(r.changelog);
        } else {
            resolve([]);
        }
    }

    return new Promise((resolve, reject) => {

        console.log("Making HTTP request to server");
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

export function fetch_search_from_network(search, category_id=null) {

    if (category_id == null) {
        category_id = get_root_category_txid();
    }

    const url = API_URL + "/search/?query=" + encodeURI(search) + "&category_id=" + category_id;
    const header = {};
    //console.log("URL", url);

    function handleResponse(resolve, reject, r) {
        if (r.results && r.results.length > 0) {
            resolve(r.results);
        } else {
            resolve([]);
        }
    }

    return new Promise((resolve, reject) => {

        console.log("Making HTTP request to server");
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

export function fetch_txids_from_network(txids, limit=75, results=[]) {
    return new Promise((resolve, reject) => {
        const txid_chunks = chunk(txids, limit);
        const actions = txid_chunks.map(chunk => {
            return fetch_txids_batch_from_network(chunk);
        });

        Promise.all(actions).then(results => {
            var all = [];
            for (const result of results) {
                all = all.concat(result);
            }

            resolve(all);
        });
    });
}

export function fetch_txids_batch_from_network(txids) {

    const query = get_txids_query(txids);
    const encoded_query = toBase64(JSON.stringify(query));
    const api_url = SETTINGS.api_endpoint.replace("{api_key}", SETTINGS.api_key).replace("{api_action}", "q");;
    const url = api_url.replace("{query}", encoded_query);
    //console.log("fetching", url);
    const header = { headers: { key: "1A4xFjNatCgAK5URARbVwoxo1E3MCMETb6" } };

    function handleResponse(resolve, reject, r) {
        if (r.errors) {
            reject("error during query " + r.errors);
            return;
        }

        var items = {};
        const rows = r.c.concat(r.u).reverse();

        resolve(rows);
    }

    return new Promise((resolve, reject) => {
        console.log("Making genesis txid HTTP request to server");
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
export function processOpenDirectoryTransactions(results) {
    return results.map(processOpenDirectoryTransaction).filter(r => { return r });
}

// find all children of an object that perform an action on it
export function findChildrenByActionID(obj, results=[]) {

    var children = [];
    for (const result of results) {
        if (result.action_id == obj.txid) {
            const subchildren = findChildrenByActionID(result, results);
            children = children.concat([result], subchildren);
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

export function processRawResults(rows) {
    const txpool = processOpenDirectoryTransactions(rows);
    return processResults(rows, txpool);
}

export function processResults(rows, txpool) {
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
    const process_pipeline = [updateCategoryEntryCounts, updateCategoryMoneyCounts, updateHottness];
    for (const fn of process_pipeline) {
        processing = fn(processing);
    }

    console.log("PROCESSING", processing.length);

    return processing;
}

function updateHottness(results) {
    return results.map(result => {
        if (result.type == "entry" || result.type == "category") {
            result.hottness = calculateHottness(result);
        }
        return result;
    });
}

// Hacker News score algorithm, thanks https://medium.com/hacking-and-gonzo/how-hacker-news-ranking-algorithm-works-1d9b0cf2c08d
function calculateHottness(result, gravity=1.8) {
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
    for (const tx of txpool.filter(tx => { return tx.type == "other" || tx.type == "category" || tx.type == "entry" })) {
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
            console.log("couldn't find category for update", obj, result);
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

function parseTXIDFromLink(link) {
    for (const protocol of SUPPORTED_TIPCHAIN_PROTOCOLS) {
        const bmedia_parts = link.split(protocol);
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
                    //console.log("unable to find associated b media for item", item.txid, "media txid", bmedia_txid);
                }
            }
        }
    }
    return null;
}

function updateCategoryMoneyCounts(items) {
    const root_categories = items.filter(i => { return i.type == "category" && !i.category });
    for (const category of root_categories) {
        category.satoshis = updateMoneyCountUnderObject(category, items);
        category.votes = updateVoteCountUnderObject(category, items);
    }

    return items;
}

function updateMoneyCountUnderObject(obj, items) {
    var amount = obj.satoshis;
    for (const item of items) {
        if (obj.txid == item.txid) { continue }
        if (!item.deleted && item.category == obj.txid) {
            if (item.type == "category") {
                item.satoshis = updateMoneyCountUnderObject(item, items);
            }
            amount += item.satoshis;
        }
    }

    obj.satoshis = amount;
    return amount;
}

function updateVoteCountUnderObject(obj, items) {
    var amount = obj.votes;
    for (const item of items) {
        if (obj.txid == item.txid) { continue }
        if (!item.deleted && item.category == obj.txid) {
            if (item.type == "category") {
                item.votes = updateVoteCountUnderObject(item, items);
            }

            amount += item.votes;
        }
    }

    obj.votes = amount;
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

export function expandTipchainInformation(tipchain, tipAmount=0, results=[]) {
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

export function calculateTipchainSplits(tipchain) {

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

export function calculateTipPayment(tipchain, amount, currency) {

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
        console.log("MISSING DATA", result.txid, result.address, result.data, result);
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
        return {
            txid: result.txid,
            address: result.address,
            height: height,
            time: time,
            type: "other",
        };
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

            if (obj.change.link) {
                const bmedia_txid = parseTXIDFromLink(obj.change.link);
                if (bmedia_txid) {
                    obj.bmedia_txid = bmedia_txid;
                }
            }
        } else if (item_action == "update") {
            obj.action_id = args.shift();
            obj.change = convertKeyValues(args);

            if (obj.change.link) {
                const bmedia_txid = parseTXIDFromLink(obj.change.link);
                if (bmedia_txid) {
                    obj.bmedia_txid = bmedia_txid;
                }
            }
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
            //console.log("unknown number of args", result);
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

export function connect_to_bitdb_socket(category_id, callback) {

    const EventSource = require("eventsource");

    const query = get_bitdb_query();
    const encoded_query = toBase64(JSON.stringify(query));
    const api_url = SETTINGS["api_endpoint"].replace("{api_key}", SETTINGS.api_key).replace("{api_action}", "s");;
    const url = api_url.replace("{query}", encoded_query);
    //console.log("connecting to", url);

    function reconnect() {

        console.log("connecting to bitdb socket");

        var socket = null;

        socket = new EventSource(url);
        socket.onmessage = (e) => {
            try {
                const resp = JSON.parse(e.data);
                if ((resp.type == "c" || resp.type == "u") && (resp.data.length > 0)) {

                    const rows = [];
                    for (var i = 0; i < resp.data.length; i++) {
                        if (resp.data[i] && resp.data[i].data) {
                            rows.push(resp.data[i]);
                        }
                    }

                    if (rows.length > 0) {
                        console.log("handled new message", rows);
                        callback(rows);
                    }
                }


            } catch (e) {
                console.log("error handling network socket data", e);
                throw e;
            }
        }

        socket.onerror = (e) => {
            console.log("socket error", e);
            if (socket) {
                socket.close();
                socket = null;
            }

            reconnect();
        }

        return socket;
    }

    reconnect();
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

function findParentCategoryChain(parent_txid, results=[]) {
    for (const result of results) {
        if (result.txid == parent_txid) {
            return findParentCategoryChain(result.category, results).concat([parent_txid]);
        }
    }

    return [];
}

export function findChildrenOfParentCategory(parent_txid, results=[]) {
    if (parent_txid) {
        return results.filter(r => {
            return (r.category == parent_txid) || (r.action_id == parent_txid) || (r.reference_id == parent_txid);
        });
    } else {
        return []
    }
}

export function addNewRowsToExistingRows(new_rows, existing_rows) {
    const rows = new Map();
    for (const row of existing_rows) {
        rows.set(row.txid, row);
    }

    for (const row of new_rows) {
        rows.set(row.txid, row);
    }

    return Array.from(rows.values());
}

export function buildItemSliceRepresentationFromCache(category_id, cache=[]) {

    if (!category_id) {
        return cache;
    }

    const parent_categories = findParentCategoryChain(category_id, cache);

    const items = new Map();

    for (const txid of parent_categories) {
        const parent = findObjectByTX(txid, cache);
        items.set(txid, parent);
    }

    var txids = new Set();
    var subcategory_txids = [category_id];
    while (subcategory_txids.length > 0) {
        const txid = subcategory_txids.pop();
        txids.add(txid);

        const found_children = findChildrenOfParentCategory(txid, cache);

        for (const child of found_children) {
            if (child.type == "category") {
                subcategory_txids.push(child.txid);
            }
            txids.add(child.txid);
        }
    }

    const children = cache.filter(i => {
        if (txids.has(i.txid)) {
            return true;
        }

        if (txids.has(i.action_id)) {
            return true;
        }

        if (txids.has(i.reference_id)) {
            return true;
        }
    });

    for (const child of children) {
        items.set(child.txid, child);
    }

    return Array.from(items.values());
}

export function buildRawSliceRepresentationFromCache(category_id, changelog=[], cache=[]) {

    // So hacky..trying to hang on and scale... All of this needs to be rewritten 

    if (!changelog || changelog.length == 0) {
        return [];
    }

    if (!category_id) {
        return changelog;
    }

    const filtered_changelog = [];

    var items = buildItemSliceRepresentationFromCache(category_id, cache);

    // Grab parents first, since we don't want their children (undos, votes) we do them separate
    while (items && items.length > 0) {
        const item = items.shift();
        if (item.txid == category_id) {
            items.push(item);
            break;
        } else {
            filtered_changelog.push(findObjectByTX(item.txid, changelog));
        }
    }

    const txids = items.map(i => { return i.txid }).filter(i => { return i });
    for (const log of changelog) {
        const txid = (log.data.s1 ? log.data.s3 : log.data.s4);
        if (txids.indexOf(log.txid) !== -1) {
            filtered_changelog.push(log);
        } else if (txids.indexOf(txid) !== -1) {
            filtered_changelog.push(log);
        }
    }


    return filtered_changelog;
}

// https://medium.com/@Dragonza/four-ways-to-chunk-an-array-e19c889eac4
function chunk(array, size) {
    const chunked_arr = [];
    let copied = [...array]; // ES6 destructuring
    const numOfChild = Math.ceil(copied.length / size); // Round up to the nearest integer
    for (let i = 0; i < numOfChild; i++) {
        chunked_arr.push(copied.splice(0, size));
    }
    return chunked_arr;
}

// Given results, extend it with bmedia results
export function fetch_raw_txid_results(rows) {
    const results = processOpenDirectoryTransactions(rows);
    const already_found = new Set(results.map(r => { return r.txid }));
    const txids = new Set(results.map(r => {
        if (r.bmedia_txid) {
            if (!already_found.has(r.bmedia_txid)) {
                return r.bmedia_txid;
            }
        }
    }).filter(r => { return r }));

    console.log("fetching", txids.size, "additional bmedia txids");

    return new Promise((resolve, reject) => {
        fetch_txids_from_network(txids).then(bmedia_rows => {
            console.log("found", bmedia_rows.length, "bmedia txids");

            const all_rows = rows.concat(bmedia_rows);

            const sorted = all_rows.sort(function(a, b) {
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
        });
    });
}

export function fetch_raw_protocol_results() {
    return new Promise((resolve, reject) => {
        fetch_from_bitdb_network(null, 0, 5000, [], false).then(rows => {
            if (rows.lenth == 0) {
                reject("unable to fetch valid data from network");
            } else if (rows.length < 100) {
                reject("unable to fetch enough valid data from network");
            } else {
                console.log("successfully fetched from the network");
                resolve(rows);
            }
        }).catch(reject);
    });
}

export function fetch_raw_results() {
    return new Promise((resolve, reject) => {
        fetch_raw_protocol_results().then(results => {
            console.log("found", results.length, "raw protocol results");
            fetch_raw_txid_results(results).then(resolve);
        }).catch(e => {
            console.log("ERROR", e);
        });
    });
}

export function fetch_from_bitdb_network(category_id=null, cursor=0, limit=1000, results=[], cache=true) {

    if (category_id == null) {
        category_id = get_root_category_txid();
    }

    const query = get_bitdb_query(cursor, limit);
    const encoded_query = toBase64(JSON.stringify(query));
    const api_url = SETTINGS.api_endpoint.replace("{api_key}", SETTINGS.api_key).replace("{api_action}", "q");;
    const url = api_url.replace("{query}", encoded_query);
    //console.log("fetching", url);

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
            console.log("ROW", JSON.stringify(row, null, 4));
        }
        console.log("ROWS", rows.length);
        console.log("ROW JSON", JSON.stringify(rows, null, 4));
        throw "E";
        */

        results = results.concat(rows);
        cursor += rows.length;

        if (rows.length >= limit) {
            console.log("Seems like there's still more... polling for more");
            fetch_from_bitdb_network(category_id, cursor, limit, results, cache).then(resolve).catch(reject);
        } else {
            resolve(results);
        }
    }

    return new Promise((resolve, reject) => {

        if (cache) {
            if (typeof window.CACHED_HOMEPAGE !== "undefined") {
                resolve(window.CACHED_HOMEPAGE);
                return;
            } else {
                resolve([]);
                return;
            }
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
