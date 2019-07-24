let { MoneyButtonClient } = require('@moneybutton/api-client')

const moneyButtonClient = new MoneyButtonClient("abcd")

import SETTINGS from "./settings";
import {
    fetch_from_network,
    fetch_changelog_from_network,
    fetch_homepage_from_network,
    get_root_category_txid,
    get_bitdb_query,
    buildItemSliceRepresentationFromCache,
    buildRawSliceRepresentationFromCache,
    processOpenDirectoryTransactions,
    processResults,
    OPENDIR_ACTIONS,
} from "./process";
import { processAdminResults, getCachedAdminActions } from "./admin";
import { HomepageEntries, HomepageList, SubcategoryList } from "./list";
import { SearchPage } from "./search";
import { AddEntryForm } from "./entry";
import { AddDirectoryPage, AddCategoryForm } from "./category";
import { toBase64, pluralize, satoshisToDollars, numberFormat, findObjectByTX } from "./helpers";
import { ChangeLog } from "./changelog";
import { getLatestUpdate } from "./updater";
import { Fork, ForkLog } from "./fork";
import { updateBitcoinSVPrice } from "./bsv_price";


class OpenDirectoryApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            isError: false,
            isExpandingAddCategoryForm: false,
            isExpandingAddEntryForm: false,

            isForking: false,

            location: [""],
            messages: [],

            changelog: [],           // response from network
            txpool: [],              // semi-processed results from network
            items: [],               // current items
            homepageEntries: [],     // homepage entries (scaling fix)
            homepageCategories: [],  // homepage categories (scaling fix)

            homepageEntriesSort: "hot",
            homepageCategoriesSort: "hot",

            admin_actions: [],

            path: "",

            taches: [], // attach and detaches

            category: {"txid": get_root_category_txid(), "needsupdate": true},
            link: null,

            title: SETTINGS.title,
            intro_markdown: SETTINGS.intro_markdown,
            faq_markdown: SETTINGS.faq_markdown,
            theme: SETTINGS.theme,
            template_txid: SETTINGS.template_txid,
        };

        this.tag = "beta";

        this.NETWORK_DELAY = 0;
        this._isMounted = false;
        this.addSuccessMessage = this.addSuccessMessage.bind(this);
        this.addErrorMessage = this.addErrorMessage.bind(this);
        this.didUpdateLocation = this.didUpdateLocation.bind(this);
        this.changeURL = this.changeURL.bind(this);
    }

    componentDidCatch(error, info) {
        console.log("ERROR", error, info);
    }

    componentDidMount() {
        this._isMounted = true;
        this.didUpdateLocation();
        this.performAdminActionsFetch();
        this.detectTemplateIDFromAddress();

        updateBitcoinSVPrice();

        window.addEventListener('popstate', this.didUpdateLocation.bind(this), false);
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    addMessage(msg, type, cb=null, timeout=5000) {
        const key = (new Date()).getTime();
        const messages = this.state.messages.concat([{
            "type": type, "message": msg, "key": key,
        }]);

        this.setState({ "messages": messages }, () => {
            setTimeout(() => {
                this.hideMessage(key);
            }, timeout);
            if (cb) { cb(); }
        });
    }

    addSuccessMessage(msg, cb=null, timeout=5000) {
        this.addMessage(msg, "success", cb, timeout);
    }

    addErrorMessage(msg, cb=null, timeout=5000) {
        this.addMessage(msg, "error", cb, timeout);
    }

    hideMessage(key) {
        const messages = this.state.messages.map(m => {
            if (m.key == key) {
                m.deleted = true;
            }
            return m;
        });

        this.setState({ "messages": messages });
    }

    detectTemplateIDFromAddress() {
        // If template_txid is not set, attempt to detect it from our current address
        if (!this.state.template_txid) {
            const url = document.location.href;
            var template_txid;

            if (url.indexOf("bit://") !== -1) {
                const parts = url.split("/");
                if (parts.length !== 4) {
                    console.log("Unable to detect template ID from address, unknown parts in url");
                    return;
                }

                if ((parts[2] !== B_MEDIA_PROTOCOL) && (parts[2] !== BCAT_MEDIA_PROTOCOL)) {
                    console.log("Unable to detect template ID from address, unknown parts in url");
                    return;
                }

                template_txid = parts[3];
            } else if ((url.indexOf("b://") !== -1) || (url.indexOf("bcat://") !== -1)) {
                const parts = url.split("/");
                template_txid = parts[2];
            }

            if (template_txid) {
                if (template_txid.length !== 64) {
                    console.log("Unable to detect valid template ID from address, invalid tx");
                    return;
                }

                console.log("Successfully detected template_txid", template_txid, "from address", url);
                this.setState({"template_txid": template_txid});
            }
        }

    }


    handleCloseFork() {
        this.setState({"isForking": false});
    }

    handleChangeTitle(e) {
        this.setState({"title": e.target.value});
    }

    didChangeFAQHandler(e) {
        console.log("FAQ", e.target.value);
        this.setState({"faq_markdown": e.target.value});
    }

    handleToggleFork() {
        this.setState({"isForking": !this.state.isForking});
    }

    didChangeIntroHandler(e) {
        this.setState({"intro_markdown": e.target.value});
    }

    handleChangeTheme(theme) {
        this.setState({"theme": theme});
    }

    handleChangeCategory(txid) {
        SETTINGS.category = txid;
        this.didUpdateLocation();
    }

    handleExpandAddCategoryForm() {
        this.setState({"isExpandingAddCategoryForm": true});
    }

    handleExpandAddEntryForm() {
        this.setState({"isExpandingAddEntryForm": true});
    }

    changeURL(path) {
        history.pushState(null, null, path);
        window.scrollTo(0, 0);
        this.didUpdateLocation();
    }

    handleChangeHomepageEntriesSortOrder(order) {
        if (order == "time") {
            this.setState({"homepageEntriesSort": "time"});
        } else if (order == "votes") {
            this.setState({"homepageEntriesSort": "votes"});
        } else if (order =="money") {
            this.setState({"homepageEntriesSort": "money"});
        } else {
            this.setState({"homepageEntriesSort": "hot"});
        }

        this.networkAPIFetch();
    }

    handleChangeHomepageCategoriesSortOrder(order) {
        if (order == "time") {
            this.setState({"homepageCategoriesSort": "time"});
        } else if (order == "votes") {
            this.setState({"homepageCategoriesSort": "votes"});
        } else if (order =="money") {
            this.setState({"homepageCategoriesSort": "money"});
        } else if (order =="submissions") {
            this.setState({"homepageCategoriesSort": "submissions"});
        } else {
            this.setState({"homepageCategoriesSort": "hot"});
        }

        this.networkAPIFetch();
    }

    render() {
        const path = this.getLocation();

        const items = buildItemSliceRepresentationFromCache(this.state.category.txid, this.state.items);

        var body, loading, error;
        var shouldShowAddNewCategoryForm = false,
            shouldShowAddNewEntryForm = false;
        var changelog;
        var forks;

        if (path == "/faq") {
            body = <div className="faq">
                    <ReactMarkdown source={this.state.faq_markdown} />
                </div>
        } else if (path == "/stats") {
            // TODO: Refactor into StatsPage
            // TODO: This looks like duplicate
            body = (<div className="stats">
                <h2>Statistics</h2>
                <p>Stats will be coming back soon!</p>
                </div>);
        } else if (path == "/search") {
            body = <SearchPage title={this.state.title} items={items} category={this.state.category} changeURL={this.changeURL} />
        } else if (path == "/add-directory") {
            body = <AddDirectoryPage category={this.state.category} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} />
        } else if (this.state.link) {

            // TODO: Move all this to an LinkPage
            var back;
            if (this.state.category) {
                const root_category_txid = get_root_category_txid();
                if (root_category_txid == null || this.props.category.txid !== root_category_txid) {
                    var parent_url = "/category/" + this.state.category.txid;
                    if (this.state.category.txid == root_category_txid) {
                        parent_url = "/";
                    }

                    back = <div className="back"><a onClick={() => { this.props.changeURL(parent_url) }}><i className="fas fa-long-arrow-alt-left"></i> {parent.name}</a><hr /></div>;
                }

            }

            body = (<div className="link-meta" id={this.state.link.txid}>
                    {back}
                    <div className="upvoteContainer">
                        <div className="upvote"><a><i className="fas fa-chevron-up"></i></a> <span className="number satoshis" title={this.state.link.satoshis + " sats"}>{this.state.link.satoshis}</span><span className="number votes" title={this.state.link.hottness + " hottness"}>{pluralize(this.state.link.votes, "vote", "votes")}</span></div>
                            <div>
                                <h1>{this.state.link.name}
                                </h1>
                                <div className="markdown"><ReactMarkdown source={this.state.link.description} /></div>
                                <div className="clearfix"></div>
                            </div>
                        </div></div>);
        } else {

            if (!this.state.isLoading && !this.state.isError) {
                shouldShowAddNewCategoryForm = true;

                if (this.state.category.txid) {
                    shouldShowAddNewEntryForm = true;
                }
            }

            if (!this.state.isError) {
                const filtered_items = this.filterOutDetaches(items);
                var list, list_class_name;
                if (this.state.category.txid) {
                    list = <SubcategoryList items={filtered_items} category={this.state.category} isError={this.state.isError} isLoading={this.state.isLoading} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} changeURL={this.changeURL} />;
                    list_class_name = "subcategories";
                } else {
                    list = <div>
                        <HomepageEntries items={this.state.homepageEntries} isError={this.state.isError} isLoading={this.state.isLoading} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} limit={15} show_category={true} changeURL={this.changeURL} sort={this.state.homepageEntriesSort} handleChangeSortOrder={this.handleChangeHomepageEntriesSortOrder.bind(this)} />
                        <HomepageList items={this.state.homepageCategories} category={this.state.category} isError={this.state.isError} isLoading={this.state.isLoading} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} changeURL={this.changeURL} sort={this.state.homepageCategoriesSort} handleChangeSortOrder={this.handleChangeHomepageCategoriesSortOrder.bind(this)} />
                        <div className="clearfix"></div>
                    </div>;
                    list_class_name = "homepage";
                }

                body = <div className={list_class_name + " list-wrapper"}>{list}</div>;
            }

            loading = <div className="loading">
                    <div className="spinner">
                        <div className="bounce1"></div>
                        <div className="bounce2"></div>
                        <div className="bounce3"></div>
                    </div>
                    <p>Loading {this.state.title}...</p>
                </div>

            error = <div>
                <h2>Error</h2>
                <p><strong>Sorry, there was an error while loading open directory information. Please refresh to try again or contact <a href="https://twitter.com/synfonaut">@synfonaut</a></strong></p>
                <br />
                <p><button onClick={() => { location.reload() }} className="button button-outline">Refresh This Page</button></p>
           </div>
        }

        var intro;
        if (this.state.intro_markdown) {
            intro = <div className="intro"><ReactMarkdown source={this.state.intro_markdown} /></div>;
        } else {
            intro = intro = <div className="intro">
                    <h1><i className="fas fa-sitemap"></i> Open Directory <span className="beta">{this.tag}</span></h1>
                    <div className="learn-more">
                        <p>Open Directory is an open-source way for anyone to earn money by organizing links on the Bitcoin (SV) blockchain. Find the best content and earn money by submitting great links! {!this.state.isExpandingLearnMore && <span><a href="/faq">Learn more</a>...</span>}</p>
                        
                    </div>
                    <SearchPage title={this.state.title} items={items} category={this.state.category} embed={true} changeURL={this.changeURL} />
                </div>;
        }

        return (
            <div className={this.state.theme + " wrapper"}>
                {this.state.isForking && <Fork onCloseFork={this.handleCloseFork.bind(this)} onErrorHandler={this.addErrorMessage} introMarkdown={this.state.intro_markdown} onIntroChange={this.didChangeIntroHandler.bind(this)} theme={this.state.theme} onChangeTheme={this.handleChangeTheme.bind(this) } title={this.state.title} onChangeTitle={this.handleChangeTitle.bind(this)} faqMarkdown={this.state.faq_markdown} onFAQChange={this.didChangeFAQHandler.bind(this)} items={items} onChangeCategory={this.handleChangeCategory.bind(this)} template_txid={this.state.template_txid} />}
                <nav className="navigation">
                  <section className="container">
                    <div className="navigation-title">
                        <a onClick={() => { this.changeURL("/") }}><i className="fas fa-sitemap"></i>{this.state.title}</a>
                        <span className="beta">{this.tag}</span>
                    </div>
                    <div className={this.state.networkActive ? "spinner white active" : "spinner white"}>
                        <div className="bounce1"></div>
                        <div className="bounce2"></div>
                        <div className="bounce3"></div>
                    </div>
                    <ul className="navigation-list float-right">
                      <li className="navigation-item">
                        <a className="navigation-link nav-search" onClick={() => { this.changeURL("/search") }}><i className="fas fa-search"> </i>Search</a>
                        <a className="navigation-link nav-stats" onClick={() => { this.changeURL("/stats") }}>Stats</a>
                        <a className="navigation-link nav-faq" onClick={() => { this.changeURL("/faq") }}>FAQ</a>
                        <a className="navigation-link nav-fork" onClick={this.handleToggleFork.bind(this)}>Fork</a>
                      </li>
                    </ul>
                  </section>
                </nav>
                <div className="container">
                      <div className="open-directory">
                          <PoseGroup>
                            {(this.state.messages.length > 0) && <MessageGroup key="message_group" className="messages">
                                {this.state.messages.map((m) => {
                                    const classes = ["message", m.type];
                                    if (m.deleted) {
                                        classes.push("deleted");
                                    }
                                    return <Message key={m.key} className={classes.join(" ")}>{m.message}</Message>;
                                })}
                              </MessageGroup>}
                          </PoseGroup>
                          {path == "/" && intro}
                          {body}
                          {(this.state.isLoading && items.length == 0) && loading}
                          {this.state.isError && error}
                          <hr />
                          <div className="row">

                              {(shouldShowAddNewEntryForm) ? <div className="column">
                                  {!this.state.isExpandingAddEntryForm && <div className="add-entry-callout">
                                    <a onClick={this.handleExpandAddEntryForm.bind(this)}><i class="fas fa-link"></i> Submit a new link</a>
                                    <p>Earn <i className="fab fa-bitcoin"></i> Bitcoin (SV) by submitting valuable content—when it gets upvoted you'll receive a portion of the tip!</p>
                                  </div>}
                                  {this.state.isExpandingAddEntryForm && <AddEntryForm category={this.state.category} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} />}
                                   </div> : null}


                              {(shouldShowAddNewCategoryForm && !shouldShowAddNewEntryForm) ? <div className="row"><div className="column">
                                  {!this.state.isExpandingAddCategoryForm && <div className="add-directory-callout">
                                        <a onClick={this.handleExpandAddCategoryForm.bind(this)}><i class="fas fa-folder"></i> Create a new directory</a>
                                        <p>Earn <i className="fab fa-bitcoin"></i> Bitcoin (SV) by creating a new directory—when someone submits content and it gets upvoted you'll receive a portion of the tip! </p>
                                      </div>}
                                  {this.state.isExpandingAddCategoryForm && <AddCategoryForm category={this.state.category} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} />}
                                   </div><div className="column"></div></div> : null}

                              {(shouldShowAddNewCategoryForm && shouldShowAddNewEntryForm) ? <div className="column">
                                  {!this.state.isExpandingAddCategoryForm && <div className="add-category-callout">
                                        <a onClick={this.handleExpandAddCategoryForm.bind(this)}><i class="fas fa-folder"></i> Create a new subcategory </a>
                                        <p>Earn <i className="fab fa-bitcoin"></i> Bitcoin (SV) by creating a new subcategory—when someone submits content and it gets upvoted you'll receive a portion of the tip! </p>
                                      </div>}
                                  {this.state.isExpandingAddCategoryForm && <AddCategoryForm category={this.state.category} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} />}
                                   </div> : null}
                          </div>
                          {(shouldShowAddNewEntryForm || shouldShowAddNewCategoryForm) && <hr />}
                          {((this.state.path == "/" || this.state.path.indexOf("/category") == 0) && !this.state.isLoading) && <ChangeLog changelog={this.state.changelog} category={this.state.category} showMoreChangeLogs={this.checkForMoreChangeLogs.bind(this)} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} />}
                      </div>

                </div>
            </div>
        );

    }

    checkForMoreChangeLogs() {
        const cursor = this.state.changelog.length;
        fetch_changelog_from_network(this.state.category.txid, cursor).then((changelogs) => {
            this.setState({"changelog": this.state.changelog.concat(changelogs)});
        });
    }

    performAdminActionsFetch() {
        getCachedAdminActions().then(actions => {
            this.setState({"admin_actions": actions});

            this.performAdminUpdateCheck();
        }).catch(e => {
            console.log("Error while checking for admin actions", e);
            this.addErrorMessage("Error while checking for admin actions");
        });
    }

    performAdminUpdateCheck() {

        // TODO: Figure out best way to handle this
        // General thought was if deployed to http then don't redirect, but that doesn't work for bico.media and others
        // Need a good way to know when should we redirect?
        if (document.location.hostname == "dir.sv" || document.location.hostname == "alpha.dir.sv") {
            console.log("Skipping app update check since running at known http/https site");
            return;
        }

        const currentURL = [location.protocol, '//', location.host, location.pathname].join('');

        getLatestUpdate().then(update => {
            if (currentURL != update.uri) {
                console.log("Current location doesn't match latest update URI...new version available", currentURL, update.uri);
                const redirect_url = <a href={update.uri}>new version</a>;
                this.addSuccessMessage(<div>{this.state.title} has a {redirect_url} available, check it out!</div>, null, 10000);
            } else {
                console.log("Using most recent version of app");
            }
        });
    }

    getOldLocation() {
        return window.location.hash.replace(/^#\/?|\/$/g, '').split('/');
    }

    filterOutDetaches(results) {

        const taches = processAdminResults(this.state.admin_actions)
            .filter(a => { return a.action == "attach" || a.action == "detach" });
        if (results.length > 0 && taches.length > 0) {
            for (const tach of taches) {
                const result = findObjectByTX(tach.action_id, results);
                if (result) {
                    if (tach.action == "detach") {
                        result.detached = true;
                    } else if (tach.action == "attach") {
                        delete result["detached"];
                    }
                } else {
                    // console.log("unable to find result for tach", tach);
                }
            }
        }

        return results.filter(r => { return !r.detached });
    }

    getLocation() {
        var path = window.location.pathname;

        if (path == "/") {
            const hash = this.getOldLocation();
            if (hash.length == 1 && hash[0] !== "") {
                path = "/category/" + hash[0]; // support the old hash url system
            }
        }


        return path;
    }




    didUpdateLocation() {
        const path = this.getLocation();

        console.log("location updated", path);

        var category = this.state.category;
        var link = this.state.link;
        var items = [];
        var title = this.state.title;
        var needsupdate = false;

        if (path == "/faq") {
            title = "FAQ " + this.state.title;
        } else if (path == "/stats") {
            title = "Statistics for " + this.state.title;
            items = buildItemSliceRepresentationFromCache(category.txid, this.state.items);
        } else if (path == "/search") {
            title = "Search " + this.state.title;
            needsupdate = true;
        } else if (path == "/add-directory") {
            title = "Add directory to " + this.state.title;
            needsupdate = true;
        } else {
            var category_id;
            if (path == "/") {
                category_id = get_root_category_txid();
            } else {
                const parts = path.split("/");
                if (parts.length > 0) {
                    if (parts[1] == "category") {
                        category_id = parts[2];
                    } else {
                        console.log("CANT FIND CATEGORY", parts);
                        this.setState({"isError": true, "isLoading": false});
                        return;
                    }

                } else {
                    console.log("CANT FIND CATEGORY", path);
                    this.setState({"isError": true, "isLoading": false});
                    return;
                }
            }

            const cached = buildItemSliceRepresentationFromCache(category_id, this.state.items);

            category = {"txid": category_id, "needsdata": true};
            needsupdate = true;

            if (cached && cached.length > 0) {
                items = cached;

                const cachedCategory = findObjectByTX(category_id, this.state.items);
                if (cachedCategory) {
                    cachedCategory.needsdata = true; // don't know for sure the server hasn't updated since we last cached
                    title = cachedCategory.name + " — " + this.state.title;
                    category = cachedCategory;
                }
            }
        }

        document.title = title;

        if (location !== this.state.location) {
            window.scrollTo(0, 0);
        }

        this.setState({
            "location": location,
            "category": category,
            "link": link,
            "items": items,
            "path": path,
            "isExpandingAddCategoryForm": false,
            "isExpandingAddEntryForm": false,
        }, () => {
            if (needsupdate) {
                this.networkAPIFetch();
            }
        });
    }

    networkAPIFetch() {

        console.log("network fetching");

        var state = {networkActive: true};

        if (this.state.items.length == 0) {
            state.isLoading = true;
        }

        this.setState(state);
        setTimeout(() => {
            if (this.state.category.txid == null) {
                this.networkAPIFetchHomepage();
            } else {
                this.networkAPIFetchCategory();
            }
        }, this.NETWORK_DELAY);
    }

    networkAPIFetchHomepage() {
        this.setState({
            "changelog": [],
            "items": [],
            "isLoading": true,
            "networkActive": true,
            "homepageEntries": [],
            "homepageCategories": [],
        }, function() {

            fetch_homepage_from_network("links", this.state.homepageEntriesSort).then((results) => {
                this.setState({
                    "networkActive": false,
                    "isLoading": false,
                    "homepageEntries": results,
                });
            }).catch((e) => {
                console.log("error loading homepage links", e);
                this.setState({
                    "isLoading": false,
                    "networkActive": false,
                    "isError": true,
                });
            });

            setTimeout(() => {
                fetch_homepage_from_network("categories", this.state.homepageCategoriesSort).then((results) => {
                    this.setState({
                        "networkActive": false,
                        "isLoading": false,
                        "homepageCategories": results,
                    });
                }).catch((e) => {
                    console.log("error loading homepage categories", e);
                    this.setState({
                        "isLoading": false,
                        "networkActive": false,
                        "isError": true,
                    });
                });
            }, 50);

            setTimeout(() => {
                fetch_changelog_from_network(this.state.category.txid, 0).then((changelogs) => {
                    this.setState({"changelog": changelogs.slice(0, 5)});
                });
            }, 100);
        });

    }

    networkAPIFetchCategory() {
        fetch_from_network(this.state.category.txid).then((data) => {
            const results = data.slice;
            const changelog = data.changelog;

            const success = this.checkForUpdatedActiveCategory(results);
            this.setState({
                "networkActive": false,
                "isLoading": false,
                "isError": !success,
                "items": results,
                "changelog":changelog 
            });
        }).catch((e) => {
            console.log("error", e);
            this.setState({
                "isLoading": false,
                "networkActive": false,
                "isError": true,
            });
        });
    }

    checkForUpdatedActiveCategory(results) {
        if (this.state.category && this.state.category.txid && this.state.category.needsdata) { // hacky...better way?
            for (const result of results) {
                if (result.type == "category" && result.txid == this.state.category.txid) {
                    this.setState({category: result});
                    document.title = result.name + " — " + this.state.title;
                    return true;
                }
            }

            console.log("error during checkForUpdatedActiveCategory");

            return false;
        }
        return true;
    }

    setupNetworkSocket() {
    }

    insertNewRowsFromNetwork(socket_rows) {
        console.log("Inserting new rows from network", socket_rows.length);

        fetch_raw_txid_results(socket_rows).then(new_rows => {
            const rows = addNewRowsToExistingRows(new_rows, this.state.changelog);
            const txpool = processOpenDirectoryTransactions(rows);
            const results = processResults(rows, txpool);

            const success = this.checkForUpdatedActiveCategory(results);

            var category = this.state.category;
            if (category.txid) {
                category = findObjectByTX(this.state.category.txid, results);
            }

            this.setState({
                "isError": !success,
                "txpool": txpool,
                "items": results,
                "category": category,
                "changelog": rows
            });
        });
    }
}

const MessageGroup = posed.div({
    enter: {
        applyAtStart: { display: "block" },
        opacity: 1,
        beforeChildren: true,
    },
    exit: {
        applyAtEnd: { display: "none" },
        opacity: 0,
        beforeChildren: true
    }
});

const Message = posed.div({
});

var application = <OpenDirectoryApp />;
ReactDOM.render(application, document.getElementById("app"));

