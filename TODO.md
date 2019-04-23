* need to be able to page entries
// TODO: Add empty listing view

* delete category
* delete item

### protocol
* unit tests for core transformations
* edit category
* edit item
* undo
* fork

### app
* let users tip a custom amount to someone who contributed a link and entire tip chain
* have a chain of tips where everyone in the chain gets a % of the tip
 - condense tip if same author gets multiple
 - need algorithm to calculate tip
* bug: verify edit transactions in same block don't lose their order in update and set wrong value
* fork button! let user edit html, edit paragraphs, change name, set root category, change color theme
* add recent open directories (changelog)

### design/ux
* need good loading indidcator (navigation)
* need good error indidcator, up high (message that appears)
* success after submit, show a message and what to do if it doesn't appear (success message that appears)
* add default state for no entries (no yet, why don't you add one?)
* bug: floating categories go right sometimes for some reason
* hide create category by default

* better iconography and graphics
* better homepage description (benefits and how you can make money)

### nice to have
* add themes that stick and work during forking
* use local storage for user-specific settings, like an alternative endpiont for bitdb genesis
* optimize: don't fetch network request every single time
* give items their own page as well
* add statistics, how many categories, how many entries

### for launch
* compile step, minify, remove inbrowser babel, convert to c:// and export for web & bitcoin output
* refactor code as much as possible so it's easier to organize
* create good examples (collab with bsvdevs, onchain games, onchain art, onchain utilities)
* stress test server, see if aggregate is putting too much load

## FUTURE
* votes get unsynced which cause pages to flash, client<->server cache gets very complex with partial objects
* protocol for getting latest app version, put notice in app and point to new link
* might want to include edits in the tipchain
* Moderation
* AIP to sign data by author
* Plug into bit:// for genesis bitdb so we don't have to hardcode it
* Bottle bookmarklet for easily saving to a category
* pretty bitcom links, so Bottle has bot://<OPENDIR_PROTOCOL>/<txid>

## FEEDBACK
* bitdb bug: event stream is getting messages it shouldn't
* bitdb suggestion: weird edge case with bitdb on u/c when joining on both, it doubles the download data even if you try to de-duplicate
* bitdb suggestion: nice to just say "give me OP_RETURN string array" in addition to s1,s2,s3,s4,s5—useful for variable length protocols like MAP
* on-chain planaria... end up doing similar "state processing" code to bring "objects" up to date, eventually will need full Planaria, but for lighter apps, planarium.js?
* protocol processor that's a planaria state machine transformer, but embedded in a bitcoin tx, so everything is still onchain
* enable regex in jq for more advanced filtering
