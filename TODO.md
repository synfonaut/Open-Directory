## Alpha

- content
 - homepage
  - add links / hover information on description to give more details
  - better description (benefits and how you can make money)
 - about on bottom of every directory, explain what it is for people who have no idea
 - readme cleanup
 - clean up protocol language
 - faq
  - why no moderation tools
   - market based moderation
  - economically based
  - undo wars
  - open source
  - forking
  - protocol spec
  - faq, thought process
  - for users, surf the blockchain
  - for contributors, earn money
  - for developers, build on top of open directory
  - for developers, built on bitdb, moneybutton and react
  - v2 needs oauth/user signing
  - tipchain
    - BCAT:// and B:// protocol compatible (including forwards comptaible with bit://)
  - experiments with tipping and user incentives
  - only possible with BSV, low-fees allow micro transaction business models
 - about
  - bitdb and money button are essential here, thank you!
  - in my past life i built on platforms that constantly changed the rules. i am building on bsv because the rules are set in stone.
  - react i've never used before, but it ended up being an important piece. letting the data be declarative means i can silently cache and update in the background and the app doesn't have to worry about it. doing this imperatively would be rough


- Redesign
 - dedicated add directory page
 - favicon
 - changelog should be able to toggle all, then close individually
 - edit form design
 - hide create category by default
 - better iconography and graphics
 - great logo with custom icon

- Search
- New release update should cache
- Plug bitdb into bit:// for genesis bitdb so we don't have to hardcode it (then we can't default to bitomation...)
should only be able to edit a category on the actual category page

- Forking
 - custom category
 - custom theme
 - customize intro blurb
 - customize css
 - change base tip chain address

- compile step, minify, remove in-browser babel, convert to c:// and export for web & bitcoin output

- Test performance on bitcoinscaling.io
- Check on slow network
- Double check app updates work

## Beta (Friends)
- Find domain: opendirectory.network
- Upload website
- Reset protocol id
- Polish content
- create good examples (collab with bsvdevs, onchain games, onchain art, onchain utilities)

## Pre-launch (Atlantis)
- Test uploading to chain
- Polish polish polish
- first on-chain upload should be a fork from the website

## Launch (Everyone)
- prepare tweet storm
- prepare launch images
- launch on Product Hunt
- 🔥 Launch!

## FEEDBACK
* bitdb bug: event stream is getting messages it shouldn't
* bitdb suggestion: nice to just say "give me OP_RETURN string array" in addition to s1,s2,s3,s4,s5—useful for variable length protocols like MAP
* on-chain planaria... end up doing similar "state processing" code to bring "objects" up to date, eventually will need full Planaria, but for lighter apps, planarium.js?
* protocol processor that's a planaria state machine transformer, but embedded in a bitcoin tx, so everything is still onchain (schema)
* enable regex in jq for more advanced filtering

