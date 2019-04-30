var assert = require('assert');
var helpers = require("../public/static/js/helpers");

describe('process open directory transactions', function() {

    it('convert blocks to results', function() {
        const blocks = [
            {"height":580286,"address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.create","s3":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","s4":"name","s5":"New link","s6":"link","s7":"bit://asdf","s8":"description","s9":"Desc goes here"}},
            {"height":580286,"address":"1Juvf2KaCJearuF1zFRxrnRCocmjdh3DcC","txid":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.update","s3":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","s4":"name","s5":"New link with edit","s6":"description","s7":"Desc goes here (edit)"}},
            {"height":580286,"address":"1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A","txid":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"category.create","s3":"name","s4":"New directory","s5":"description","s6":"This is a new directory"}}
        ];

        const results = [
            {"name":"New directory","description":"This is a new directory","rendered_description":"This is a new directory","type":"category","txid":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","address":"1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A","height":580286,"votes":0,"entries":1},
            {"name":"New link with edit","link":"bit://asdf","description":"Desc goes here (edit)","rendered_description":"Desc goes here (edit)","category":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","type":"entry","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","height":580286,"votes":0}
        ];

        const processedResults = helpers.processResults(blocks);
        assert.deepEqual(results, processedResults);
    });

});
