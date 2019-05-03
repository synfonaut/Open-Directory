## TODO

* add category amounts
* sort by HOT

* categories should be a sum of their economic activity + entry activity below it
 - need to sum votes in order then....sum votes to entries, votes to categories, then entries to categories

* 8a1cb246c9710554891478c0afaeeba1fb1e99ea0904315578694cf04f6ba01b tip sums are wrong
* fix satoshi -> dollar rounding
* dynamically download bsv price (cache it? once per day don't have to do it every single download)
* investigate why tipping isn't summing properly
* bug where changelog with $0.0 is showing

* don't download B://media outputs..don't need them
* show more info on tipchain..what specifically is being tipped?
* add "hot" sort, which essentially velocity, or (time * money)
* header loader should be white

* is undo limited to 5 because of max depth?
* about, link back to data providers for bitcoin price

* oracle: push the bitcoin price once per week?
QUESTION: MoneyButton, can I rely on order of outputs for my application. Ie. Can I add a "bookstop", before which I know the tips are related to my app (I am going to use an output anyway for my tip)
* QUESTION: Is it safe to assume someone can always recover funds sent to their input utxo? like a random b:// input?

* split out helpers into business logic

favicon


* QUESTION: how to verify transactions in same block will always have same order?

* BUG: BMEdia is in changelog 39d

* default model should be economic, sort by economic
* admin console that can "detach" certain directories incase they become problematic

* almost every interaction should have a custom tip (create entry, create category) because this helps them rank better

* bug: no changelog on about page
* beta..stuff could break. might go to wrong place

categories need new tipping mechanism and new money mechanism

should $0.00 just be 0?




* add links / hover information on description to give more details

* category should have custom tip amount
* search

* forking
 - main template parameters split out in HTML/JSON

* design
* launch / content / submissions
 - on-chain app
 - tipchain
   - BCAT:// and B:// protocol compatible (including forwards comptaible with bit://)
 - economically based
 - market based moderation
 - open source
 - forking
 - protocol spec
 - faq, thought process
 - for users, surf the blockchain
 - for contributors, earn money
 - for developers, build on top of open directory
 - experiments with tipping and user incentives
 - first on-chain upload should be a fork from the website


* should be able to toggle all, then close individually

* improved layout
* readme

* save whatever you tipped last as default (localstorage)
* custom tip design

* localStorage, want good defaults

* each action should have variable tip (should each action have a specific amount?)
* let users tip a custom amount to someone who contributed a link and entire tip chain (tip slider?)

* fork button! let user edit html, edit paragraphs, change name, set root category, change color theme
* add themes that stick and work during forking (color logo with css)


* add undo description (why are you changing this?)
* undo warning word wrap should be by word not letter
* Plug into bit:// for genesis bitdb so we don't have to hardcode it
* pretty bitcom links, so Bottle has bit://<OPENDIR_PROTOCOL>/<txid>


* messages should float at top of screen so they scroll
* edit form design
* on changelog show timestamp and relative time ago
* catch all errors and show friendly message instead
* use local storage for user-specific settings, like an alternative endpiont for bitdb genesis and api key
* bug: floating categories go right sometimes for some reason
* hide create category by default
* better iconography and graphics
* better homepage description (benefits and how you can make money)
* compile step, minify, remove in-browser babel, convert to c:// and export for web & bitcoin output
* refactor code as much as possible so it's easier to organize
* create good examples (collab with bsvdevs, onchain games, onchain art, onchain utilities)
* stress test server, see if aggregate is putting too much load

## v0.2
* Planaria to reduce load on client
* Use Planaria to grab Bitcoin Stickers from websites for tipchaining C:// and other protocols
* Moderation tools
* Statistics (money, categories, links, votes)
* Custom currency support

## FUTURE
* AIP to sign data by author
* Categories "pull up" and aggregate their sub-categories

## FEEDBACK
* bitdb bug: event stream is getting messages it shouldn't
* bitdb suggestion: nice to just say "give me OP_RETURN string array" in addition to s1,s2,s3,s4,s5—useful for variable length protocols like MAP
* on-chain planaria... end up doing similar "state processing" code to bring "objects" up to date, eventually will need full Planaria, but for lighter apps, planarium.js?
* protocol processor that's a planaria state machine transformer, but embedded in a bitcoin tx, so everything is still onchain
* enable regex in jq for more advanced filtering

