const express = require("express");
const mustacheExpress = require("mustache-express");
const removeMd = require('remove-markdown');

const process = require("./public/static/js/process.js");
const fs = require("fs");

const cached_items_file = __dirname + "/public/static/js/cached_items.js";

const app = express();
app.use(express.static('public'))

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/category/:category_id', function (req, res) {

    const category_id = req.params.category_id;
    const cache = req.params.category

    try {
        let cached_items = fs.readFileSync(cached_items_file);
        let items = JSON.parse(cached_items);

        const category = process.findObjectByTX(category_id, items);
        if (category) {
            const title = category.name + " — Open Directory";
            const description = removeMd(category.description).replace(/\n/g, " ");
            res.render('index', {
                "description": description,
                "title": title
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
