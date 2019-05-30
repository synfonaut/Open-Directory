const fs = require("fs");
require('console.mute');

const process = require("../public/static/js/process.js");


const cached_raw_file = __dirname + "/../public/static/js/cached_raw.js";
const cached_homepage_file = __dirname + "/../public/static/js/cached_homepage.js";
const cached_items_file = __dirname + "/../public/static/js/cached_items.js";

var cached_rows = [];

try {
    let cached_raw = fs.readFileSync(cached_raw_file);
    cached_rows = JSON.parse(cached_raw);
} catch (e) {
    console.log("ERROR parsing cached items", e);
    throw e;
}

if (cached_rows.length < 500) {
    throw "ERROR ...cached items should be greater than 500";
}

if (!fs.existsSync(cached_raw_file)) {
    throw "expected cache file to already exist...what's going on?";
}

if (!fs.existsSync(cached_items_file)) {
    throw "expected cache items file to already exist...what's going on?";
}

if (!fs.existsSync(cached_raw_file)) {
    throw "expected cache items file to already exist...what's going on?";
}


const socket = process.connect_to_bitdb_socket(null, (new_rows) => {

    console.log("CACHED ROWS", cached_rows.length);

    if (!new_rows) {
        new_rows = [];
    }

    const unique_rows = [];

    const new_txids = new_rows.map(row => { return row.txid });

    for (const row of cached_rows) {
        const idx = new_txids.indexOf(row.txid);
        if (!row.height && idx !== -1) {
            unique_rows.push(new_rows[idx]);
            delete new_txids[idx];
        } else {
            unique_rows.push(row);
        }
    }

    for (const row of new_rows) {
        if (new_txids.indexOf(row.txid) !== -1) {
            unique_rows.push(row);
        }
    }

    /*
    console.mute();
    */

    const rows = unique_rows;
    const txpool = process.processOpenDirectoryTransactions(rows);
    const results = process.processResults(rows, txpool);
    if (results.length < 100) {
        return;
    }

    /*
    var data = console.resume();
    */

    const raw_output = JSON.stringify(rows);
    try {
        fs.writeFileSync(cached_raw_file, raw_output, "utf8");
    } catch (e) {
        console.log("Error writing cached raw file", cached_raw_file);
        throw e;
    }

    const homepage_output = "const CACHED_HOMEPAGE = " + JSON.stringify(rows) + ";";
    try {
        fs.writeFileSync(cached_homepage_file, homepage_output, "utf8");
    } catch (e) {
        console.log("Error writing cached homepage file", cached_homepage_file);
        throw e;
    }

    const results_output = JSON.stringify(results);
    try {
        fs.writeFileSync(cached_items_file, results_output, "utf8");
    } catch (e) {
        console.log("Error writing cached results file", cached_items_file);
        throw e;
    }

    console.log("successfully updated cache with", new_rows.length, "new rows at ", new Date(), "with", rows.length, "raw rows and", results.length, "results");

});


