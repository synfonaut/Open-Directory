
function satoshisToDollars(satoshis, bitcoin_price=BSV_PRICE, show_zero=false) {
    if (satoshis > 0) {
        var val = ((satoshis / 100000000.0) * bitcoin_price).toLocaleString(undefined, {'minimumFractionDigits':2, 'maximumFractionDigits':2});

        if (val == "0.00" || val == "0.01") {
            val = ((satoshis / 100000000.0) * bitcoin_price).toLocaleString(undefined, {'minimumFractionDigits':3, 'maximumFractionDigits':3});

            // ends in 0
            if (val.length == 5 && val[4] == "0") {
                val = val.slice(0, 4);
            }
        }
        return "$" + val;
    } else {
        if (show_zero) {
            return "$0.00";
        }
    }
}

function numberFormat(number, length=3) {
    if (number > 0) {
        const val = number.toLocaleString(undefined, {'minimumFractionDigits':2, 'maximumFractionDigits':length});

        if (val.slice(-3) == ".00") {
            return val.slice(0, -3);
        }
        return val;
    } else {
        return "0";
    }
}


// https://stackoverflow.com/a/6109105
function timeDifference(current, previous) {

    if (!current || !previous) {
        return "just now";
    }

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        return pluralize(Math.round(elapsed/1000), 'second', 'seconds') + ' ago';
    }

    else if (elapsed < msPerHour) {
        return pluralize(Math.round(elapsed/msPerMinute), 'minute', 'minutes') + ' ago';
    }

    else if (elapsed < msPerDay ) {
        return pluralize(Math.round(elapsed/msPerHour), 'hour', 'hours') + ' ago';
    }

    else if (elapsed < msPerMonth) {
        return pluralize(Math.round(elapsed/msPerDay), 'day', 'days') + ' ago';
    }

    else if (elapsed < msPerYear) {
        return pluralize(Math.round(elapsed/msPerMonth), 'month', 'months') + ' ago';
    }

    else {
        return pluralize(Math.round(elapsed/msPerYear ), 'year', 'years') + ' ago';
    }
}

function pluralize(val, singular, plural) {
    if (val == 1) {
        return val + " " + singular;
    }
    return val + " " + plural;
}

function isBottle() {
    return navigator.userAgent.indexOf("Bottle") !== -1;
}

function getBitLinkForBMediaTXID(txid) {
    return "bit://" + B_MEDIA_PROTOCOL + "/" + txid;
}

function getBMediaURLForTXID(url) {
    if (isBottle()) {
        return url;
    } else {
        return "https://bico.media/" + url;
    }
}

