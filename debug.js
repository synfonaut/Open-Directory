var axios = require('axios')
// "f": "[.[] | {\"address\": .in[0].e.a, \"txid\": .tx.h, \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}]"
var query = {
    "v": 3,
    "q": {
        sort: { "blk.i": 1 },
        "aggregate": [
            {
                "$match": {
                    "$and": [
                        {"out.s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi"},
                        {
                            "$or": [
                                {"tx.h": "b9d323f1b16c09da37d15f5c37f95ff8fa2f9def2cb87b298d404929a58ddc3b"},
                                {"out.s6": "b9d323f1b16c09da37d15f5c37f95ff8fa2f9def2cb87b298d404929a58ddc3b"},
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
            /*
            {
                "$lookup": {
                    "from": "c",
                    "localField": "tx.h",
                    "foreignField": "out.s3",
                    "as": "votes"
                }
            },
            */
        ]
    }
};

query = {
    "v": 3,
    "q": {
        sort: { "blk.i": 1 },
        "aggregate": [
            {
                "$match": {
                    "$and": [
                        {"out.s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi"},
                        {
                            "$or": [
                                {"tx.h": "b9d323f1b16c09da37d15f5c37f95ff8fa2f9def2cb87b298d404929a58ddc3b"},
                                {"out.s6": "b9d323f1b16c09da37d15f5c37f95ff8fa2f9def2cb87b298d404929a58ddc3b"},
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
                "$project": {
                    "category": "$category",
                    "object": ["$$ROOT"],
                }
            },
            {
                "$project": {
                    "object.category": 0,
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "items": {
                        "$concatArrays": ["$category", "$object"]
                    }
                }
            },
            {
                "$unwind": "$items"
            },
            {
                "$replaceRoot": { newRoot: "$items" }
            },
        ]
    }
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
