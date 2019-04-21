# Open Directory

> organize the world

## TODO

### data model
* react should display entries immediately on category change and only update UI if it needs to after network fetch
* protcol would be nice to have a stable category_id to filter on

* if you actually fetch sub category entries you could cache results slightly more and no loading screen
* need subcategory counts working
* pagination of queries
* dedicated protocol
 - works compatible with forking
 - bulk mode breaks tx as id model. also probably breaks querying...how to fix?
* edit/delete category
* edit/delete item
* have a chain of tips where everyone in the chain gets a % of the tip
 - condense tip if same author gets multiple
 - need algorithm to calculate
* disappear and rerender money button (otherwise people might accidentally post wrong content)
* should categories count as entries in the num?

### design/ux
* better design
* group sub-categories
* let users tip a custom amount to someone who contributed a link and entire tip chain
* add (PENDING) tag to categories and entries that haven't been created yet
* give items their own page as well
* better homepage description
* about with tip screen
* add sorting: by votes, date, submitter
* hide create category by default
* better iconography and graphics
* find places to add more color
* forms should clear between page refreshes
* add default state for no entries
* success after submit, show a message and what to do if it doesn't appear (refresh)
* reset money button after submit
* add blurb about how you can make money on opendirsv
* allow markdown in description
* about page (BSV particle effect, only run when active)
* beta tag, let people know it's a new thing and an experiment

### cleanup
* compile step, minify, convert to c:// and export for web & bitcoin output
* refactor code as much as possible so it's easier to organize

### nice to have
* fork button! let user edit html, edit paragraphs, change name, set root category
* add statistics, how many categories, how many entries
* add recent open directories (changelog)

### for launch
* collab with bsvdevs and put 'em on chain
* create good examples (bsvdevs, onchain games, onchain art)


## FUTURE

* possible to make app protocol generic by using json schema protocol?
* Use AIP to sign data by author
* Let a user control a category controlled by their AIP
* Plug into bit:// for bitdb so we don't have to hardcode it
* Bottle bookmarklet for easily saving to a category
* use vanity addresses for protocols? 1opendir... helps with UX, downside is people might assume it's safe without actually checking
* how to do ownership? want collaboration but maybe need some kind of approval system. don't like my resource? 1-click fork
* need protocol processor that knows how to process on-chain, let bitcom protocol reference on-chain javascript to run to process OP_RETURN


## FEEDBACK
* bitdb suggestion: weird edge case with bitdb on u/c when joining on both, it doubles the download data even if you try to de-duplicate
* bitdb suggestion: nice to just say "give me OP_RETURN string array" in addition to s1,s2,s3,s4,s5—useful for variable length protocols like MAP
* on-chain planaria... end up doing similar "state processing" code to bring "objects" up to date, planarium.js?
 * could be like a planaria state machine transformer, but embedded in a bitcoin tx, so everything is still onchain
 * in addition to {"r": {"f": ...}} could do bit:// protocol transformations? run it through MAP in-chain protocol to convert s1/s2/s3/s3 to key/values
* enable regex in jq for more advanced filtering
