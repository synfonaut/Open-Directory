export function updateBitcoinSVPrice() {
    // check if we have a cached version

    const storage = window.localStorage;
    const cache = storage["bsv_price_cache"];
    if (cache) {
        try {
            const obj = JSON.parse(cache);
            const price = obj.price;
            const date = obj.date;

            if (price && date) {
                const now = (new Date()).getTime();
                const diff = now - date;
                const MAX_CACHE_SECONDS = 60 * 60 * 12; // update every 12 hours

                window.BSV_PRICE = price; // set cached price—better than nothing

                if (diff < MAX_CACHE_SECONDS * 1000) {
                    console.log("Using cached Bitcoin SV price of", price);
                    return;
                } else {
                    console.log("Bitcoin SV price cache is old....updating");
                }
            }
        } catch (e) {
            console.log("Error parsing Bitcoin SV price cache", e);
        }
    }

    getLatestBitcoinSVPrice().then(price => {
        if (price > 0) {
            console.log("Updating BSV price from", window.BSV_PRICE, "to", price);
            window.BSV_PRICE = price;
            storage["bsv_price_cache"] = JSON.stringify({
                "price": price,
                "date": (new Date()).getTime()
            });
        }
    }).catch(e => {
        console.log("Error while fetching BSV price", e);
    });
}

function getLatestBitcoinSVPrice() {
    return new Promise((resolve, reject) => {
        getBitcoinSVPriceFromCoinGecko().then(resolve).catch(e => {
            console.log("Error while fetching BSV price", e);
            getBitcoinSVPriceFromCryptonator().then(resolve).catch(e => {
                console.log("Error while fetching BSV price", e);
                getBitcoinSVPriceFromCoinMarketCap().then(resolve).catch(reject);
            });
        });
    });
}

function getBitcoinSVPriceFromCoinMarketCap() {
    const url = "https://cors-anywhere.herokuapp.com/https://api.coinmarketcap.com/v1/ticker/bitcoin-sv/";
    return new Promise((resolve, reject) => {
        fetch(url).then(function(r) {
            if (r.status !== 200) {
                reject("Error while retrieving response from CoinMarketCap server " + r.status);
                return;
            }
            return r.json();
        }).then(data => {
            for (const result of data) {
                if (result["id"] == "bitcoin-sv") {
                    const price = Number(result.price_usd);
                    if (price > 0) {
                        resolve(price);
                        return;
                    }
                }
            }

            reject("Error while parsing response from CoinMarketCap price API");
        }).catch(reject);
    });
}


function getBitcoinSVPriceFromCryptonator() {
    const url = "https://cors.io/?https://api.cryptonator.com/api/ticker/bsv-usd";
    return new Promise((resolve, reject) => {
        fetch(url).then(function(r) {
            if (r.status !== 200) {
                reject("Error while retrieving response from Cryptonator server " + r.status);
                return;
            }
            return r.json();
        }).then(data => {
            if (data["ticker"] && data["ticker"]["price"]) {
                const price = Number(data["ticker"]["price"]);
                if (price > 0) {
                    resolve(price);
                    return;
                }
            }

            reject("Error while parsing response from Crytponator price API");
        }).catch(reject);
    });
}

function getBitcoinSVPriceFromCoinGecko() {
    const bsv_id = "bitcoin-cash-sv";
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=" + bsv_id + "&vs_currencies=USD";
    return new Promise((resolve, reject) => {
        fetch(url).then(function(r) {
            if (r.status !== 200) {
                reject("Error while retrieving response from CoinGecko server " + r.status);
                return;
            }
            return r.json();
        }).then(data => {
            if (data[bsv_id] && data[bsv_id]["usd"]) {
                const price = Number(data[bsv_id]["usd"]);
                if (price > 0) {
                    resolve(price);
                    return;
                }
            }

            reject("Error while parsing response from coingecko price API");
        }).catch(reject);
    });
}


