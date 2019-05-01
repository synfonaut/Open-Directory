function getLatestUpdate() {
    return new Promise((resolve, reject) => {
        getUpdates().then(updates => {
            if (updates.length > 0) {
                resolve(updates[updates.length-1]);
            } else {
                reject("Error while fetching latest updates");
            }
        }).catch(reject);
    });
}

function getUpdates() {
    return new Promise((resolve, reject) => {
        fetchUpdates().then(response => {
            const updates = response.c.concat(response.u).reverse().map(update => {
                return {
                    "txid": update.txid,
                    "address": update.address,
                    "height": update.height,
                    "uri": update.data.s3
                };
            });

            resolve(updates);
        }).catch(reject);
    });
}

function fetchUpdates() {
    const query = {
        "v": 3,
        "q": {
            "find": {
                "out.s1": "18yPrJqrcoxAeGByXHaLhzVtmfb4ToQAWd",
                "out.s2": "uri",
                "in.e.a": "18yPrJqrcoxAeGByXHaLhzVtmfb4ToQAWd"
            },
            "limit": 9999
        },
        "r": {
            "f": "[.[] | {\"height\": .blk.i, \"address\": .in[0].e.a, \"txid\": .tx.h, \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}]"
        }
    };

    // TODO: Make generic
    var url = "https://bitomation.com/q/1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z/" + toBase64(JSON.stringify(query));
    var header = { headers: { key: "1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z" } };

    return new Promise((resolve, reject) => {
        fetch(url, header).then(function(r) {
            if (!r) {
                reject("Error response while checking updater");
            } else if (r.status !== 200) {
                reject("Error response status code while checking updater " + r.status);
            } else {
                resolve(r.json());
            }
        });
    });
}
