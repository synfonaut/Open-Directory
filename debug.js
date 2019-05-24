var axios = require('axios')
var query = {
    "v": 3,
    "q": {
        "db": [
            "u",
            "c"
        ],
        "limit": 500,
        "sort": {
            "txid": 1
        },
        "aggregate": [
            {
                "$match": {
                    "$and": [
                        {
                            "out.s1": "1dirzgocAsru3SdhetQkEJraQgYTf5xQm"
                        },
                        {
                            "$or": [
                                {
                                    "$and": [
                                        {
                                            "out.s2": "fork.soft"
                                        },
                                        {
                                            "out.s4": null
                                        }
                                    ]
                                },
                                {
                                    "$and": [
                                        {
                                            "out.s2": "category.create"
                                        },
                                        {
                                            "out.s3": "name"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            },
            {
                "$graphLookup": {
                    "from": "c",
                    "startWith": "$tx.h",
                    "connectFromField": "tx.h",
                    "connectToField": "out.s3",
                    "as": "confirmed_children",
                    "maxDepth": 5
                }
            },
            {
                "$project": {
                    "confirmed_children": "$confirmed_children",
                    "object": [
                        "$$ROOT"
                    ]
                }
            },
            {
                "$project": {
                    "object.confirmed_children": 0
                }
            },
            {
                "$project": {
                    "items": {
                        "$concatArrays": [
                            "$object",
                            "$confirmed_children"
                        ]
                    }
                }
            },
            {
                "$unwind": {
                    "path": "$items",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$replaceRoot": {
                    "newRoot": "$items"
                }
            },
            {
                "$graphLookup": {
                    "from": "u",
                    "startWith": "$tx.h",
                    "connectFromField": "tx.h",
                    "connectToField": "out.s3",
                    "as": "unconfirmed_children",
                    "maxDepth": 5
                }
            },
            {
                "$project": {
                    "unconfirmed_children": "$unconfirmed_children",
                    "object": [
                        "$$ROOT"
                    ]
                }
            },
            {
                "$project": {
                    "object.unconfirmed_children": 0
                }
            },
            {
                "$project": {
                    "items": {
                        "$concatArrays": [
                            "$object",
                            "$unconfirmed_children"
                        ]
                    }
                }
            },
            {
                "$unwind": {
                    "path": "$items",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$replaceRoot": {
                    "newRoot": "$items"
                }
            },
            {
                "$graphLookup": {
                    "from": "c",
                    "startWith": "$out.s3",
                    "connectFromField": "out.s3",
                    "connectToField": "tx.h",
                    "as": "confirmed_parent"
                }
            },
            {
                "$project": {
                    "confirmed_parent": "$confirmed_parent",
                    "object": [
                        "$$ROOT"
                    ]
                }
            },
            {
                "$project": {
                    "object.confirmed_parent": 0
                }
            },
            {
                "$project": {
                    "items": {
                        "$concatArrays": [
                            "$object",
                            "$confirmed_parent"
                        ]
                    }
                }
            },
            {
                "$unwind": {
                    "path": "$items",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$replaceRoot": {
                    "newRoot": "$items"
                }
            },
            {
                "$graphLookup": {
                    "from": "u",
                    "startWith": "$out.s3",
                    "connectFromField": "out.s3",
                    "connectToField": "tx.h",
                    "as": "unconfirmed_parent"
                }
            },
            {
                "$project": {
                    "unconfirmed_parent": "$unconfirmed_parent",
                    "object": [
                        "$$ROOT"
                    ]
                }
            },
            {
                "$project": {
                    "object.unconfirmed_parent": 0
                }
            },
            {
                "$project": {
                    "items": {
                        "$concatArrays": [
                            "$object",
                            "$unconfirmed_parent"
                        ]
                    }
                }
            },
            {
                "$unwind": {
                    "path": "$items",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$replaceRoot": {
                    "newRoot": "$items"
                }
            },
            {
                "$addFields": {
                    "b_txid": [
                        {
                            "txid": {
                                "$arrayElemAt": [
                                    {
                                        "$split": [
                                            {
                                                "$arrayElemAt": [
                                                    "$out.s7",
                                                    0
                                                ]
                                            },
                                            "bit://19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut/"
                                        ]
                                    },
                                    1
                                ]
                            }
                        },
                        {
                            "txid": {
                                "$arrayElemAt": [
                                    {
                                        "$split": [
                                            {
                                                "$arrayElemAt": [
                                                    "$out.s7",
                                                    0
                                                ]
                                            },
                                            "b://"
                                        ]
                                    },
                                    1
                                ]
                            }
                        },
                        {
                            "txid": {
                                "$arrayElemAt": [
                                    {
                                        "$split": [
                                            {
                                                "$arrayElemAt": [
                                                    "$out.s7",
                                                    0
                                                ]
                                            },
                                            "bit://15DHFxWZJT58f9nhyGnsRBqrgwK4W6h4Up/"
                                        ]
                                    },
                                    1
                                ]
                            }
                        },
                        {
                            "txid": {
                                "$arrayElemAt": [
                                    {
                                        "$split": [
                                            {
                                                "$arrayElemAt": [
                                                    "$out.s7",
                                                    0
                                                ]
                                            },
                                            "bcat://"
                                        ]
                                    },
                                    1
                                ]
                            }
                        }
                    ]
                }
            },
            {
                "$lookup": {
                    "from": "c",
                    "localField": "b_txid.txid",
                    "foreignField": "tx.h",
                    "as": "confirmed_bmediatx"
                }
            },
            {
                "$project": {
                    "confirmed_bmediatx": "$confirmed_bmediatx",
                    "object": [
                        "$$ROOT"
                    ]
                }
            },
            {
                "$project": {
                    "object.confirmed_bmediatx": 0,
                    "object.b_txid": 0
                }
            },
            {
                "$project": {
                    "confirmed_bmediatx.tx": 1,
                    "confirmed_bmediatx.blk": 1,
                    "confirmed_bmediatx.in": 1,
                    "confirmed_bmediatx.out.s1": 1,
                    "confirmed_bmediatx.out.e": 1,
                    "object": 1
                }
            },
            {
                "$project": {
                    "items": {
                        "$concatArrays": [
                            "$object",
                            "$confirmed_bmediatx"
                        ]
                    }
                }
            },
            {
                "$unwind": {
                    "path": "$items",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$replaceRoot": {
                    "newRoot": "$items"
                }
            },
            {
                "$lookup": {
                    "from": "u",
                    "localField": "b_txid.txid",
                    "foreignField": "tx.h",
                    "as": "unconfirmed_bmediatx"
                }
            },
            {
                "$project": {
                    "unconfirmed_bmediatx": "$unconfirmed_bmediatx",
                    "object": [
                        "$$ROOT"
                    ]
                }
            },
            {
                "$project": {
                    "object.unconfirmed_bmediatx": 0,
                    "object.b_txid": 0
                }
            },
            {
                "$project": {
                    "unconfirmed_bmediatx.tx": 1,
                    "unconfirmed_bmediatx.blk": 1,
                    "unconfirmed_bmediatx.in": 1,
                    "unconfirmed_bmediatx.out.s1": 1,
                    "unconfirmed_bmediatx.out.e": 1,
                    "object": 1
                }
            },
            {
                "$project": {
                    "items": {
                        "$concatArrays": [
                            "$object",
                            "$unconfirmed_bmediatx"
                        ]
                    }
                }
            },
            {
                "$unwind": {
                    "path": "$items",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$replaceRoot": {
                    "newRoot": "$items"
                }
            },
            {
                "$project": {
                    "_id": 0
                }
            },
            {
                "$addFields": {
                    "_id": "$tx.h"
                }
            },
            {
                "$group": {
                    "_id": null,
                    "items": {
                        "$addToSet": "$$ROOT"
                    }
                }
            },
            {
                "$unwind": {
                    "path": "$items"
                }
            },
            {
                "$replaceRoot": {
                    "newRoot": "$items"
                }
            },
            {
                "$skip": 0
            }
        ]
    },
    "r": {
        "f": "[.[] | {                                  \"height\": .blk.i?,                        \"time\": .blk.t?,                        \"address\": .in[0].e.a,                    \"outputs\": [.out[] | {\"address\": .e.a, \"sats\": .e.v}],                 \"txid\": .tx.h,                            \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}]"
    }
};
var s = JSON.stringify(query);
var b64 = Buffer.from(s).toString('base64');
var url = "https://bitomation.com/query/" + b64;

var header = {
  headers: { key: "1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z" }
};

axios.get(url, header).then(function(r) {
  console.log("Fetched: ", r.data)
  console.log("Fetched: ", JSON.stringify(r.data))
})
