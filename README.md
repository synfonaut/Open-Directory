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
* show price of BSV somewhere
* show embedded content?
* need guiding principles on incentives. maximize degrees of freedom? let people make the decision, just make it easy for them to
* when you upvote a category what if the people who were hot in that category got paid?
* need NSFW tag/filter

* need isomorphic javascript..or at least ability to render titles for crawlers
* forks should link to bico.media if in chrome
* should users be able to move entries to a more appropriate category? ...that might incentivize bad behavior...

* dynamic: people are setting their own boundaries. "royalty free" X restrictions
* dynamic: creating content and "seeding" it with upvotes to get it going viral

* concept of time out box. see who was recently put in timeout,e asily bring them back out
* search page should have link to category its in as well
* users need to know the conteniousness of a change. a hot item that gets changed is contenous.
* add new sort metric for categories... submissions?

* should be able to create meta directory — linking to other interesting directories

* image/video embeds
* Bitcoin Sticker Protocol that could be used in markdown or twitter, so you get credit for content on other platforms where you can't inject an HTTP or HTML sticker

* subcategories with long names don't look great https://dir.sv/#a737ace37e85ca701f1845a977fe2e80c243be0662e0933aa2b126a06dabe35e
* changelog needs link to useful item to view the change
* save sort by and per page preferences

* FAQ: What is a bitcoin link?
* navigation on mobile: https://codepen.io/chuckreynolds/pen/ROaeXv
* way to move link so you keep address in tact
* go through klimenos feedback


Some Ideas:
1- Button to move content to a different section
2- Ability to report content --> Several reports would automatically result in user's MoneyButton banned from posting content and receiving tips for 24h or so
3- List number of MoneyButton users in Stats
4- Clickable http://dir.sv link in Changelog (to jump to affected section where the change occurred)
5- "Per page" and "sort by" choises should be remembered for the active session
6- Have some directions for new users who don't have a MoneyButton yet and instruct them they need to setup MoneyButton (FAQ or home page)
7- Have a Trash Bin category for deleting content (so users can recover it, rather than looking into the Changelog), and mark deleted posts with a special icon (easily identifiable)
8- Modified posts should have a little icon (counter) to specify how many time they've been altered. Clicking on the icon would display the logs.
9- Search should include MoneyButton username (author of posts): i.e. I want to search if any of my content was deleted or modified: I type my username and it displays all my posts. Add a filter functionnality to filter deleted/modified content, so I can monitor if someone has been changing my content.
10- Changelog could instegrate a search functionnality
11- Along with the bit:// field, mention to users they can upload content via https://add.bico.media/. And have the uploaded content automatically fill the bit:// field for them.
12- BugFix: some descriptions of books uploaded don't appear (https://dir.sv/#ae634d86622c4a287dcf40ac3c133f366ec49ec9e5561f711233b3f5fa64f4ae), may be due to size limitation. If that's the case, the description field must have limitation in place before posting.
13- BugFix: UI bug on Chrome (c.f. picture). https://twitter.com/messages/media/1132604930164973572
14- Warn users before posting the same content in the same category (could just be a JavaScript check based on existing entries, you can also store the pending entries that dont appear yet in the user’s’ browser session). So we can avoid duplicates/spam.


* homepage logo wraps around because it's too big
* reinder server with missing b:// media
* bitcoin content sticker on yours.org to add to tipchain

* save users prefs during session (sort order, num pages)

* should be easily able to publish static sites with custom designs using open directory data
* Description in entry needs css line break

* Run tipchain stress test by asking for lots of user addresses
* Optimize fully for mobile on small devices
* Run charity campaigns where part of tip goes to somewhere great
* Hook up a faucet?



## 0.0.2
* change link color after clicking
* navigation is breaking on mobile, too many things
* too many pages on homepage
* limit description, it can get really long on mobile
* statistics

* entry page
* scroll to top of current container, not page
* resizing looks goofy on homepage
* when searching on home page, no results doesn't have right margin
* fix navigation on megans phone
* highest tip on stats
* if network is down, say that rather than generic error
* With biggest tip statistic, show which category or entry it was for
* show more links on home page....should be mostly about that and directories secondary


* capture emails and send newsletter
* twitter bot that posts new open directory links and content
* dedicated entry page
* much better stats page...actually show graphs
* bitpaste, literatus, and http://bico.media and dir.sv included?
* convert bitstagram link to bit link?
* temporary metalens comments
* changelog should link directly to where you can see the actino

* fix github vulnerability

* google analytics and basic stats tracking? easier to do product development if you know what features people are and aren't using....
* better twitter descriptions

* more links on home page, less directories

* translate old /#lk1j3kl124 hash links if you can get it working


* image embeds? check b:// media type
* video embeds? youtube, vimeo, etc....
* windows browser showing scroll bar on sort
* some tipping boxes don't push over on events...margin-bottom problem?
* add to faq, how to get BSV and signup for money button

* search page should update query string and automatically search when linked

* fix bitsocket issue

Think about strategies to build user base

Weekly stats threads, chained together to show growth

Weekly changelog show and tell

Mailchimp newsletter
Click to expand like old reddit

* update meta description and title on location update

* 404 page
* fix twitter banner, make it nice and large, add icon
* do server side seo rendering
* minor: if your default tip amount is .10 it will only show .1 until you click




* PLANARIA
- scale
- sub categories pull up main categories
- threaded comments

## 0.0.3
* custom planaria for performance
* comments
* bitcoin sticker crawling
downvotes -> provide option? enable or disable, let market decide

## About

@synfonaut

