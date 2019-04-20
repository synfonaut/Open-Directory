## TODO

* need sharding to download very large data sets
* are there any risks to including unconfirmed categories on tipchain?

* root category concept, make it easy to re-use home-page for single-purpose
* better design
* let users tip a custom amount to someone who contributed a link and entire tip chain
* give items their own page as well
* better homepage description
* about with tip screen
* edit/delete category
* edit/delete item
* add sorting: by votes, date, submitter
* hide create category by default
* better iconography and graphics
* find places to add more color
* group sub-categories
* forms should clear between page refreshes
* add default state for no entries
* success after submit, show a message and what to do if it doesn't appear (refresh)
* reset money button after submit
* add blurb about how you can make money on opendirsv
* allow markdown in description
* have a chain of tips where everyone in the chain gets a % of the tip
* about page (BSV particle effect, only run when active)
* compile step, minify, convert to c:// and export for web & bitcoin output
* fork button! let user edit html, edit paragraphs, change name, set root category
* pagination of queries

* add statistics, how many categories, how many entries
* add recent open directories (changelog)
* refactor code as much as possible so it's easier to organize
* collab with bsvdevs and put 'em on chain
* create good examples (bsvdevs, onchain games, onchain art)


* disappear and rerender money button


* could make entire app protocol generic by introducing schema protocol and voting protocol
* api should have bulk-mode by default so replaying transactions (deep forking) is possible with minimal tx
 * there's an assumption being made right now that tx identifiers uniquely identify categories/items...this breaks in bulk-mode


# FUTURE

* Use AIP to sign data by author
* Let a user control a category controlled by their AIP
* Plug into bit:// for bitdb so we don't have to hardcode it
* Bottle bookmarklet for easily saving to a category


* FAQ
* can anyone edit my directory? for now! soon i'll add controls


------

open questions

* what is best way to create specific protocol from generic MAP protocol? just want to bake in specific keys on top of an action (CRUD)
 - 💡 need a protocol schema!

* should we use vanity addresses for protocols? helps with UX, downside is people might assume it's safe without actually checking

* how to do ownership? want collaboration but maybe need some kind of approval system. don't like my resource? 1-click fork

* MAP isn't a perfect fit for api because you shouldn't be able to DELETE a key on creation

* will Bottle be able to handle including BCAT protocols in <script> tags for 100kb > javascript (like React)

* need protocol processor that knows how to process on-chain, let bitcom protocol reference on-chain javascript to run to process OP_RETURN

* easy way to crawl a graph as an api? for example, get all tips on bitstagram? usecase is currently moneybutton can't do editable tips + OP_RETURN, so direct payments is best, but indexing them is tricky, maybe need a planaria and register a bitcom endpoint?

* how to hide a money button after purchase?

suggestions

* bitdb would be nice to just say "give me OP_RETURN string array" in addition to s1,s2,s3,s4,s5—useful for variable length protocols like MAP

* on-chain planaria... end up doing similar "state processing" code to bring "objects" up to date, planarium.js?
 * could be like a planaria state machine transformer, but embedded in a bitcoin tx, so everything is still onchain
 * in addition to {"r": {"f": ...}} could do bit:// protocol transformations? run it through MAP in-chain protocol to convert s1/s2/s3/s3 to key/values

* bitdb would be nice to have easy way to debug jq/re-run query over and over (ctrl+enter)

* "Editable buttons cannot have extra outputs" - moneybutton should allow donating above additional output amount, so dev can easily earn more baked right in or user can take tip down to $0

* enable regex in jq for more advanced filtering

-----

create a vanity protocol url 1dir…..

can it be it's own protocol but layer existing protocols? like map and then predefine what the keys are?

The Open Directory Protocol (ODP)

* category
  * name
  * description (markdown)
  * parent_category (nullable)
  * MAP extra key/pairs

* entry
  * category_id
  * name
  * description
  * link (b://, c://, d://, txid)
  * priority/order
  * tags
  * MAP extra key/pairs







1dir1234567890abcxyz create.category |
1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5
SET
name "BSVDEVS"
description "All the best blockchain dev resources"
parent <txid://category>

1dir1234567890abcxyz category.update <txid://category> |
1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5
SET
name "BSV DEVS"
description "The best Bitcoin BSV blockchain developer resources"
DELETE
parent

1dir1234567890abcxyz entry.add |
1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5
SET
category <txid://category>
name "Planaria"
link http://planaria.network
description "Infinite API over Bitcoin"
priority 10

1dir1234567890abcxyz tag.add <txid://entry> |
1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5
SET
name "development"
description "Development that's happening 

1dir1234567890abcxyz vote <txid://entry>






// good way to store tags?

// how to edit an entry?

// how to change an entry's category_id?



