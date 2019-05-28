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
* Attach comments to votes?
* on-chain planaria... end up doing similar "state processing" code to bring "objects" up to date, eventually will need full Planaria, but for lighter apps, planarium.js?
* protocol processor that's a planaria state machine transformer, but embedded in a bitcoin tx, so everything is still onchain (schema)

## Feedback
* bitdb bug: event stream is getting messages it shouldn't
* bitdb suggestion: nice to just say "give me OP_RETURN string array" in addition to s1,s2,s3,s4,s5—useful for variable length protocols like MAP
* enable regex in jq for more advanced filtering

## Bugs
* Followup with klimenos, some descriptions of books uploaded don't appear (https://dir.sv/#ae634d86622c4a287dcf40ac3c133f366ec49ec9e5561f711233b3f5fa64f4ae), did you add a description becaus eit doesn't show up

## 0.0.2

* items and changelog switched over. now should be in position to ditch slice-cache and switch to global-cache. verify changelog and items are correct, especially on complex pages
* verify all places that use this.state.cache[category_id] work as expected (didUpdateLocation)

* instead of /link/ should it be /comments/ — that way you can talk about a category in general too? doesn't have to be attached to 

* dedicated entry page

* fix bitsocket issue

* reindex server with missing b:// media (create duplicate server) (use satchmo guide)

* implement metalens comments (https://www.yours.org/content/metalens-app-update---map-protocol-2a7f47367bb2)

* clear out old server docker logs... increase disk size
add https://www.audiob.app/tx/5ff0f7eaaa9c2771259bf410713efe0c5ac915f42fc008716b35f0882cd40286 to tipchain services

* clear warning about uploading copywritten material. could get sued!?
* figure out why some dir.sv tipchains aren't being included, https://twitter.com/Nadrojiskool/status/1133496717712580608 https://dir.sv/category/7e6c63be29af1eca8ddf2d4acfd5f43dd711d085b2101504284eb9b7056aa247

* fix stats page, otherwise people won't link to it directly

## tuesday
- changelog
* change original content owner to original content uploader
* if desc is too long it doesn't show
* wrong money count: https://dir.sv/category/e57c995fa8d582c8dbed7714071ce31d50bc7aed2c1dfa7c11bcd69b2f489d1e
* showing two tips in changelog but only one on page? https://dir.sv/category/31523dd547047024bed31c3cb2f3ef8f6e71d1fc976a628d97872e53a7583925

* mongodb scaling. setup new server optimized. look into a cluster. look into mongodb query caching


* subcategories with long names don't look great https://dir.sv/#a737ace37e85ca701f1845a977fe2e80c243be0662e0933aa2b126a06dabe35e
* save users prefs during session (sort order, num pages)
* Optimize fully for mobile on small devices (homepage logo too big)
* change link color after clicking
* add mobile hamburger navigatino menu (https://codepen.io/chuckreynolds/pen/ROaeXv)
* limit description, it can get really long on mobile
* resizing looks goofy on homepage, too narrow content padding
* when searching on home page, no results doesn't have right margin
* fix navigation on megans phone
* if network is down, say that rather than generic error
* much better stats page...actually show graphs
* changelog should link directly to where you can see the actino
* google analytics and basic stats tracking? easier to do product development if you know what features people are and aren't using....

* FAQ: What is a bitcoin link?
* add to faq, how to get BSV and signup for money button
* add to faq, can easily upload on add.bico.media (maybe add under submit link too)
* twitter bot that posts new open directory links and content
* some tipping boxes don't push over on events...margin-bottom problem?
* capture emails and send newsletter
* reinder server with missing b:// media (create duplicate server)
* credit font awesome in about
* when showing a deleted category ...should show it's actually deleted
* under upload link, let users know they can use add.bico.media, but they shouldn't be uploading content that isn't theirs or in the public domain

## After Conference
- Real scaling plan
- Real testing plan, automation
- Real refactoring plan

## Nice to have
* MoneyButton usernames
* Click to expand like old reddit
 * image embeds? check b:// media type
 * video embeds? youtube, vimeo, etc....
* Endless/infinite scroll
* With biggest tip statistic, show which category or entry it was for
* Hook up a faucet?
* should be easily able to publish static sites with custom designs using open directory data
* list unique addresses in stats
* bitcoin content sticker on yours.org to add to tipchain
* NSFW tag/filter
* Warn users before posting the same content in the same category (could just be a JavaScript check based on existing entries, you can also store the pending entries that dont appear yet in the user’s’ browser session). So we can avoid duplicates/spam.
* Search changelog
* Modified posts should have a little icon (counter) to specify how many time they've been altered. Clicking on the icon would display the logs.
* should users be able to move entries to a more appropriate category? ...that might incentivize bad behavior...
* Bitcoin Sticker Protocol that could be used in markdown or twitter, so you get credit for content on other platforms where you can't inject an HTTP or HTML sticker
* users need to know the conteniousness of a change. a hot item that gets changed is contenous.
* concept of time out box. see who was recently put in timeout,e asily bring them back out
* when you upvote a category what if the people who were hot in that category got paid?
* merge instead of fork
* easily see how much a category owner has earned...should be able to see how much everybody in every tipchain has earned
* easy way to host directory with a domain name
* should be able to detach monetary incentives as well, so you're not earning anything
* easily change default tip amounts when forking
* stats show history of each action in graph
* show which content is trending really hard with a badge
* Upcoming links: trending links that are less than 24 hours old. helps them go viral
* Server side rendering so first pageload doesn't require ajax


## Minor Bugs
* deleted content shouldn't show up in search anymore
* search doesn't translate bit:// links to bico.media
* can't control+click directories to open them in a new window
* top sub categories cuts off and doesn't show all https://dir.sv/category/f1b0ff16ce275c196113c584670f2d198912705d4570adba1d9f03a34ec0ca03
* if your default tip amount is .10 it will only show .1 until you click
* search page should update query string and automatically search when linked
* windows browser showing scroll bar on sort
* forks should link to bico.media if in chrome
* bottle native content isn't working
* bg isn't uploaded to blockchain
* clean up cache script updater so only showing info and errors, not debugging info
* descriptions need trimming or url is too long (http://localhost:3000/category/76ef4c9419e9de528009ea8ee7c43c669e3837db8edc7df0f961c6d0c490a2bd)
* messages should float over content, so if you're scrolled down you still see it
* unconfirmed media not in tipchain

## Problems to think through
* reposting dir.sv links should act as symlink, and not "steal" tipchain. should find balance between users. could/should tip count on the original post? should we merge tipchains? how to balance this?
* downvotes (who gets the tip? if content creator..incentivizes wrong behavior)

## 0.0.3

* scale
* custom planaria for performance
* threaded and upvoted comments
* bitcoin website sticker crawling
* categories "pull up" sub-category links (up to max depth)
* downvotes (who gets the tip? if content creator..incentivizes wrong behavior)
* report button / content violations / tip 
* nsfw tag

## About

@synfonaut

