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

    it('convert block with two conflicting txs in one block', function() {
        const blocks = [
            {"height":580286,"address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.create","s3":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","s4":"name","s5":"New link","s6":"link","s7":"bit://asdf","s8":"description","s9":"Desc goes here"}},
            {"height":580286,"address":"1Juvf2KaCJearuF1zFRxrnRCocmjdh3DcC","txid":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.update","s3":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","s4":"name","s5":"New link with edit","s6":"description","s7":"Desc goes here (edit)"}},
            {"height":580286,"address":"1Juvf2KaCJearuF1zFRxrnRCocmjdh3DcC","txid":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a4","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.update","s3":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","s4":"name","s5":"Newer link with edit","s6":"description","s7":"Desc goes here (edited)"}},
        ];

        const results = [
            {"name":"Newer link with edit","link":"bit://asdf","description":"Desc goes here (edited)","rendered_description":"Desc goes here (edited)","category":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","type":"entry","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","height":580286,"votes":0}
        ];

        const processedResults = helpers.processResults(blocks);
        assert.deepEqual(results, processedResults);
    });


    it('convert block with undo', function() {
        const blocks = [
            {"height":580286,"address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.create","s3":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","s4":"name","s5":"New link","s6":"link","s7":"bit://asdf","s8":"description","s9":"Desc goes here"}},
            {"height":580286,"address":"1Juvf2KaCJearuF1zFRxrnRCocmjdh3DcC","txid":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.update","s3":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","s4":"name","s5":"New link with edit","s6":"description","s7":"Desc goes here (edit)"}},
            {"height":null,"address":"1LLzzUcjT6Gb2eW24cXSTYnQjw3EhA6Cds","txid":"8b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce8","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3"}}
        ];

        const results = [
            {"name":"New link","link":"bit://asdf","description":"Desc goes here","rendered_description":"Desc goes here","category":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","type":"entry","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","height":580286,"votes":0}
        ];

        const processedResults = helpers.processResults(blocks);
        assert.deepEqual(results, processedResults);

    });

    it('convert block with undo an undo', function() {
        const blocks = [
            {"height":580286,"address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.create","s3":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","s4":"name","s5":"New link","s6":"link","s7":"bit://asdf","s8":"description","s9":"Desc goes here"}},
            {"height":580286,"address":"1Juvf2KaCJearuF1zFRxrnRCocmjdh3DcC","txid":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.update","s3":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","s4":"name","s5":"New link with edit","s6":"description","s7":"Desc goes here (edit)"}},
            {"height":null,"address":"1LLzzUcjT6Gb2eW24cXSTYnQjw3EhA6Cds","txid":"8b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce8","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3"}},
            {"height":null,"address":"1LLzzUcjT6Gb2eW24cXSTYnQjw3EhA6Cds","txid":"7b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce9","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"8b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce8"}}
        ];


        /*
         * UNDOS { '8b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce8':
   '7b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce9',
  a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3:
   '8b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce8' }
FILTERED UNDOS { a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3:
   '8b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce8' }
   */

        const results = [
            {"name":"New link with edit","link":"bit://asdf","description":"Desc goes here (edit)","rendered_description":"Desc goes here (edit)","category":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","type":"entry","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","height":580286,"votes":0}
        ];

        const processedResults = helpers.processResults(blocks);
        assert.deepEqual(results, processedResults);

    });

    it('convert block with undo an undo an undo', function() {
        const blocks = [
            {"height":580286,"address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.create","s3":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","s4":"name","s5":"New link","s6":"link","s7":"bit://asdf","s8":"description","s9":"Desc goes here"}},
            {"height":580286,"address":"1Juvf2KaCJearuF1zFRxrnRCocmjdh3DcC","txid":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"entry.update","s3":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","s4":"name","s5":"New link with edit","s6":"description","s7":"Desc goes here (edit)"}},
            {"height":null,"address":"1LLzzUcjT6Gb2eW24cXSTYnQjw3EhA6Cds","txid":"8b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce8","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"a8b337d22a91f6a2c4263ee2e3bfae6bc88a91af5ce80d217c6b9cf1a0a534a3"}},
            {"height":null,"address":"1LLzzUcjT6Gb2eW24cXSTYnQjw3EhA6Cds","txid":"7b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce9","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"8b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce8"}},
            {"height":null,"address":"1LLzzUcjT6Gb2eW24cXSTYnQjw3EhA6Cds","txid":"6b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce0","data":{"os1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"7b5cc3cd1a7ddd3aae32b7e21c623c99027ff885af68a7fd5ae47062fc18dce9"}}
        ];

        const results = [
            {"name":"New link","link":"bit://asdf","description":"Desc goes here","rendered_description":"Desc goes here","category":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","type":"entry","txid":"f126fbdd09832f446505604ea82842b6cc3da76b261b9f264d07da9e5fab671d","address":"1DcVxjZ56dqYTPejKanoUXfrzypSei2fNp","height":580286,"votes":0}
        ];

        const processedResults = helpers.processResults(blocks);
        assert.deepEqual(results, processedResults);

    });

    it('convert block with undo an undo regression', function() {
        const blocks = [
            {"height":580286,"address":"1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A","txid":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"category.create","s3":"name","s4":"New directory","s5":"description","s6":"This is a new directory"}},
            {"height":null,"address":"1KeYwmYia9SZfh8FjR9AAUhF9Gb6GwAcjS","txid":"390e6495e33ef26b03b4afdd12f7c18a20bec1991d8d03fa9bed76ec18c20a43","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"21d65824aadf08b8a522453ea0c83e5608765fb0a2af17122052571ae40a00f8"}},
            {"height":null,"address":"1DcLqhGzj4nvZ7ntPJrtPgNGCzzMNVC9Y","txid":"21d65824aadf08b8a522453ea0c83e5608765fb0a2af17122052571ae40a00f8","data":{"s1":"1dirxA5oET8EmcdW4saKXzPqejmMXQwg2","s2":"undo","s3":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18"}},
        ];

        const results = [
            {"name":"New directory","description":"This is a new directory","rendered_description":"This is a new directory","type":"category","txid":"2fff57d7f40b31e55448468b6aec45ffaddf34278aca8de1098ee9adcf560f18","address":"1Nup3TDg3B1cQj74nRMQRX3VHYY8dTx88A","height":580286,"votes":0,"entries":0},
        ];

        const processedResults = helpers.processResults(blocks);
        assert.deepEqual(results, processedResults);
    });
});
