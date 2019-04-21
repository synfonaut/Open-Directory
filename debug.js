const helpers = require("./public/static/js/helpers.js");

helpers.fetch_from_network().then(rows => {
    console.log("found " + rows.length + " total rows");
    var idx = 1;
    for (const row of rows) {
        console.log("#" + idx++);
        console.log(JSON.stringify(row, null, 4));
        console.log("=".repeat(80));
    }
}).catch(e => {
    console.log("error", e);
});

//fetch_page_from_network("f7f43cfa064e754f3a84c945222f08b04fb8a70ebef0061da2d8ac85df2ac7c1");

