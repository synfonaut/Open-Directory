# Open Directory Protocol

> [Bitcom](https://bitcom.bitdb.network) protocol `1dirzgocAsru3SdhetQkEJraQgYTf5xQm`

The Open Directory protocol is an open protocol for creating resources on Bitcoin (SV). If you've never heard of Bitcom protocols, [learn more here](https://bitcom.bitdb.network). The main key to understanding Bitcom protocols is they store data in the OP_RETURN of a Bitcoin transaction in a specific format. Here's a simple example:

<pre>
<strong style="color: #9B4DCA">1dirzgocAsru3SdhetQkEJraQgYTf5xQm</strong>
<span style="color: #EB48AB">category.create</span>
<span style="color: #FF6384">name</span>
<em>Category Name Goes Here</em>
<span style="color: #FF6384">description</span>
Along with a *markdown* description
</pre>

Open Directory protocols have two primary forms, creating new items (categories and entries) and then doing things to those entries (edits, deletes, votes)


    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
    category.update
    <category_txid>
    name
    <name>
    description
    <description
    
    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
    category.delete
    <category_txid>
    [description]

### Entry

    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
    entry.create
    <category_txid>
    name
    <name>
    description
    <description>
    
    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
    entry.update
    <entry_txid>
    name
    <name>
    description
    <description
    
    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
    entry.delete
    <entry_txid>
    [description]

### Vote

    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
    vote
    <txid>

### Undo

Undo has an additional <reference_id> parameter, which always refers to the original object changed.

The reason for duplication is because otherwise undo becomes a very long recursive chain and introduces querying issues for clients.

The description field is optional and is a message about why you are undoing a change.

    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
    undo
    <reference_id>
    <txid>
    [description]

### Forking

Forking needs more thinking behind it—currently, there are two ways to fork:

* Soft fork — changing meta parameters, theme, title, about, main category, intro, and base tipchain address
* Hard fork — bulk replaying transactions, so you own 100% of tipchain

```
# soft fork uploads a new frontend, adds a redirect, but underlying data stays the same
fork.soft
<uri>
[category_txid]
```


```
# (proposed) hard fork replays every transaction to take over ownership, likely combo of protocol + client side ...needs more thinking
fork.hard
    ...
```


### Moderation (proposed)

There are three kinds of proposed moderation; they're loosely inspired by IRC moderation—where a list of approved operators can set the directory into moderation "modes" at any time.

* 0 - open (anyone can do anything)
* 1 - restricted (only moderators can delete)
* 2 - preapproved (everything must be approved)

Adding moderation to the protocol could be done with four changes:

Step 1a. Whoever creates a category is the owner and default moderator

    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
    category.create
    name
    <name>
    description
    <description>


Step 1b. Can also use AIP to sign authorship

    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
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
    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
    moderation.set
    <category_txid>
    0

Step 2a. Enable restricted moderation

    # enable moderated
    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
    moderation.set
    <category_txid>
    2


Step 3. Moderation now requires changes to be approved

    # approve change
    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
    moderation.approve
    <txid>

    # reject change
    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
    moderation.reject
    <txid>

Step 4a. Add other moderators

    # add moderator
    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
    moderator.create
    <category_txid>
    <publickey>

Step 4b. Can also add moderators with AIP

    # add moderator
    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
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
    1dirzgocAsru3SdhetQkEJraQgYTf5xQm
    moderator.delete
    <publickey>

## Feedback

Send feedback to @synfonaut
