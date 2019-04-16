const OPENDIR_PROTOCOL = "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi";
const OPENDIR_ACTIONS = [
    "category.create",
    "category.update",
    "category.delete",
    "entry.create",
    "entry.update",
    "entry.delete",
];

const MAP_PROTOCOL = "1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5";
const MAP_ACTIONS = [
    "SET",
    "DELETE",
];

function processOpenDirectoryTransaction(result) {

    const txid = result.txid;
    var args = Object.values(result.data);
    const protocol_id = args.shift();
    const opendir_action = args.shift();

    if (!txid) { return null; }
    if (protocol_id !== OPENDIR_PROTOCOL) { return null; }
    if (OPENDIR_ACTIONS.indexOf(opendir_action) == -1) { return null; }

    [item_type, item_action] = opendir_action.split(".");

    var obj = {
        type: item_type,
        action: item_action,
        txid: txid,
    };

    if (item_action == "delete") {
        obj.action_id = args.shift();
    } else {
        if (item_action == "update") {
            obj.action_id = args.shift();
        }

        const data = convertMAPOPReturnToKeyValues(args);
        if (data) {
            obj.change = data;
        }
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

