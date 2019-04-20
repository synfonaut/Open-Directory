
var axios = require('axios')
const root_category_id = null;
//const root_category_id = "f7f43cfa064e754f3a84c945222f08b04fb8a70ebef0061da2d8ac85df2ac7c1";
var query = {
    "v": 3,
    "q": {
        "db": ["u", "c"],
        "aggregate": [
            {
                "$match": {
                    "$and": [
                        {"out.s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi"},
                    ]
                }
            },
            { "$graphLookup": { "from": "c", "startWith": "$out.s6", "connectFromField": "out.s6", "connectToField": "tx.h", "as": "confirmed_category" } },
            { "$graphLookup": { "from": "u", "startWith": "$out.s6", "connectFromField": "out.s6", "connectToField": "tx.h", "as": "unconfirmed_category" } },
            { "$lookup": { "from": "c", "localField": "tx.h", "foreignField": "out.s3", "as": "confirmed_votes" } },
            { "$lookup": { "from": "u", "localField": "tx.h", "foreignField": "out.s3", "as": "unconfirmed_votes" } },
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
            { "$project": { "_id": 0, } },
            { "$addFields": { "_id": "$tx.h", } },
            { "$group": { "_id": null, "items": { $addToSet: "$$ROOT" } } },
            { "$unwind": "$items" },
            { "$replaceRoot": { newRoot: "$items" } },
            { "$sort": { "blk.i": 1 } },
        ]
    },
    "r": {
        "f": "[.[] | {\"height\": .blk.i, \"address\": .in[0].e.a, \"txid\": .tx.h, \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}] | reverse"
    },
};

if (root_category_id) {
    query["q"]["aggregate"][0]["$match"]["$and"].push({
        "$or": [
            {"tx.h": root_category_id},
            {"out.s6": root_category_id},
        ]
    });
} else {
    query["q"]["aggregate"][0]["$match"]["$and"].push({
        "$or": [
            {"tx.h": root_category_id},
            {"out.s5": {"$ne": "category"}}, // TODO: need protocol change because votes aren't filtering and s5 isn't stable
        ]
    });
}

console.log(query);

var s = JSON.stringify(query);
var b64 = Buffer.from(s).toString('base64');
var url = "https://bitomation.com/q/1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z/" + b64;
//var url = "https://genesis.bitdb.network/q/1FnauZ9aUH2Bex6JzdcV4eNX7oLSSEbxtN/" + b64;

var header = {
  headers: { key: "1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z" }
};

axios.get(url, header).then(function(r) {
    //console.log("Fetched: ", r);

    var items = {};
    const rows = r.data.c.concat(r.data.u);
    for (const row of rows) {
        if (!items[row.txid] || (row.height && items[row.txid] && !items[row.txid].height)) {
            items[row.txid] = row;
        }
    }

    const unique = Object.values(items);
    const final = unique.sort(function(a, b) {
        if (a.height < b.height) { return 1; }
        if (a.height > b.height) { return -1; }
        return 0;
    });

    var idx = 1;
    for (const row of final) {
        console.log("#" + idx++);
        console.log(JSON.stringify(row, null, 4));
        console.log("=".repeat(80));
    }
    console.log("Found " + final.length + " total rows");
})
