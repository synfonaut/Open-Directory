## TODO

* test does processResult work with undo


* add recent changes (changelog)
* undo

* catch all errors and show friendly message instead



* edit form design
* protocol for getting latest app version, put notice in app and point to new link (verify signature)
* fork button! let user edit html, edit paragraphs, change name, set root category, change color theme
* use local storage for user-specific settings, like an alternative endpiont for bitdb genesis
* let users tip a custom amount to someone who contributed a link and entire tip chain (tip slider?)
* have a chain of tips where everyone in the chain gets a % of the tip (condense tips)
* bug: floating categories go right sometimes for some reason
* hide create category by default
* better iconography and graphics
* better homepage description (benefits and how you can make money)
* compile step, minify, remove in-browser babel, convert to c:// and export for web & bitcoin output
* refactor code as much as possible so it's easier to organize
* create good examples (collab with bsvdevs, onchain games, onchain art, onchain utilities)
* stress test server, see if aggregate is putting too much load

## FUTURE
* bring back sub-category counts
* votes get unsynced which cause pages to flash, client<->server cache gets very complex with partial objects
* might want to include edits in the tipchain
* Moderation
* AIP to sign data by author
* Plug into bit:// for genesis bitdb so we don't have to hardcode it
* pretty bitcom links, so Bottle has bit://<OPENDIR_PROTOCOL>/<txid>
* add statistics, how many categories, how many entries
* optimize: don't fetch network request every single time
* add themes that stick and work during forking
* unit tests for core transformations

## FEEDBACK
* bitdb bug: event stream is getting messages it shouldn't
* bitdb suggestion: weird edge case with bitdb on u/c when joining on both, it doubles the download data even if you try to de-duplicate
* bitdb suggestion: nice to just say "give me OP_RETURN string array" in addition to s1,s2,s3,s4,s5—useful for variable length protocols like MAP
* on-chain planaria... end up doing similar "state processing" code to bring "objects" up to date, eventually will need full Planaria, but for lighter apps, planarium.js?
* protocol processor that's a planaria state machine transformer, but embedded in a bitcoin tx, so everything is still onchain
* enable regex in jq for more advanced filtering
* how to verify transactions in same block will always have same order?

