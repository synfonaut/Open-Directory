## Alpha

* fix length of create directory form on home page
* only read updates when not using http:// or https://
* expandable forms with good call to actions
* ensure forking works dir.sv -> bico.media

* dir.sv working in all major browsers: chrome, safari, firefox, bottle
- create good images for tweet storm (tipchain)
- Check on slow network
- verify you control admin key

## Beta (Friends)
- Upload twitter card image with new logo and verify
* register bitcom protocol
- Polish content
- create good examples (collab with bsvdevs, onchain games, onchain art, onchain utilities)
- followup with BSV/DEVS
* BSV Games
* BSV Art
* BSV Apps
* BSV Devs
https://github.com/bico-media/awesome

## Pre-launch (Atlantis)
- Test uploading to chain
- Polish polish polish
- first on-chain upload should be a fork from the website
- does fork work? can you access from bico.media?
- double check app updates work

## Launch (Everyone)
- prepare tweet storm
- prepare launch images
- make repos public
- launch on Product Hunt
- 🔥 Launch!

## FEEDBACK
* bitdb bug: event stream is getting messages it shouldn't
* bitdb suggestion: nice to just say "give me OP_RETURN string array" in addition to s1,s2,s3,s4,s5—useful for variable length protocols like MAP
* on-chain planaria... end up doing similar "state processing" code to bring "objects" up to date, eventually will need full Planaria, but for lighter apps, planarium.js?
* protocol processor that's a planaria state machine transformer, but embedded in a bitcoin tx, so everything is still onchain (schema)
* enable regex in jq for more advanced filtering

## Open Directory v2

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
* Make protocol more generic by using Bitcom schema protocol
* Different algorithms for tipchain, specifying default splits
* Comment pages
* Twitter bot
* TonicPOW integration
* Search

* Open Question: Should actions take into account historical economic costs? ex. undoing a $50 entry costs $50

## FUTURE
* AIP to sign data by author
* Categories "pull up" and aggregate their sub-categories
* Attach comments to votes?
