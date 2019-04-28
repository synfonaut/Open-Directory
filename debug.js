const helpers = require("./public/static/js/helpers.js");

var category_id;
category_id = null;
category_id = "39d0456ae7715d0e8059fa116f0c79a9b3f4e1f7a037492e0a85cada4a373052";
helpers.fetch_from_network(category_id).then(rows => {
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

