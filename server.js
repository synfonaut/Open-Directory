const express = require("express");
const mustacheExpress = require("mustache-express");
const removeMd = require('remove-markdown');

const helpers = require("./public/static/js/helpers.js");
const process = require("./public/static/js/process.js");
const fs = require("fs");

const cached_items_file = __dirname + "/public/static/js/cached_items.js";

const app = express();
app.use(express.static('public'))

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.get('/', function (req, res) {
    res.render('index', {
        "twitter_card": "summary_large_image",
        "twitter_image": "https://dir.sv/static/img/twitter_large_card.png"
    });
});

app.get('/category/:category_id', function (req, res) {
    const category_id = req.params.category_id;
    const cache = req.params.category

    try {
        let cached_items = fs.readFileSync(cached_items_file);
        let items = JSON.parse(cached_items);

        console.log("ITEMS", items.length);

        const category = helpers.findObjectByTX(category_id, items);
        if (category) {

            const slice = process.buildItemSliceRepresentationFromCache(category.txid, items);
            console.log("SLICE ITEMS", slice.length);

            const title = category.name + " — Open Directory";
            const description = removeMd(category.description).replace(/\n/g, " ");
            res.render('index', {
                "description": description,
                "title": title,
                "slice": slice,
            });
            return;
        }


    } catch (e) {
        console.log("Error", e);
    }

    res.render('index');
});

app.get('*', function(req, res) {
    res.render('index');
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
