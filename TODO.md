## TODO

* need clean changelog (filter out?)

* let users tip a custom amount to someone who contributed a link and entire tip chain (tip slider?)
* have a chain of tips where everyone in the chain gets a % of the tip (condense tips)

* fork button! let user edit html, edit paragraphs, change name, set root category, change color theme
* add themes that stick and work during forking (color logo with css)

* protocol for getting latest app version, put notice in app and point to new link (verify signature)

* add undo description (why are you changing this?)

* undo warning word wrap should be by word not letter

* messages should float at top of screen so they scroll

* edit form design
* on changelog show timestamp and relative time ago
* catch all errors and show friendly message instead
* use local storage for user-specific settings, like an alternative endpiont for bitdb genesis
* bug: floating categories go right sometimes for some reason
* hide create category by default
* better iconography and graphics
* better homepage description (benefits and how you can make money)
* compile step, minify, remove in-browser babel, convert to c:// and export for web & bitcoin output
* refactor code as much as possible so it's easier to organize
* create good examples (collab with bsvdevs, onchain games, onchain art, onchain utilities)
* stress test server, see if aggregate is putting too much load

## FUTURE
* include edits in the tipchain?
* AIP to sign data by author
* Moderation
* Plug into bit:// for genesis bitdb so we don't have to hardcode it
* pretty bitcom links, so Bottle has bit://<OPENDIR_PROTOCOL>/<txid>
* add statistics, how many categories, how many entries
* optimize: don't fetch network request every single time
* remove 2-undo limit
* idea: let categories aggregate their sub-categories to "pull up" interesting links

## FEEDBACK
* bitdb bug: event stream is getting messages it shouldn't
* bitdb suggestion: weird edge case with bitdb on u/c when joining on both, it doubles the download data even if you try to de-duplicate
* bitdb suggestion: nice to just say "give me OP_RETURN string array" in addition to s1,s2,s3,s4,s5—useful for variable length protocols like MAP
* on-chain planaria... end up doing similar "state processing" code to bring "objects" up to date, eventually will need full Planaria, but for lighter apps, planarium.js?
* protocol processor that's a planaria state machine transformer, but embedded in a bitcoin tx, so everything is still onchain
* enable regex in jq for more advanced filtering
* how to verify transactions in same block will always have same order?

