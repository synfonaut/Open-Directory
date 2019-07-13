const express = require("express");
const mustacheExpress = require("mustache-express");
const removeMd = require('remove-markdown');

const helpers = require("./public/static/js/helpers.js");
const fs = require("fs");

const cached_items_file = __dirname + "/public/static/js/cached_items.js";

const app = express();
app.use(express.static('public'))

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.get('/', function (req, res) {
    var cache_bust = Math.floor(Math.random() * 10000000000);
    res.render('index', {
        "cache_bust": cache_bust,
        "twitter_card": "summary_large_image",
        "twitter_image": "https://dir.sv/static/img/twitter_large_card.png"
    });
});

app.get('/category/:category_id', function (req, res) {
    const category_id = req.params.category_id;
    const cache = req.params.category
    var cache_bust = Math.floor(Math.random() * 10000000000);

    try {
        let cached_items = fs.readFileSync(cached_items_file);
        let items = JSON.parse(cached_items);

        const category = helpers.findObjectByTX(category_id, items);
        if (category) {
            const title = category.name + " — Open Directory";
            const description = removeMd(category.description).replace(/\n/g, " ");
            res.render('index', {
                "description": description,
                "title": title,
                "cache_bust": cache_bust
            });
            return;
        }


    } catch (e) {
        console.log("Error", e);
    }

    var cache_bust = Math.floor(Math.random() * 10000000000);
    res.render('index', {"cache_bust": cache_bust});
});

app.get('*', function(req, res) {
    var cache_bust = Math.floor(Math.random() * 10000000000);
    res.render('index', {"cache_bust": cache_bust});
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
