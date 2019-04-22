# Open Directory

> Organize the world's information on Bitcoin

Open Directory lets you build resources like [Reddit](https://www.reddit.com), [Awesome Lists](https://github.com/sindresorhus/awesome) and [DMOZ](http://dmoz-odp.org) ontop of Bitcoin. With Open Directory you can:

* Create your own resource and earn money when people tip ([upvote](#voting))
* Incentivize quality submissions by sharing a portion of tips back to contributors ([tipchain](#tipchain))
* Organize an existing directory or fork it with 1-click and start your own ([easy exit policy](#forking))

Open Directory is an experiment to organize the world's information on Bitcoin (SV). What are you going to do with it?

### Start using the Open Directory

Open Directory is 100% Bitcoin native—which means it can be accessed from the [Bottle](https://bottle.bitdb.network) blockchain browser at [c://lkasjdflkajsdflkajsdflkajsdlfkajsdf](c://).

For convenience, it also runs on the web at [opendirectory.org](https://). To get started you just need a [Money Button](https://www.moneybutton.com) account.

### Start building with the Open Directory

Open Directory is open source in two ways.

1. You can view and modify the app's source code to spin up your own copy

2. The Open Directory Protocol is 100% open to build for your own use or implementation. Read about it below.



# Open Directory Protocol

> [Bitcom](https://bitcom.bitdb.network) protocol `1dirxA5oET8EmcdW4saKXzPqejmMXQwg2`

The Open Directory protocol is an open protocol for creating resources on Bitcoin (SV). If you've never heard of Bitcom protocols, [learn more here](https://bitcom.bitdb.network). The main key to understanding Bitcom protocols is they store data in the OP_RETURN of a Bitcoin transaction in a specific format. Here's a simple example:

<pre>
<strong style="color: #9B4DCA">1dirxA5oET8EmcdW4saKXzPqejmMXQwg2</strong>
<span style="color: #EB48AB">category.create</span>
<span style="color: #FF6384">name</span>
<em>Category Name Goes Here</em>
<span style="color: #FF6384">description</span>
Along with a *markdown* description
</pre>

Open Directory protocols have two primary forms, creating new items (categories and entries) and then doing things to those entries (edits, deletes, votes)





    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    category.update
    <category_txid>
    name
    <name>
    description
    <description
    
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    category.delete
    <category_txid>

### Entry

    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    entry.create
    <category_txid>
    name
    <name>
    description
    <description>
    
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    entry.update
    <entry_txid>
    name
    <name>
    description
    <description
    
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    entry.delete
    <entry_txid>

### Vote

    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    vote
    <txid>

### Moderation (pending)

3 kinds of moderation
* open
* anyone can add
* must get approved before adding


Moderation could be added with four changes:

Step 1. Sign changes with AIP which automatically makes you owner.


    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    category.create
    name
    <name>
    description
    <description>
    |
    15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva
    BITCOIN_ECDSA
    <signing_address>
    <signature>

Step 2. Enable moderation


    # enable moderated
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderator.enable
    <category_txid>

Step 3. Moderation now requires changes to be approved

    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    category.create
    name
    <name>
    description
    <description>


    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderate.approve
    <txid>




    # add moderator
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderator.create
    <category_txid>
    <publickey>
    
    # delete moderator
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderator.delete
    <category_txid>
    <publickey>



    # disable moderated
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderator.disable
    <category_txid>




    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    vote
    <txid>
    |
    15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva
    BITCOIN_ECDSA
    <signing_address>
    <signature>



Using AIP users can sign changes. 



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
* don't fetch network request every single time....use cache if we can
* bug: verify edit transactions in same block don't lose their order in update and set wrong value



### design/ux

* need MIT license

* better design
* nice logo using color scheme
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

* protocol for getting latest app version, put notice in app and point to new link
* probably want to include edits in the tipchain—but this could be abused...
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

## about

@synfonaut
