const ALLOWED_ACTIONS = [
    "uri",
    "attach",
    "detach",
];

function fetchAdminActions(admin_address) {

    const query = {
        "v": 3,
        "sort": {
            "txid": 1
        },
        "q": {
            "find": {
                "out.s1": admin_address,
                "in.e.a": admin_address,
            },
            "limit": 9999 // can eventually do paging here if necessary, admin log should stay small though
        },
        "r": {
            "f": "[.[] | {                  \
                \"height\": .blk.i?,        \
                \"time\": .blk.t?,        \
                \"address\": .in[0].e.a,    \
                \"txid\": .tx.h,            \
                \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}]"
        }
    };

    const encoded_query = toBase64(JSON.stringify(query));
    const api_url = SETTINGS["api_endpoint"].replace("{api_key}", SETTINGS.api_key).replace("{api_action}", "q");;
    const url = api_url.replace("{query}", encoded_query);
    const header = { headers: { key: SETTINGS.api_key } };

    return new Promise((resolve, reject) => {
        if (!admin_address) {
            reject("invalid admin address");
            return;
        }

        console.log("Fetching admin actions for admin protocol", admin_address);

        fetch(url, header).then(function(r) {
            if (!r) {
                reject("Error response while checking updater");
            } else if (r.status !== 200) {
                reject("Error response status code while checking updater " + r.status);
            } else {
                r.json().then(data => {
                    const results = data.c.concat(data.u);
                    const sorted = results.sort(function(a, b) {
                        return (a.height===null)-(b.height===null) || +(a.height>b.height) || -(a.height<b.height);
                    });

                    console.log("SORTED", data);

                    resolve(sorted);
                });
            }
        });
    });
}

function getCachedAdminActions(cache_mins=0) { // TODO: Re-cache
    return new Promise((resolve, reject) => {
        const now = (new Date()).getTime();

        const cache_key = "admin_actions_" + OPENDIR_ADMIN_ADDRESS;
        const cache = lscache.get(cache_key);
        if (cache) {
            console.log("Found cached admin actions for", OPENDIR_ADMIN_ADDRESS);
            return resolve(cache);
        }

        fetchAdminActions(OPENDIR_ADMIN_ADDRESS).then(results => {
            if (results) {
                lscache.set(cache_key, results, cache_mins);
            }

            resolve(results);
        }).catch(reject);
    });
}

function processAdminResult(result) {
    const action = result.data.s2;

    if (ALLOWED_ACTIONS.indexOf(action) == -1) {
        return null;
    }

    const object = {
        "type": "admin",
        "height": result.height,
        "address": result.address,
        "txid": result.txid,
        "time": result.time,
        "action": action,
        "data": result.data,
    }

    if (action == "uri") {
        const uri = result.data.s3;
        object.uri = uri;
    } else if (action == "attach" || action == "detach") {
        object.action_id = result.data.s3;
    }

    return object;
}

function processAdminResults(results) {
    return results.map(processAdminResult).filter(r => { return r });
}

function fetchLog() {
    return new Promise((resolve, reject) => {
        getCachedAdminActions().then(results => {
            resolve(processAdminResults(results));
        }).catch(reject);
    });
}

function fetchURIs() {
    return new Promise((resolve, reject) => {
        getCachedAdminActions().then(raw => {
            const results = processAdminResults(raw);
            const uris = results.filter(r => { return r.action == "uri" });
            resolve(uris);
        }).catch(reject);
    });
}

function fetchAttachAndDetaches() {
    return new Promise((resolve, reject) => {
        getCachedAdminActions().then(raw => {
            const results = processAdminResults(raw);
            const filtered = results.filter(r => { return r.action == "attach" || r.action == "detach" });
            resolve(filtered);
        }).catch(reject);
    });
}

function getLatestUpdate() {
    return new Promise((resolve, reject) => {
        return fetchURIs().then(actions => {
            if (actions && actions.length > 0) {
                resolve(actions[actions.length-1]);
            }
        });
    });
}

