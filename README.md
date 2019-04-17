## TODO

* group by categories

* create new category form

* navigate to category url

* collab with bsvdevs and put 'em on chain

* let a user create a category and sign it...then they have control over that category?

* put in fallback for network api partner being down....eventually need bit:// url


------

open questions

* what is best way to create specific protocol from generic MAP protocol? just want to bake in specific keys on top of an action (CRUD)
 - 💡 need a protocol schema!

* should we use vanity addresses for protocols? helps with UX, downside is people might assume it's safe without actually checking

* how to do ownership? want collaboration but maybe need some kind of approval system. don't like my resource? 1-click fork

* MAP isn't a perfect fit for api because you shouldn't be able to DELETE a key on creation

* will Bottle be able to handle including BCAT protocols in <script> tags for 100kb > javascript (like React)

suggestions

* bitdb would be nice to just say "give me OP_RETURN string array" in addition to s1,s2,s3,s4,s5—useful for variable length protocols like MAP

* on-chain planaria... end up doing similar "state processing" code to bring "objects" up to date, planarium.js?
 * could be like a planaria state machine transformer, but embedded in a bitcoin tx, so everything is still onchain
 * in addition to {"r": {"f": ...}} could do bit:// protocol transformations? run it through MAP in-chain protocol to convert s1/s2/s3/s3 to key/values

* bitdb would be nice to have easy way to debug jq/re-run query over and over (ctrl+enter)

* moneybutton should allow donating above additional output amount, so dev can easily earn more baked right in or user can take tip down to $0

* enable regex in jq for more advanced filtering

-----

create a vanity protocol url 1dir…..

can it be it's own protocol but layer existing protocols? like map and then predefine what the keys are?

The Open Directory Protocol (ODP)

* category
  * name
  * description (markdown)
  * parent_category (nullable)
  * MAP extra key/pairs

* entry
  * category_id
  * name
  * description
  * link (b://, c://, d://, txid)
  * priority/order
  * tags
  * MAP extra key/pairs







1dir1234567890abcxyz create.category |
1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5
SET
name "BSVDEVS"
description "All the best blockchain dev resources"
parent <txid://category>

1dir1234567890abcxyz category.update <txid://category> |
1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5
SET
name "BSV DEVS"
description "The best Bitcoin BSV blockchain developer resources"
DELETE
parent

1dir1234567890abcxyz entry.add |
1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5
SET
category <txid://category>
name "Planaria"
link http://planaria.network
description "Infinite API over Bitcoin"
priority 10

1dir1234567890abcxyz tag.add <txid://entry> |
1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5
SET
name "development"
description "Development that's happening 







// good way to store tags?

// how to edit an entry?

// how to change an entry's category_id?



