const process = require("../public/static/js/process.js");

const category_id = "ad2e542563f3b6b3a9cbb3a44c52a9f5fa6c95462534e7efc737d05efcfd3481";
const socket = process.connect_to_bitdb_socket(category_id, (rows) => {
    console.log("got new rows", JSON.stringify(rows, null, 4));
});

// TODO: On disconnect, reconnect

