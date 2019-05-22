## Alpha

* twitter card support
* register bitcom protocol
* verify works well in Bottle
- clean up protocol language
* search icon
* split out lib and my JS file organization
- compile step, minify, remove in-browser babel, convert to c:// and export for web & bitcoin output
- Check on slow network

## Beta (Friends)
- Upload website (dir.sv)
- Reset protocol id
- Polish content
- publish admin console on npm
- create good examples (collab with bsvdevs, onchain games, onchain art, onchain utilities)

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

