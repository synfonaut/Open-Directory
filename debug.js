// TODO: How to create parent tip chain? graphLookup?
var axios = require('axios')
const root_category_id = "f7f43cfa064e754f3a84c945222f08b04fb8a70ebef0061da2d8ac85df2ac7c1";
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
                "$lookup": {
                    "from": "c",
                    "localField": "out.s6",
                    "foreignField": "tx.h",
                    "as": "category"
                }
            },
            {
                "$lookup": {
                    "from": "c",
                    "localField": "tx.h",
                    "foreignField": "out.s3",
                    "as": "votes"
                }
            },
            {
                "$project": {
                    "category": "$category",
                    "votes": "$votes",
                    "object": ["$$ROOT"],
                }
            },
            {
                "$project": {
                    "object.category": 0,
                    "object.votes": 0,
                }
            },
            {
                "$project": {
                    "items": {
                        "$concatArrays": ["$category", "$object", "$votes"]
                    }
                }
            },
            { "$unwind": "$items" },
            { "$replaceRoot": { newRoot: "$items" } },
            { "$group": { "_id": "$_id", "items": { $addToSet: "$$ROOT" } } },
            { "$unwind": "$items" },
            { "$replaceRoot": { newRoot: "$items" } },
            { "$sort": { "blk.i": 1 } },
        ]
    },
    "r": {
        "f": "[.[] | {\"height\": .blk.i, \"address\": .in[0].e.a, \"txid\": .tx.h, \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}] | reverse"
    },
};

var s = JSON.stringify(query);
var b64 = Buffer.from(s).toString('base64');
var url = "https://bitomation.com/q/1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z/" + b64;

var header = {
  headers: { key: "1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z" }
};

axios.get(url, header).then(function(r) {
    console.log("Fetched: ", r);
    var idx = 1;
    for (const row of r.data.c) {
        console.log("#" + idx++);
        console.log(JSON.stringify(row, null, 4));
        console.log("=".repeat(80));
    }
    console.log("Found " + r.data.c.length + " total rows");
})
