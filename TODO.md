## TODO

### protocol changes
* PROTOCOL.md

### code changes
* possible to only sort results once instead of every time?
* convert txpool to hashtable? See if anywhere depends on order
* have debug mode that shows how big network requests are...so we know if we are bloating the replies accidentally
* check everything with slow connection again
* split out helpers into business logic, split out process functions into process.js

* forking
 - project for self-forking a webpage
 - main template parameters split out in HTML/JSON
 - fork button! let user edit html, edit paragraphs, change name, set root category, change color theme
 - add themes that stick and work during forking (color logo with css)

* use local storage for user-specific settings, like an alternative endpiont for bitdb genesis and api key
* save whatever you tipped last as default (localstorage)
* customize bitdb server

* Plug bitdb into bit:// for genesis bitdb so we don't have to hardcode it

* compile step, minify, remove in-browser babel, convert to c:// and export for web & bitcoin output
* refactor code as much as possible so it's easier to organize
* stress test server with beta and test transactions, see if aggregate is putting too much load

### ux changes
* add default "hot" sort, which essentially velocity, or (time * money)

* almost every interaction should have a custom tip (create entry, create category) because this helps them rank better
* allow tip amount when submitting a link and a category... since it now contributes to economic activity
 * test that we're accounting for this, so far only votes have been tested
* add custom tippping on upvoting categories
* each action should have variable tip (should each action have a specific amount?)

* search

* dedicated add directory page...homepage might get too big and you'd still want to be able to easily create new ones
* changelog should be able to toggle all, then close individually
* favicon

### admin changes
* admin console that can "detach" certain directories incase they become problematic

### marketing and design
* add to home page links / hover information on description to give more details
* readme
* better homepage description (benefits and how you can make money)
* bug: floating categories go right sometimes for some reason
* better separation in design like suggested
* improved layout
* undo warning word wrap should be by word not letter
* messages should float at top of screen so they scroll
* edit form design
* hide create category by default
* better iconography and graphics

### launch / content / submissions
 - create good examples (collab with bsvdevs, onchain games, onchain art, onchain utilities)
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
 - for developers, built on bitdb, moneybutton and react
 - bitdb and money button are essential here, thank you!
 - react i've never used before, but it ended up being an important piece. letting the data be declarative means i can silently cache and update in the background and the app doesn't have to worry about it. doing this imperatively would be rough
 - experiments with tipping and user incentives
 - first on-chain upload should be a fork from the website

## Open Directory v2
* Planaria to reduce load on client
* Crawl Bitcoin Stickers from websites for including C:// and other protocols in tipchain
* Moderation tools
* Statistics (money, categories, links, votes)
* Custom currency support
* Pretty Bitcom links like bit://<OPENDIR_PROTOCOL>/<txid>

## FUTURE
* AIP to sign data by author
* Categories "pull up" and aggregate their sub-categories
* Attach comments to votes?

## FEEDBACK
* bitdb bug: event stream is getting messages it shouldn't
* bitdb suggestion: nice to just say "give me OP_RETURN string array" in addition to s1,s2,s3,s4,s5—useful for variable length protocols like MAP
* on-chain planaria... end up doing similar "state processing" code to bring "objects" up to date, eventually will need full Planaria, but for lighter apps, planarium.js?
* protocol processor that's a planaria state machine transformer, but embedded in a bitcoin tx, so everything is still onchain
* enable regex in jq for more advanced filtering

