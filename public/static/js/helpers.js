const OPENDIR_PROTOCOL = "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi";
const OPENDIR_ACTIONS = [
    "category.create",
    "category.update",
    "category.delete",
    "entry.create",
    "entry.update",
    "entry.delete",
    "vote",
];

const MAP_PROTOCOL = "1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5";
const MAP_ACTIONS = [
    "SET",
    "DELETE",
];

function processOpenDirectoryTransaction(result) {

    if (!result.txid || !result.data || !result.address || !result.height) {
        return null;
    }

    const txid = result.txid;
    const address = result.address;
    const height = result.height;
    var args = Object.values(result.data);
    const protocol_id = args.shift();
    const opendir_action = args.shift();

    if (!txid) { return null; }
    if (protocol_id !== OPENDIR_PROTOCOL) { return null; }
    if (OPENDIR_ACTIONS.indexOf(opendir_action) == -1) { return null; }

    if (opendir_action == "vote") {
        item_type = item_action = "vote";
    } else {
        [item_type, item_action] = opendir_action.split(".");
    }

    var obj = {
        type: item_type,
        action: item_action,
        txid: txid,
        address: address,
        height: height
    };

    if (item_action == "delete") {
        obj.action_id = args.shift();
    } else if (item_action == "create" || item_action == "update") {
        if (item_action == "update") {
            obj.action_id = args.shift();
        }

        const data = convertMAPOPReturnToKeyValues(args);
        if (data) {
            obj.change = data;
        }
    } else if (item_action == "vote") {
        obj.action_id = args.shift();
    }

    return obj;
}

function convertMAPOPReturnToKeyValues(orig_args) {
    var args = JSON.parse(JSON.stringify(orig_args)); // copy

    const protocol_id = args.shift();
    const map_action = args.shift();

    if (protocol_id != MAP_PROTOCOL) { return null; }
    if (MAP_ACTIONS.indexOf(map_action) == -1) { return null; }
    var obj = {action: map_action};

    if (map_action == "SET") {

        obj.value = {};

        // process s* key/value pairs
        var key = null, value = null, tmp = null;

        while (tmp = args.shift()) {
            if (key) {
                value = tmp;
            } else {
                key = tmp;
            }

            if (key && value) {
                obj.value[key] = value;
                key = null;
                value = null;
            }
        }

        return obj;
    } else if (map_action == "DELETE") {
        obj.value = args;
        return obj;
    } else {
        return null;
    }
}

function processOpenDirectoryTransactions(results) {
    return results.map(processOpenDirectoryTransaction).filter(r => { return r });
}

/*
console.log(processOpenDirectoryTransaction({
    "txid": "21c347c8d6e6e014a986a5106793470c07f2c8523a5dff961e4e9305b4764aba",
    data: {
        "s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi",
        "s2": "category.create",
        "s3": "1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5",
        "s4": "SET",
        "s5": "name",
        "s6": "hello world",
        "s7": "description",
        "s8": "this is the first open directory category ever created",
    },
}));

console.log(processOpenDirectoryTransaction({
    data: {
        "s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi",
        "s2": "entry.create",
        "s3": "1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5",
        "s4": "SET",
        "s5": "category",
        "s6": "21c347c8d6e6e014a986a5106793470c07f2c8523a5dff961e4e9305b4764aba",
        "s7": "name",
        "s8": "Planaria",
        "s9": "link",
        "s10": "https://planaria.network/",
        "s11": "description",
        "s12": "Infinite API over Bitcoin",
    },
    txid: "c42bc6f4d17b4f2997d14560c3b8ec9f1c2c6db6854e2b59c3fc7101f1739eb3",
}));

console.log(processOpenDirectoryTransaction({
    data: {
        "s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi",
        "s2": "entry.update",
        "s3": "c42bc6f4d17b4f2997d14560c3b8ec9f1c2c6db6854e2b59c3fc7101f1739eb3", // entry_id
        "s3": "1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5",
        "s4": "SET",
        "s5": "category",
        "s6": "12345-new", // new category_id
    },
    txid: "c42bc6f4d17b4f2997d14560c3b8ec9f1c2c6db6854e2b59c3fc7101f1739eb3",
}));

console.log(processOpenDirectoryTransaction({
    data: {
        "s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi",
        "s2": "entry.delete",
        "s3": "c42bc6f4d17b4f2997d14560c3b8ec9f1c2c6db6854e2b59c3fc7101f1739eb3", // entry_id
    },
    txid: "...",
}));

console.log(processOpenDirectoryTransaction({
    data: {
        "s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi",
        "s2": "category.delete",
        "s3": "21c347c8d6e6e014a986a5106793470c07f2c8523a5dff961e4e9305b4764aba", // category_id
    },
    txid: "...",
}));
*/
