## Alpha

* split out lib and my JS file organization
- compile step, minify, remove in-browser babel, convert to c:// and export for web & bitcoin output

- Test performance on bitcoinscaling.io
- Check on slow network

about
    <p>it's early days so no moderation, let's call it a feature instead of a bug for now and see what the market does</p>
    <p>tip chain</p>
    <p>tools, milligram, bitdb, moneybutton</p>
    <p>* add bitcom protocol link on about page</p>
    <p>* add information about micro payments. they're built into the actions of the site</p>
    <p>* about with tip screen</p>
    <p>* bug: no changelog on about page</p>
    <p>clean up static page display logic...</p>
    <p>* about page BSV particle effect, only run when active</p>
    <p>* beta..stuff could break. tip might go to wrong place</p>
    <p>* about, link back to data providers for bitcoin price coinmarketplace, coingecko, cryptonator, cors.io, cors-anywhere</p>
     <p><code>v0.1—beta</code> </p>
    <p><small>Open Directory is an experiment. Be kind. Have fun. Build the future. ✌️</small></p>
    <p>✌️ synfonaut</p>


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

