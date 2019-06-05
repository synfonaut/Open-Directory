const fs = require("fs");
require('console.mute');

const process = require("../public/static/js/process.js");


const cached_raw_file = __dirname + "/../public/static/js/cached_raw.js";
const cached_homepage_file = __dirname + "/../public/static/js/cached_homepage.js";
const cached_items_file = __dirname + "/../public/static/js/cached_items.js";

if (!fs.existsSync(cached_raw_file)) {
    throw "expected cache file to already exist...what's going on?";
}

if (!fs.existsSync(cached_items_file)) {
    throw "expected cache items file to already exist...what's going on?";
}

if (!fs.existsSync(cached_raw_file)) {
    throw "expected cache items file to already exist...what's going on?";
}


process.connect_to_bitdb_socket(null, (new_rows) => {

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

    if (!new_rows) {
        new_rows = [];
    }

    const rows = process.addNewRowsToExistingRows(new_rows, cached_rows);
    const txpool = process.processOpenDirectoryTransactions(rows);
    const results = process.processResults(rows, txpool);
    if (results.length < 100) {
        throw "Didn't process enough results on update. Something went wrong";
    }

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


