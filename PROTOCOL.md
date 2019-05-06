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
    [description]

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
    [description]

### Vote

    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    vote
    <txid>

### Undo

Undo has an additional <reference_id> parameter, which always refers to the original object being changed.

The reason for this duplication because is otherwise undo becomes a very long recursive chain and introduces querying issues for clients.

Description is optional and is a message about why you are undoing a change.

    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    undo
    <reference_id>
    <txid>
    [description]

### Moderation (proposed)

There are three kinds of proposed moderation, they're loosely inspired by IRC moderation—where a list of approved operators can set the directory into moderation "modes" at any time.

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

### Forking (proposed)

Directory forks need more thinking... what should forking do? Should it change history and let user override the tipchain? Right now forking is mainly visual (choose sub-category, change colors, etc.)

    # hard fork does a deep copy of entire directory
    fork
    <category_txid>


