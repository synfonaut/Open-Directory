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

            changelog: [],    // response from network
            txpool: [], // semi-processed results from network
            items: [],  // current items

            admin_actions: [],


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
        this.networkAPIFetch();

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

        var changelog = buildRawSliceRepresentationFromCache(this.state.category.txid, this.state.changelog, this.state.items);

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

        // TODO: Need to update forks too

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

    changeURL(path) {
        history.pushState(null, null, path);
        window.scrollTo(0, 0);
        this.didUpdateLocation();
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
            if (items.length == 0) {
                body = (<div className="stats">
                    <h2>Statistics</h2>
                    <p>Please visit the homepage first, let it load then return. This will be fixed soon!</p>
                    </div>);
            } else {

                const changelog = this.buildChangeLog(null);

                var category = <a onClick={() => { this.changeURL("/") }}>Open Directory</a>;
                if (this.state.category.txid) {
                    category = <a onClick={() => { this.changeURL("/category/" + this.state.category.txid) }}>{this.state.category.name}</a>;
                }

                var numCategories = 0;
                var numEntries = 0;
                var numSatoshis = 0;
                var numVotes = 0;
                var biggestTip = 0;
                var biggestTipAddress = null;

                for (const log of changelog) {
                    if (log.data.s2.indexOf("entry") == 0) {
                        numEntries += 1;
                        if (log.satoshis > 0) {
                            numSatoshis += log.satoshis
                            if (log.satoshis > biggestTip) {
                                biggestTip = log.satoshis;
                                biggestTipAddress = log.address;
                            }
                        }
                    } else if (log.data.s2.indexOf("category") == 0) {
                        numCategories += 1;
                        if (log.satoshis > 0) {
                            numSatoshis += log.satoshis
                            if (log.satoshis > biggestTip) {
                                biggestTip = log.satoshis;
                                biggestTipAddress = log.address;
                            }
                        }
                    } else if (log.data.s2 == "vote") {
                        numVotes += 1;
                        if (log.satoshis > 0) {
                            numSatoshis += log.satoshis
                            if (log.satoshis > biggestTip) {
                                biggestTip = log.satoshis;
                                biggestTipAddress = log.address;
                            }
                        }
                    }
                }


                body = (<div className="stats">
                    <h2>Statistics for {category}</h2>
                    <ul>
                        <li>Actions: {changelog.length}</li>
                        <li>Categories: {numCategories}</li>
                        <li>Links: {numEntries}</li>
                        <li>Upvotes: {numVotes}</li>
                        {biggestTip && <li>Biggest tip: {satoshisToDollars(biggestTip)} by {biggestTipAddress}</li>}
                        <li>{numberFormat(numSatoshis / 100000000)} BSV / {satoshisToDollars(numSatoshis, BSV_PRICE)} spent</li>
                        <li>BSV Price: ${BSV_PRICE}</li>
                    </ul>
                    </div>);
            }
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

            changelog = this.buildChangeLog(this.state.category.txid);
            forks = this.getForks();

            if (!this.state.isError) {
                const filtered_items = this.filterOutDetaches(items);
                var list, list_class_name;
                if (this.state.category.txid) {
                    list = <SubcategoryList items={filtered_items} category={this.state.category} isError={this.state.isError} isLoading={this.state.isLoading} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} changeURL={this.changeURL} />;
                    list_class_name = "subcategories";
                } else {
                    list = <div>
                        <HomepageEntries items={filtered_items} isError={this.state.isError} isLoading={this.state.isLoading} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} limit={15} show_category={true} changeURL={this.changeURL} />
                        <div className="clearfix"></div>
                        <HomepageList items={filtered_items} category={this.state.category} isError={this.state.isError} isLoading={this.state.isLoading} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} changeURL={this.changeURL} />
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
            fetch_from_network().then((rows) => {

                if (this.state.changelog.length > 0) {
                    rows = this.state.changelog;
                }

                const txpool = processOpenDirectoryTransactions(rows);
                const results = processResults(rows, txpool);
                const success = this.checkForUpdatedActiveCategory(results);

                this.setState({
                    "networkActive": false,
                    "isLoading": false,
                    "isError": !success,
                    "txpool": txpool,
                    "items": results,
                    "changelog": rows
                });

                this.setupNetworkSocket();
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

            console.log("error during checkForUpdatedActiveCategory");

            return false;
        }
        return true;
    }

    setupNetworkSocket() {
        if (this.socket) {
            return;
        }

        console.log("setting up new network socket");

        const query = get_bitdb_query(this.state.category ? this.state.category.txid : get_root_category_txid());
        const encoded_query = toBase64(JSON.stringify(query));
        const api_url = SETTINGS["api_endpoint"].replace("{api_key}", SETTINGS.api_key).replace("{api_action}", "s");;
        const url = api_url.replace("{query}", encoded_query);

        this.socket = new EventSource(url);
        this.socket.onmessage = (e) => {
            try {
                const resp = JSON.parse(e.data);
                if ((resp.type == "c" || resp.type == "u") && (resp.data.length > 0)) {

                    const rows = [];
                    for (var i = 0; i < resp.data.length; i++) {
                        if (resp.data[i] && resp.data[i].data && resp.data[i].data.s1 == OPENDIR_PROTOCOL) {
                            rows.push(resp.data[i]);
                        }
                    }

                    if (rows.length > 0) {
                        console.log("handled new message", resp);
                        this.insertNewRowsFromNetwork(rows);
                    }
                }


            } catch (e) {
                console.log("error handling network socket data", e.data);
                //throw e;
            }
        }

        this.socket.onerror = (e) => {
            console.log("socket error", e);
            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }

            this.setupNetworkSocket();
        }
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

