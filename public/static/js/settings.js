var SETTINGS = {
    "api_key": "1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z",
    "api_endpoint": "https://bitomation.com/{api_action}/{api_key}/{query}",
    "tip_amount": 0.05,
};

function get_local_settings() {
    const storage = window.localStorage;
    const cached_settings = storage["settings"];
    if (cached_settings) {
        try {
            return JSON.parse(cached_settings);
        } catch (e) {
        }
    }
    return {};
}

function save_local_settings(local_settings) {
    if (local_settings) {
        window.localStorage["settings"] = JSON.stringify(local_settings);
        console.log("Saving local settings", local_settings);
    } else {
        delete window.localStorage["settings"];
    }
}

function use_local_settings(local_settings) {
    if (local_settings && Object.keys(local_settings).length > 0) {
        console.log("Found local settings", local_settings);
        for (const key in local_settings) {
            const val = local_settings[key];
            console.log("Local setting override", key, val);
            SETTINGS[key] = val;
        }
    }
}

var BSV_PRICE = 53.00;

if (typeof window == "object") {
    use_local_settings(get_local_settings());
} else {
    module.exports = SETTINGS;
}
