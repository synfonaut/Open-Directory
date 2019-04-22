# Open Directory

> Organize the world's information on Bitcoin

Open Directory lets you build resources like [Reddit](https://www.reddit.com) with other people. With Open Directory you can:

* Create your own resource and drive traffic to earn money through tips
* Incentivize quality submissions by sharing a portion of the tips back to contributors
* Earn money on other directories through quality submissions and getting into the tipchain

Open Directory is 100% Bitcoin native. That means while you can access it through your web browser at opendirectory.org, you can also access it through a blockchain browser at c://abcxyz. Open Directory speaks native Bitcoin, that means:

* Legacy web urls like http:// and https:// work flawlessly, but so do newer Bitcoin urls like Bitcom, b://, c:// and d://
* Open Directory app is open source, you're viewing it now
* Every directory has a 1-click fork, like GitHub. Think of it as an exit strategy, and brutal capitalism.
* The Open Directory protocol is 100% open to other developers

## Open Directory Protocol

Open Directory uses the Bitcom protocol `1dirxA5oET8EmcdW4saKXzPqejmMXQwg2`

* protocol is similar to MAP but more like a basic JSON schema.
* Currently category supports name/description/category and entry supports name/entry/link/category

### Create Category

    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    create.category
    name
    Root category
    description
    This is a new description

## TODO

### data model

* dedicated protocol
 - works compatible with forking
 - bulk mode breaks tx as id model. also probably breaks querying...how to fix?
 - need steady action (2) and category_id (3) / could also be txid (1)

* edit/delete category
* edit/delete item
* have a chain of tips where everyone in the chain gets a % of the tip
 - condense tip if same author gets multiple
 - need algorithm to calculate tip
* disappear and rerender money button (otherwise people might accidentally post wrong content)
* count categories as entries

* bug: verify edit transactions in same block don't lose their order in update and set wrong value

### design/ux
* better design
* group sub-categories
* need good loading indidcator
* need good error indidcator, up high
* let users tip a custom amount to someone who contributed a link and entire tip chain
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
* compile step, minify, remove inbrowser babel, convert to c:// and export for web & bitcoin output
* refactor code as much as possible so it's easier to organize

### nice to have
* fork button! let user edit html, edit paragraphs, change name, set root category, change color theme
* add statistics, how many categories, how many entries
* add recent open directories (changelog)

### for launch
* collab with bsvdevs and put 'em on chain
* create good examples (bsvdevs, onchain games, onchain art)

### questions for chat
* how much is too much to put in aggregate?
* possible to make app protocol generic by using json schema protocol?
* use vanity addresses for protocols? 1opendir... helps with UX, downside is people might assume it's safe without actually checking


## FUTURE

* Use AIP to sign data by author
* Let a user control a category controlled by their AIP
* Plug into bit:// for bitdb so we don't have to hardcode it
* Bottle bookmarklet for easily saving to a category
* how to do ownership? want collaboration but maybe need some kind of approval system. don't like my resource? 1-click fork
* need protocol processor that knows how to process on-chain, let bitcom protocol reference on-chain javascript to run to process OP_RETURN
* offline/client-side caching
* pretty bitcom links, so Bottle has bot://<OPENDIR_PROTOCOL>/<txid>


## FEEDBACK
* bitdb bug: event is getting messages it shouldn't
* bitdb suggestion: weird edge case with bitdb on u/c when joining on both, it doubles the download data even if you try to de-duplicate
* bitdb suggestion: nice to just say "give me OP_RETURN string array" in addition to s1,s2,s3,s4,s5—useful for variable length protocols like MAP
* on-chain planaria... end up doing similar "state processing" code to bring "objects" up to date, planarium.js?
 * could be like a planaria state machine transformer, but embedded in a bitcoin tx, so everything is still onchain
 * in addition to {"r": {"f": ...}} could do bit:// protocol transformations? run it through MAP in-chain protocol to convert s1/s2/s3/s3 to key/values
* enable regex in jq for more advanced filtering

## reaons to build protocol this way
- forwards comptabile, can easily add new fields and tags
- a bit more verbose, but a lot more clear—and updates are a lot more straight forward


## category

1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi
create.category
name
Root category
description
This is a new description
-> 12345...xyz

1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi
create.category
12345...xyz
name
Root category
description
This is a new description

1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi
create.update
123456...abc
name
Not a root category anymore
description
Updated description

1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi
create.delete
123456...abc

## entry

1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi
entry.create
123456...abc
name
name of entry
link
link://link
description
description
-> abc-123

1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi
entry.update
abc-123
description
"hello description"

1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi
entry.update
abc-123
name
"better name"

1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi
entry.delete
abc-123

## vote

1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi
vote
123456...abc

1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi
vote
12345...xyz


## about

@synfonaut
