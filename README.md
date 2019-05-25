# Open Directory

> Organize the world's information on Bitcoin (SV)

Open Directory lets you build resources like [Reddit](https://www.reddit.com), [Awesome Lists](https://github.com/sindresorhus/awesome) and [DMOZ](http://dmoz-odp.org) ontop of Bitcoin. With Open Directory you can:

* Find the best content on the blockchain
* Earn money by submitting quality links
* Create your own directory and earn money when people upvote
* Fork an existing directory with a couple of clicks

Open Directory is an experiment to organize information on Bitcoin (SV). Get started by viewing the web mirror at [https://dir.sv](https://dir.sv).

## Start using the Open Directory

Open Directory is 100% Bitcoin native—which means it can be accessed from the [Bottle](https://bottle.bitdb.network) blockchain browser at [bit://19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut/73a34a08f6711b56776e1a997c0292e7110eaabb266bd7fbab5db60d4b552b4d](bit://19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut/73a34a08f6711b56776e1a997c0292e7110eaabb266bd7fbab5db60d4b552b4d)

For convenience, it also runs on the web at [https://dir.sv](https://dir.sv). To get started you just need a [Money Button](https://www.moneybutton.com) account.

## Start building with the Open Directory

Open Directory is open source in two ways.

1. You can view and modify the app's source code to spin up your own copy

2. The Open Directory Protocol is 100% open to build for your own use or implementation. Read about it below.

## Admin Console

If you are managing your own Open Directory, check out the [Open Directory Admin Console](https://github.com/synfonaut/OpenDirectory-Admin-Console) for a few helpful commands.

## Open Directory Protocol

Check out the [Open Directory Protocol](https://github.com/synfonaut/Open-Directory/blob/master/PROTOCOL.md) to learn more.

## Open Directory v2 Plans
* Planaria to reduce load on client
* Planaria to remove entry and satoshi maxDepth restriction on categories and search
* Planaria to crawl Bitcoin Stickers from websites for including C:// and other protocols in tipchain
* Planaria to sort changelog by graph-dependant order (Neon Genesis?)
* Recursive satoshi counts, categories count all sub-categories with no limit
* Moderation tools
* Statistics (money, categories, links, votes)
* Custom currency support
* Pretty in-browser Bitcom links like bit://<OPENDIR_PROTOCOL>/<txid>
* Pretty in-app Bitcom links like bit://<B_MEDIA_PROTOCOL>/<txid> converted to <protocol name>: <txid>
* Add comments (Metalens?)
* Make protocol more generic by using Bitcom schema protocol
* Different algorithms for tipchain, specifying default splits
* Comment pages
* Twitter bot
* TonicPOW integration
* Search
* Get BSV price on-chain

* Open Question: Should actions take into account historical economic costs? ex. undoing a $50 entry costs $50

## Ideas
* AIP to sign data by author
* Categories "pull up" and aggregate their sub-categories
* Attach comments to votes?
* on-chain planaria... end up doing similar "state processing" code to bring "objects" up to date, eventually will need full Planaria, but for lighter apps, planarium.js?
* protocol processor that's a planaria state machine transformer, but embedded in a bitcoin tx, so everything is still onchain (schema)

## Feedback
* bitdb bug: event stream is getting messages it shouldn't
* bitdb suggestion: nice to just say "give me OP_RETURN string array" in addition to s1,s2,s3,s4,s5—useful for variable length protocols like MAP
* enable regex in jq for more advanced filtering

## Bugs
* reindex bitomation on new server then swap it out
* bottle native content isn't working
* bg isn't uploaded to blockchain
* bug when listing forks....if you fork from home directory it goes from there...
* when you command click a category for a new link, it expands the tipchain
* fork list sometimes shows up on wrong page when network is loading
* make directories 3 columns wide on MBP
* add another row
* create an arrow in center that click to expand
* network loading when it shouldn't?
* downvote with a cost?
* easy way to host directory with a domain name
* should be able to detach monetary incentives as well, so you're not earning anything
* search is broken
* need way to clearly show recent changes so community can "vote" on them
* would be nice to have a recent feed that isn't changelog....like recent entry submissions, categories or votes
* would be nice to see recent activity ...what categories were just created ... what entries were just created ...what was just upvoted?
* credit font awesome in about
* easily change default tip amounts when forking
* show "3 votes" under money or add divider to make it more clear
* need recovery zone...stuff that's recently been deleted that can easily be restored with 1-click
* when showing a deleted category ...should show it's actually deleted
* easily see how much a category owner has earned...should be able to see how much everybody in every tipchain has earned
* add name to 1dir protocol so that it shows up on trends
* investigate how you would do *merge*
* what about a memcache for mongodb? why can't we say cache this query for 5 minutes?
* on homepage let users sort categories by hot/new/money as well
* bitpaste, literatus, and http://bico.media  included?
* show price of BSV somewhere
* show embedded content?
* need guiding principles on incentives. maximize degrees of freedom? let people make the decision, just make it easy for them to
* when you upvote a category what if the people who were hot in that category got paid?



## About

@synfonaut

