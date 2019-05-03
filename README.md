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

### Undo

    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    undo
    <txid>

### Forking (proposed)

    # fork
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    fork
    <category_txid>


### Moderation (proposed)

There are three kinds of moderation

* 0 - open (anyone can do anything)
* 1 - restricted (only moderator can delete)
* 2 - preapproved (everything must be approved)

Moderation could be added with four changes:

Step 1a. Whoever creates category is owner and default moderator

    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    category.create
    name
    <name>
    description
    <description>


Step 1b. Can also use AIP to sign authorship

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

Step 2a. Enable open moderation

    # enable moderated
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderation.set
    <category_txid>
    0

Step 2a. Enable restricted moderation

    # enable moderated
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderation.set
    <category_txid>
    2


Step 3. Moderation now requires changes to be approved

    # approve change
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderation.approve
    <txid>

    # reject change
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderation.reject
    <txid>

Step 4a. Add other moderators

    # add moderator
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderator.create
    <category_txid>
    <publickey>

Step 4b. Can also add moderators with AIP

    # add moderator
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderator.create
    <category_txid>
    <publickey>
    |
    15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva
    BITCOIN_ECDSA
    <signing_address>
    <signature>



Step 5. Delete a moderator
    # delete moderator
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderator.delete
    <publickey>

TODO: Does this solve moderation in a way that can be used with AIP?

## Plan for v0.2

The plan for the next version of Open Directory introduces two new experiments

1. Add moderation controls described above (likely need identity support in MoneyButton/Bottle)
2. Experiment with economic-based rules for moderation


For the second one, if a link has $100 invested in it, should you be able to delete it for $0.01?

You can easily undelete it for $0.01, but if you made it $100 to delete, you may have just incentivized spam.


## About

@synfonaut
