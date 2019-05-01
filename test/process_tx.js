var assert = require('assert');
var helpers = require("../public/static/js/helpers");

function readFileTXs(filepath) {
    const fs = require('fs');
    return JSON.parse(fs.readFileSync(__dirname + "/" + filepath, 'utf8'));
}

const FLOAT_TOLERANCE = 0.005;

describe('basic tx processing', function() {

    it('convert txs to results', function() {
        const txs = [
            {"height":580286,"address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.create","s3":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","s4":"name","s5":"New link","s6":"link","s7":"bit://asdf","s8":"description","s9":"Desc goes here"}},
            {"height":580286,"address":"1Juvf2KaCJearuF1zFRxrnRCocmjdh3DcC","txid":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.update","s3":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","s4":"name","s5":"New link with edit","s6":"description","s7":"Desc goes here (edit)"}},
            {"height":580286,"address":"1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A","txid":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"category.create","s3":"name","s4":"New directory","s5":"description","s6":"This is a new directory"}}
        ];

        const processedResults = helpers.processResults(txs);
        assert.equal(processedResults[0].type, "category");
        assert.equal(processedResults[0].name, "New directory");
        assert.equal(processedResults[0].description, "This is a new directory");
        assert.equal(processedResults[0].txid, "2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18");

        assert.equal(processedResults[1].type, "entry");
        assert.equal(processedResults[1].name, "New link with edit");
        assert.equal(processedResults[1].link, "bit://asdf");
        assert.equal(processedResults[1].description, "Desc goes here (edit)");
        assert.equal(processedResults[1].txid, "f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d");
        assert.equal(processedResults[1].category, "2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18");
    });

    it('convert block with two conflicting txs in one block', function() {
        const txs = [
            {"height":580286,"address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.create","s3":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","s4":"name","s5":"New link","s6":"link","s7":"bit://asdf","s8":"description","s9":"Desc goes here"}},
            {"height":580286,"address":"1Juvf2KaCJearuF1zFRxrnRCocmjdh3DcC","txid":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.update","s3":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","s4":"name","s5":"New link with edit","s6":"description","s7":"Desc goes here (edit)"}},
            {"height":580286,"address":"1Juvf2KaCJearuF1zFRxrnRCocmjdh3DcC","txid":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a4","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.update","s3":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","s4":"name","s5":"Newer link with edit","s6":"description","s7":"Desc goes here (edited)"}},
        ];
        const processedResults = helpers.processResults(txs);
        assert.equal(processedResults[0].type, "entry");
        assert.equal(processedResults[0].name, "Newer link with edit");
        assert.equal(processedResults[0].link, "bit://asdf");
        assert.equal(processedResults[0].description, "Desc goes here (edited)");
        assert.equal(processedResults[0].txid, "f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d");
        assert.equal(processedResults[0].category, "2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18");
    });
});


describe('process open directory undo transactions', function() {
    it('convert block with undo', function() {
        const txs = [
            {"height":580286,"address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.create","s3":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","s4":"name","s5":"New link","s6":"link","s7":"bit://asdf","s8":"description","s9":"Desc goes here"}},
            {"height":580286,"address":"1Juvf2KaCJearuF1zFRxrnRCocmjdh3DcC","txid":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.update","s3":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","s4":"name","s5":"New link with edit","s6":"description","s7":"Desc goes here (edit)"}},
            {"height":null,"address":"1LLzzUcjT6Gb2eW24cXSTYnQjw3EhA6Cds","txid":"8b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce8","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3"}}
        ];

        const results = [
            {"name":"New link","link":"bit://asdf","description":"Desc goes here","rendered_description":"Desc goes here","category":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","type":"entry","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","height":580286,"votes":0}
        ];

        const processedResults = helpers.processResults(txs);

        assert.equal(processedResults[0].type, "entry");
        assert.equal(processedResults[0].name, "New link");
        assert.equal(processedResults[0].link, "bit://asdf");
        assert.equal(processedResults[0].description, "Desc goes here");
        assert.equal(processedResults[0].txid, "f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d");
        assert.equal(processedResults[0].category, "2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18");
    });

    it('convert block with undo an undo', function() {
        const txs = [
            {"height":580286,"address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.create","s3":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","s4":"name","s5":"New link","s6":"link","s7":"bit://asdf","s8":"description","s9":"Desc goes here"}},
            {"height":580286,"address":"1Juvf2KaCJearuF1zFRxrnRCocmjdh3DcC","txid":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.update","s3":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","s4":"name","s5":"New link with edit","s6":"description","s7":"Desc goes here (edit)"}},
            {"height":null,"address":"1LLzzUcjT6Gb2eW24cXSTYnQjw3EhA6Cds","txid":"8b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce8","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3"}},
            {"height":null,"address":"1LLzzUcjT6Gb2eW24cXSTYnQjw3EhA6Cds","txid":"7b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce9","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"8b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce8"}}
        ];

        const processedResults = helpers.processResults(txs);
        assert.equal(processedResults[0].type, "entry");
        assert.equal(processedResults[0].name, "New link with edit");
        assert.equal(processedResults[0].link, "bit://asdf");
        assert.equal(processedResults[0].description, "Desc goes here (edit)");
        assert.equal(processedResults[0].txid, "f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d");
        assert.equal(processedResults[0].category, "2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18");

    });

    it('convert block with undo an undo an undo', function() {
        const txs = [
            {"height":580286,"address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.create","s3":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","s4":"name","s5":"New link","s6":"link","s7":"bit://asdf","s8":"description","s9":"Desc goes here"}},
            {"height":580286,"address":"1Juvf2KaCJearuF1zFRxrnRCocmjdh3DcC","txid":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.update","s3":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","s4":"name","s5":"New link with edit","s6":"description","s7":"Desc goes here (edit)"}},
            {"height":null,"address":"1LLzzUcjT6Gb2eW24cXSTYnQjw3EhA6Cds","txid":"8b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce8","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3"}},
            {"height":null,"address":"1LLzzUcjT6Gb2eW24cXSTYnQjw3EhA6Cds","txid":"7b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce9","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"8b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce8"}},
            {"height":null,"address":"1LLzzUcjT6Gb2eW24cXSTYnQjw3EhA6Cds","txid":"6b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce0","data":{"os1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"7b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce9"}}
        ];

        const results = [
            {"name":"New link","link":"bit://asdf","description":"Desc goes here","rendered_description":"Desc goes here","category":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","type":"entry","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","height":580286,"votes":0}
        ];

        const processedResults = helpers.processResults(txs);
        assert.equal(processedResults[0].type, "entry");
        assert.equal(processedResults[0].name, "New link");
        assert.equal(processedResults[0].link, "bit://asdf");
        assert.equal(processedResults[0].description, "Desc goes here");
        assert.equal(processedResults[0].txid, "f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d");
        assert.equal(processedResults[0].category, "2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18");

    });

    it('convert block with undo an undo regression', function() {
        const txs = [
            {"height":580286,"address":"1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A","txid":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"category.create","s3":"name","s4":"New directory","s5":"description","s6":"This is a new directory"}},
            {"height":null,"address":"1KeYwmYia9SZfh8FjR9AAUhF9Gb6GwAcjS","txid":"390e6495e33ef26b03b4afdd12f7c18a20bec1991d8d03fa9bed76ec18c20a43","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"21d65824aadf08b8a522453ea0c83e5608765fb0a2af17122052571ae40a00f8"}},
            {"height":null,"address":"1DcLqhGzj4nvZ7ntPJrtPgNGCzzMNVC9Y","txid":"21d65824aadf08b8a522453ea0c83e5608765fb0a2af17122052571ae40a00f8","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18"}},
        ];

        const results = [
            {"name":"New directory","description":"This is a new directory","rendered_description":"This is a new directory","type":"category","txid":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","address":"1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A","height":580286,"votes":0,"entries":0},
        ];

        const processedResults = helpers.processResults(txs);
        assert.equal(processedResults[0].type, "category");
        assert.equal(processedResults[0].name, "New directory");
        assert.equal(processedResults[0].description, "This is a new directory");
        assert.equal(processedResults[0].txid, "2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18");
    });

});


describe('tipchain', function() {

    it('category includes self in tipchain', function() {
        const txs = [
            {"height":580286,"address":"1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A","txid":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"category.create","s3":"name","s4":"New directory","s5":"description","s6":"This is a new directory"}}
        ];

        const processedResults = helpers.processResults(txs);
        assert.deepEqual(processedResults[0].tipchain, [helpers.OPENDIR_TIP_ADDRESS, "1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A"]);
        assert.equal(processedResults[0].txid, "2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18");
    });

    it('entry includes category in tipchain', function() {
        const txs = [
            {"height":580286,"address":"1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A","txid":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"category.create","s3":"name","s4":"New directory","s5":"description","s6":"This is a new directory"}},
            {"height":580286,"address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.create","s3":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","s4":"name","s5":"New link","s6":"link","s7":"bit://asdf","s8":"description","s9":"Desc goes here"}},

            {"height":580286,"address":"1Juvf2KaCJearuF1zFRxrnRCocmjdh3DcC","txid":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.update","s3":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","s4":"name","s5":"New link with edit","s6":"description","s7":"Desc goes here (edit)"}}, // currently tipchain ignores edits
        ];

        const processedResults = helpers.processResults(txs);
        assert.deepEqual(processedResults[1].tipchain, [helpers.OPENDIR_TIP_ADDRESS, "1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A", "1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp"]);
        assert.equal(processedResults[1].txid, "f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d");
    });

    it('entry includes recursive category in tipchain', function() {
        const txs = [
            {"height":580284,"address":"1Jtp4DDg3B1cQj74nRMQRX3VHYY8dTx99B","txid":"2ccc57df740b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"category.create","s3":"name","s4":"Parent directory","s5":"description","s6":"This is a parent directory"}},
            {"height":580286,"address":"1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A","txid":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"category.create","s3":"2ccc57df740b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","s4":"name","s5":"New directory","s6":"description","s7":"This is a new directory"}},
            {"height":580286,"address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.create","s3":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","s4":"name","s5":"New link","s6":"link","s7":"bit://asdf","s8":"description","s9":"Desc goes here"}},

        ];

        const processedResults = helpers.processResults(txs);
        assert.deepEqual(processedResults[2].tipchain, [helpers.OPENDIR_TIP_ADDRESS, "1Jtp4DDg3B1cQj74nRMQRX3VHYY8dTx99B", "1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A", "1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp"]);
        assert.equal(processedResults[2].txid, "f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d");
    });

});

describe("tipchain split", function() {
    it('tipchain split for one address', function() {
        const tipchain = [helpers.OPENDIR_TIP_ADDRESS];
        const splits = helpers.calculateTipchainSplits(tipchain);
        assert.equal(tipchain.length, splits.length);
        assert.equal(splits[0], 1);
        assert(splits.reduce((a, b) => { return a+b }) == 1);
    });

    it('tipchain split for two addresses', function() {
        const tipchain = [helpers.OPENDIR_TIP_ADDRESS, "1Jtp4DDg3B1cQj74nRMQRX3VHYY8dTx99B"];
        const splits = helpers.calculateTipchainSplits(tipchain);
        assert.equal(tipchain.length, splits.length);
        assert(Math.abs(splits[0] - 0.371) < FLOAT_TOLERANCE);
        assert(Math.abs(splits[1] - 0.629) < FLOAT_TOLERANCE);
        assert(splits.reduce((a, b) => { return a+b }) == 1);
    });

    it('tipchain split for three addresses', function() {
        const tipchain = [helpers.OPENDIR_TIP_ADDRESS, "1Jtp4DDg3B1cQj74nRMQRX3VHYY8dTx99B", "1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A"];
        const splits = helpers.calculateTipchainSplits(tipchain);
        assert.equal(tipchain.length, splits.length);
        assert(Math.abs(splits[0] - 0.209) < FLOAT_TOLERANCE);
        assert(Math.abs(splits[1] - 0.353) < FLOAT_TOLERANCE);
        assert(Math.abs(splits[2] - 0.438) < FLOAT_TOLERANCE);
        assert(splits.reduce((a, b) => { return a+b }) == 1);
    });

    it('tipchain split for four addresses', function() {
        const tipchain = [helpers.OPENDIR_TIP_ADDRESS, "1Jtp4DDg3B1cQj74nRMQRX3VHYY8dTx99B", "1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A", "1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp"];
        const splits = helpers.calculateTipchainSplits(tipchain);
        assert.equal(tipchain.length, splits.length);
        assert(Math.abs(splits[0] - 0.139) < FLOAT_TOLERANCE);
        assert(Math.abs(splits[1] - 0.235) < FLOAT_TOLERANCE);
        assert(Math.abs(splits[2] - 0.292) < FLOAT_TOLERANCE);
        assert(Math.abs(splits[3] - 0.332) < FLOAT_TOLERANCE);
        assert(splits.reduce((a, b) => { return a+b }) == 1);
    });

    it('tipchain payment for one address', function() {
        const tipchain = [helpers.OPENDIR_TIP_ADDRESS];
        const payments = helpers.calculateTipPayment(tipchain, 50000, "BSV");
        assert.deepEqual(payments, [ { address: "1LPe8CGxypahVkoBbYyoHMUAHuPb4S2JKL", value: 50000, currency: "BSV" } ]);
        assert.equal(payments.map(p => { return p.value }).reduce((a, b) => { return a+b }), 50000);
    });

    it('tipchain payment for two address', function() {
        const tipchain = [helpers.OPENDIR_TIP_ADDRESS, "1Jtp4DDg3B1cQj74nRMQRX3VHYY8dTx99B"];
        const payments = helpers.calculateTipPayment(tipchain, 50000, "BSV");
        assert.deepEqual(payments, [
            { address: '1LPe8CGxypahVkoBbYyoHMUAHuPb4S2JKL', value: 18565.64, currency: 'BSV' },
            { address: "1Jtp4DDg3B1cQj74nRMQRX3VHYY8dTx99B", value: 31434.36, currency: "BSV" },
        ]);
        const total = payments.map(p => { return p.value }).reduce((a, b) => { return a+b });
        assert(Math.abs(total - 50000) < FLOAT_TOLERANCE);
    });

    it('tipchain payment for three address', function() {
        const tipchain = [helpers.OPENDIR_TIP_ADDRESS, "1Jtp4DDg3B1cQj74nRMQRX3VHYY8dTx99B", "1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A"];
        const payments = helpers.calculateTipPayment(tipchain, 50000, "BSV");
        assert.deepEqual(payments, [
            { address: '1LPe8CGxypahVkoBbYyoHMUAHuPb4S2JKL', value: 10434.581, currency: 'BSV' },
            { address: '1Jtp4DDg3B1cQj74nRMQRX3VHYY8dTx99B', value: 17667.281, currency: 'BSV' },
            { address: '1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A', value: 21898.139, currency: 'BSV' }
        ]);
        const total = payments.map(p => { return p.value }).reduce((a, b) => { return a+b });
        assert(Math.abs(total - 50000) < FLOAT_TOLERANCE);
    });

    it('tipchain payment for four address', function() {
        const tipchain = [helpers.OPENDIR_TIP_ADDRESS, "1Jtp4DDg3B1cQj74nRMQRX3VHYY8dTx99B", "1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A", "1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp"];
        const payments = helpers.calculateTipPayment(tipchain, 50000, "BSV");
        assert.deepEqual(payments, [
            { address: "1LPe8CGxypahVkoBbYyoHMUAHuPb4S2JKL", value: 6965.676, currency: "BSV" },
            { address: "1Jtp4DDg3B1cQj74nRMQRX3VHYY8dTx99B", value: 11793.915, currency: "BSV" },
            { address: "1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A", value: 14618.254, currency: "BSV" },
            { address: "1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp", value: 16622.154, currency: "BSV" },
        ]);
        const total = payments.map(p => { return p.value }).reduce((a, b) => { return a+b });
        assert(Math.abs(total - 50000) < FLOAT_TOLERANCE);
    });

    it('tipchain works for very large chains', function() {
        const tipchain = Array(15).fill(helpers.OPENDIR_TIP_ADDRESS);
        const payments = helpers.calculateTipPayment(tipchain, 50000, "BSV");
        assert.equal(tipchain.length, payments.length);
        const total = payments.map(p => { return p.value }).reduce((a, b) => { return a+b });
        assert(Math.abs(total - 50000) < FLOAT_TOLERANCE);
    });

    it('tipchain payment for two address (usd)', function() {
        const tipchain = [helpers.OPENDIR_TIP_ADDRESS, "1Jtp4DDg3B1cQj74nRMQRX3VHYY8dTx99B"];
        const payments = helpers.calculateTipPayment(tipchain, 1, "USD");
        assert.deepEqual(payments, [
            { address: "1LPe8CGxypahVkoBbYyoHMUAHuPb4S2JKL", value: 0.371, currency: "USD" },
            { address: "1Jtp4DDg3B1cQj74nRMQRX3VHYY8dTx99B", value: 0.629, currency: "USD" },
        ]);
        assert.equal(payments.map(p => { return p.value }).reduce((a, b) => { return a+b }), 1);
    });

});

