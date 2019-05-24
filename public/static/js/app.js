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

            raw: {},    // response from network
            txpool: [], // semi-processed results from network
            items: [],  // current items
            cache: {},  // previous items

            admin_actions: [],


            taches: [], // attach and detaches

            category: {"txid": get_root_category_txid(), "needsupdate": true},

            title: SETTINGS.title,
            intro_markdown: SETTINGS.intro_markdown,
            faq_markdown: SETTINGS.faq_markdown,
            theme: SETTINGS.theme,
            template_txid: SETTINGS.template_txid,
        };

        this.NETWORK_DELAY = 0;
        this._isMounted = false;
        this.addSuccessMessage = this.addSuccessMessage.bind(this);
        this.addErrorMessage = this.addErrorMessage.bind(this);
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

        window.addEventListener('hashchange', this.didUpdateLocation.bind(this), false);
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
        const messages = this.state.messages.filter(m => {
            return m.key != key;
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

    buildChangeLog(txid) {
        const admin_changelog = processAdminResults(this.state.admin_actions).filter(r => {
            // show homepage redirects
            if (!txid && r.type == "uri") { return true }

            // if action_id references this txid
            if (r.action_id == txid) { return true }

            // check if action_id references
            if (r.action_id) {
                const obj = findObjectByTX(r.action_id, this.state.items);
                if (obj && obj.type == "category" && (!obj.category_id || obj.txid == r.action_id)) {
                    return true;
                }
            }

            return false;
        });

        var changelog = this.state.raw[this.state.category.txid];
        if (!changelog) {
            changelog = [];
        }

        changelog = changelog.filter(r => {
            return OPENDIR_ACTIONS.indexOf(r.data.s2) !== -1;
        });

        const combined = changelog.concat(admin_changelog);

        const sorted = combined.sort(function(a, b) {
            return (a.height===null)-(b.height===null) || +(a.height>b.height) || -(a.height<b.height);
        });

        return sorted;
    }

    handleChangeCategory(txid) {
        SETTINGS.category = txid;
        this.didUpdateLocation();
    }

    getForks() {
        const txid = this.state.category.txid;

        const forks = this.state.txpool.filter(i => {
            return i.type == "fork";
        });

        const sorted = forks.sort(function(a, b) {
            if (a.satoshis < b.satoshis) { return 1; }
            if (a.satoshis > b.satoshis) { return -1; }
            return 0;
        });

        return sorted;
    }

    handleExpandAddCategoryForm() {
        this.setState({"isExpandingAddCategoryForm": true});
    }

    handleExpandAddEntryForm() {
        this.setState({"isExpandingAddEntryForm": true});
    }

    render() {
        const hash = this.state.location[0];

        var body, loading, error;
        var shouldShowAddNewCategoryForm = false,
            shouldShowAddNewEntryForm = false;
        var changelog;
        var forks;

        if (hash == "faq") {
            body = <div className="faq">
                    <ReactMarkdown source={this.state.faq_markdown} />
                </div>
        } else if (hash == "search") {
            body = <SearchPage title={this.state.title} items={this.state.items} category={this.state.category} />
        } else if (hash == "add-directory") {
            body = <AddDirectoryPage category={this.state.category} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} />
        } else {

            if (!this.state.isLoading && !this.state.isError) {
                shouldShowAddNewCategoryForm = true;

                if (this.state.category.txid) {
                    shouldShowAddNewEntryForm = true;
                }
            }

            changelog = this.buildChangeLog(this.state.category.txid);
            forks = this.getForks();


            if (!this.state.isError) {
                const filtered_items = this.filterOutDetaches(this.state.items);
                body = <div className="list-wrapper"><List items={filtered_items} category={this.state.category} isError={this.state.isError} isLoading={this.state.isLoading} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} /></div>;
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
            intro = <div className="intro"><h1><i className="fas fa-sitemap"></i> Open Directory</h1><ReactMarkdown source={this.state.intro_markdown} /></div>;
        }

        return (
            <div className={this.state.theme + " wrapper"}>
                {this.state.isForking && <Fork onCloseFork={this.handleCloseFork.bind(this)} onErrorHandler={this.addErrorMessage} introMarkdown={this.state.intro_markdown} onIntroChange={this.didChangeIntroHandler.bind(this)} theme={this.state.theme} onChangeTheme={this.handleChangeTheme.bind(this) } title={this.state.title} onChangeTitle={this.handleChangeTitle.bind(this)} faqMarkdown={this.state.faq_markdown} onFAQChange={this.didChangeFAQHandler.bind(this)} items={this.state.items} onChangeCategory={this.handleChangeCategory.bind(this)} template_txid={this.state.template_txid} />}
                <nav className="navigation">
                  <section className="container">
                    <a href="/#" className="navigation-title"><i className="fas fa-sitemap"></i>{this.state.title}</a>
                    <div className={this.state.networkActive ? "spinner white active" : "spinner white"}>
                        <div className="bounce1"></div>
                        <div className="bounce2"></div>
                        <div className="bounce3"></div>
                    </div>
                    <ul className="navigation-list float-right">
                      <li className="navigation-item">
                        <a className="navigation-link nav-search" href="#search"><i className="fas fa-search"> </i>Search</a>
                        <a className="navigation-link nav-faq" href="#faq">FAQ</a>
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
                                    return <Message key={m.key} className={"message " + m.type}>{m.message}</Message>;
                                })}
                              </MessageGroup>}
                          </PoseGroup>
                          {hash == "" && intro}
                          {body}
                          {(this.state.isLoading && this.state.items.length == 0) && loading}
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
                            {!this.state.isLoading && <ForkLog forks={forks} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} />}
                            {!this.state.isLoading && <ChangeLog changelog={changelog} txpool={this.state.txpool} category={this.state.category} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} />}
                      </div>

                </div>
            </div>
        );

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
        if (document.location.hostname == "dir.sv") {
            console.log("Skipping app update check since running at http/https");
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
        return window.location.hash.replace(/^#\/?|\/$/g, '').split('/');
    }

    didUpdateLocation() {
        const location = this.getLocation();
        const hash = location[0];

        console.log("location updated", hash);

        var category = this.state.category;
        var items = [];
        var title = this.state.title;
        var needsupdate = false;

        if (hash == "faq") {
            title = "FAQ " + this.state.title;
        } else if (hash == "search") {
            title = "Search " + this.state.title;
            needsupdate = true;
        } else if (hash == "add-directory") {
            title = "Add directory to " + this.state.title;
            needsupdate = true;
        } else {
            const category_id = (hash == "" ? get_root_category_txid() : hash);
            const cached = this.state.cache[category_id];

            category = {"txid": category_id, "needsdata": true};
            needsupdate = true;

            if (cached) {
                items = cached;

                const cachedCategory = findObjectByTX(category_id, cached);
                if (cachedCategory) {
                    cachedCategory.needsdata = true; // don't know for sure the server hasn't updated since we last cached
                    title = category.name + " — " + this.state.title;
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
            "items": items,
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

            const category_id = (this.state.category ? this.state.category.txid : get_root_category_txid());
            fetch_from_network(category_id).then((rows) => {

                const txpool = processOpenDirectoryTransactions(rows);

                // Hacky..
                // At the 11th hour I found a bug where my bitomation.com genesis BitDB is missing some media transactions
                // Rather than defer launch, this hack grabs the media txds from another genesis server...this should only matter for the first few days until it can be officially reindexed and fixed

                const media_txids = txpool.filter(r => {
                    return r.type == "entry";
                }).map(r => {
                    if (r.change && r.change.link) {
                        const url = r.change.link;
                        return parseTransactionAddressFromURL(url);
                    }
                }).filter(r => { return r });

                fetch_bmedia_from_network(media_txids).then(media => {

                    const processed_media = processOpenDirectoryTransactions(media);
                    const merged_txs = txpool.concat(processed_media);

                    const results = processResults(rows, merged_txs);
                    const success = this.checkForUpdatedActiveCategory(results);

                    const raw = this.state.raw;
                    raw[category_id] = rows;

                    const cache = this.state.cache;
                    cache[category_id] = results;

                    this.setState({
                        "networkActive": false,
                        "isLoading": false,
                        "isError": !success,
                        "txpool": merged_txs,
                        "items": results,
                        "raw": raw,
                        "cache": cache,
                    });

                    this.setupNetworkSocket();
                });

            }).catch((e) => {
                console.log("error", e);
                this.setState({
                    "isLoading": false,
                    "networkActive": false,
                    "isError": true,
                });
            });


        }, this.NETWORK_DELAY);
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

            return false;
        }
        return true;
    }

    setupNetworkSocket() {
        if (this.socket) {
            console.log("refreshing network socket");
            this.socket.close();
            delete this.socket;
        } else {
            console.log("setting up new network socket");
        }

        const query = get_bitdb_query(this.state.category ? this.state.category.txid : get_root_category_txid());
        const encoded_query = toBase64(JSON.stringify(query));
        const api_url = SETTINGS["api_endpoint"].replace("{api_key}", SETTINGS.api_key).replace("{api_action}", "s");;
        const url = api_url.replace("{query}", encoded_query);

        this.socket = new EventSource(url);
        this.socket.onmessage = (e) => {
            try {
                const resp = JSON.parse(e.data);
                if ((resp.type == "c" || resp.type == "u") && (resp.data.length > 0)) {

                    var needsUpdate = false;
                    for (var i = 0; i < resp.data.length; i++) {
                        if (resp.data[i] && resp.data[i].data && resp.data[i].data.s1 == OPENDIR_PROTOCOL) {
                            needsUpdate = true;
                        }
                    }

                    if (needsUpdate) {
                        console.log("handled new message", resp);
                        this.networkAPIFetch();
                    } else {
                        console.log("unhandled message", resp);
                    }
                }


            } catch (e) {
                console.log("error handling network socket data", e.data);
            }
        }
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

