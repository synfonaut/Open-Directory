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
            const responses = response.c.concat(response.u);
            const sorted = responses.sort(function(a, b) {
                return (a.height===null)-(b.height===null) || +(a.height>b.height) || -(a.height<b.height);
            });
            const updates = sorted.map(update => {
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

// TODO: Convert this to admin process and process admin commands (detatch)
function fetchUpdates() {
    const query = {
        "v": 3,
        "q": {
            "find": {
                "out.s1": OPENDIR_ADMIN_ADDRESS,
                "out.s2": "uri",
                "in.e.a": OPENDIR_ADMIN_ADDRESS,
            },
            "limit": 9999 // can eventually do paging here if necessary, admin log should stay small though
        },
        "r": {
            "f": "[.[] | {\"height\": .blk.i, \"address\": .in[0].e.a, \"txid\": .tx.h, \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}]"
        }
    };

    const encoded_query = toBase64(JSON.stringify(query));
    const api_url = SETTINGS["api_endpoint"].replace("{api_key}", SETTINGS.api_key).replace("{api_action}", "q");;
    const url = api_url.replace("{query}", encoded_query);
    const header = { headers: { key: SETTINGS.api_key } };

    return new Promise((resolve, reject) => {
        fetch(url, header).then(function(r) {
            console.log("R", r);
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
