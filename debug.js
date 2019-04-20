// got some issues to solve

var axios = require('axios')
//const root_category_id = "f7f43cfa064e754f3a84c945222f08b04fb8a70ebef0061da2d8ac85df2ac7c1";
const root_category_id = "690ca39d57b57c18b83a30bb285b09fe23db989b1f9cf520dc739b2c128488fa";
var query = {
    "v": 3,
    "q": {
        "aggregate": [
            {
                "$match": {
                    "$and": [
                        // find open dir protocol
                        {"out.s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi"},
                        {
                            // along with either category_id or object that refernces category_id
                            "$or": [
                                {"tx.h": root_category_id},
                                {"out.s6": root_category_id},
                            ]
                        }
                    ]
                }
            },
            {
                "$graphLookup": {
                    "from": "c",
                    "startWith": "$out.s6",
                    "connectFromField": "out.s6",
                    "connectToField": "tx.h",
                    "as": "confirmed_category"
                }
            },
            {
                "$lookup": {
                    "from": "c",
                    "localField": "tx.h",
                    "foreignField": "out.s3",
                    "as": "confirmed_votes"
                }
            },
            {
                "$graphLookup": {
                    "from": "u",
                    "startWith": "$out.s6",
                    "connectFromField": "out.s6",
                    "connectToField": "tx.h",
                    "as": "unconfirmed_category"
                }
            },
            {
                "$lookup": {
                    "from": "u",
                    "localField": "tx.h",
                    "foreignField": "out.s3",
                    "as": "unconfirmed_votes"
                }
            },
            {
                "$project": {
                    "confirmed_category": "$confirmed_category",
                    "confirmed_votes": "$confirmed_votes",
                    "unconfirmed_category": "$unconfirmed_category",
                    "unconfirmed_votes": "$unconfirmed_votes",
                    "object": ["$$ROOT"],
                }
            },
            {
                "$project": {
                    "object.confirmed_category": 0,
                    "object.confirmed_votes": 0,
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
                            "$unconfirmed_category",
                            "$unconfirmed_votes"
                        ]
                    }
                }
            },
            { "$unwind": "$items" },
            { "$replaceRoot": { newRoot: "$items" } },
            { "$group": { "_id": null, "items": { $addToSet: "$$ROOT" } } },
            { "$unwind": "$items" },
            { "$replaceRoot": { newRoot: "$items" } },
            { "$sort": { "blk.i": 1 } },
            {
                "$project": {
                    "_id": "$_id",
                    "item": "$$ROOT",
                }
            },
            { "$group": {_id: "$_id", "items": {$push: "$item"}}},
            { "$unwind": "$items" },
            { "$replaceRoot": { newRoot: "$items" } },

            // PROBLEM IS INNER DOCUMENTS HAVE WRONG IDS?

            /*
            { "$group": { "_id": "$tx.h", "items": { $addToSet: "$$ROOT" } } },
            { "$addFields": { "_id": "$tx.h" }},
            */
            //{ "$unwind": "$items" },
            //{ "$replaceRoot": { newRoot: "$items" } },

        ]
    },
//    "r": {
//        "f": "[.[] | {\"height\": .blk.i, \"address\": .in[0].e.a, \"txid\": .tx.h, \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}] | reverse"
//    },
};

var s = JSON.stringify(query);
var b64 = Buffer.from(s).toString('base64');
var url = "https://bitomation.com/q/1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z/" + b64;
//var url = "https://genesis.bitdb.network/q/1FnauZ9aUH2Bex6JzdcV4eNX7oLSSEbxtN/" + b64;

var header = {
  headers: { key: "1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z" }
};

axios.get(url, header).then(function(r) {
    console.log("Fetched: ", r);
    const items = r.data.c.concat(r.data.u);
    var idx = 1;
    for (const row of items) {
        console.log("#" + idx++);
        console.log(JSON.stringify(row, null, 4));
        console.log("=".repeat(80));
    }
    console.log("Found " + items.length + " total rows");
})
