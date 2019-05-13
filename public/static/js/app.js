class OpenDirectoryApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            isError: false,

            isForking: false,

            location: [""],
            messages: [],

            raw: {},    // response from network
            txpool: [], // semi-processed results from network
            items: [],  // current items
            cache: {},  // previous items

            category: {"txid": null, "needsupdate": true},

            title: "Open Directory",
            intro_markdown: "# Open Directory\n`v1—beta`\n\nOpen Directory lets anyone build resources like [Reddit](https://www.reddit.com), [Awesome Lists](https://github.com/sindresorhus/awesome) and [DMOZ](http://dmoz-odp.org) ontop of Bitcoin (SV). With Open Directory you can:\n\n* 💡 Create your own resource and earn money when people tip through upvotes\n* 💰 Incentivize quality submissions by sharing a portion of tips back to contributors\n* 🛠 Organize an existing directory or fork it with 1-click and start your own\n\nCreate your own directory or view the existing ones below.",
            about_markdown: "# about markdown\nhello world",
            theme: "orange-theme",
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
        this.performCheckForUpdates();
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


    handleSubmitFork(e) {
        console.log("SUBMIT", e);
    }

    handleCloseFork() {
        this.setState({"isForking": false});
    }

    handleChangeTitle(e) {
        this.setState({"title": e.target.value});
    }

    didChangeAboutHandler(e) {
        this.setState({"about_markdown": e.target.value});
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

    // TODO: Split this up
    render() {
        const hash = this.state.location[0];

        var body, loading, error;
        var shouldShowAddNewCategoryForm = false,
            shouldShowAddNewEntryForm = false;
        var changelog;

        if (hash == "about") {
            body = <div className="about">
                    <ReactMarkdown source={this.state.about_markdown} />
                </div>
        } else {

            if (!this.state.isLoading && !this.state.isError) {
                shouldShowAddNewCategoryForm = true;

                if (this.state.category.txid) {
                    shouldShowAddNewEntryForm = true;
                }
            }

            changelog = this.state.raw[this.state.category.txid];

            if (!this.state.isError) {
                body = <List items={this.state.items} category={this.state.category} isError={this.state.isError} isLoading={this.state.isLoading} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} />;
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
        }

        return (
            <div className={this.state.theme + " wrapper"}>
                {this.state.isForking && <Fork onSubmitFork={this.handleSubmitFork.bind(this)} onCloseFork={this.handleCloseFork.bind(this)} introMarkdown={this.state.intro_markdown} onIntroChange={this.didChangeIntroHandler.bind(this)} theme={this.state.theme} onChangeTheme={this.handleChangeTheme.bind(this) } title={this.state.title} onChangeTitle={this.handleChangeTitle.bind(this)} aboutMarkdown={this.state.about_markdown} onAboutChange={this.didChangeAboutHandler.bind(this)} />}
                <nav className="navigation">
                  <section className="container">
                    <a href="/#" className="navigation-title">{this.state.title}</a>
                    <div className={this.state.networkActive ? "spinner white active" : "spinner white"}>
                        <div className="bounce1"></div>
                        <div className="bounce2"></div>
                        <div className="bounce3"></div>
                    </div>
                    <ul className="navigation-list float-right">
                      <li className="navigation-item">
                        <a className="navigation-link" onClick={this.handleToggleFork.bind(this)}>Fork</a>
                        <a className="navigation-link" href="#about">About</a>
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
                          {this.state.isLoading && loading}
                          {this.state.isError && error}
                          <hr />
                          <div className="row">
                              {(shouldShowAddNewEntryForm ? <div className="column"><AddEntryForm category={this.state.category} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} /></div> : null )}
                              <div className="column">
                              {(shouldShowAddNewCategoryForm ? <div><AddCategoryForm category={this.state.category} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} /></div> : null)}
                              </div>
                              {(shouldShowAddNewEntryForm ? null : <div className="column"></div>)}
                          </div>

                          {(shouldShowAddNewEntryForm || shouldShowAddNewCategoryForm) && <hr />}
                            <ChangeLog changelog={changelog} txpool={this.state.txpool} category={this.state.category} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} />
                      </div>

                </div>
            </div>
        );

    }

    performCheckForUpdates() {

        const now = (new Date()).getTime();
        const MAX_CACHE_SECONDS = 60 * 60 * 1; // update every 1 hour

        const storage = window.localStorage;
        const last_update_timestamp = storage["last_update_timestamp"];
        if (last_update_timestamp) {
            const diff = now - last_update_timestamp;

            if (diff < MAX_CACHE_SECONDS * 1000) {
                console.log("Recently checked for updates.... skipping");
                return;
            }
        }

        storage["last_update_timestamp"] = now;
        console.log("Checking for latest version of application");

        getLatestUpdate().then(update => {
            if (document.location.origin != update.uri) {
                console.log("Current location doesn't match latest update URI...new version available", document.location.origin, update.uri);
                const redirect_url = <a href={update.uri}>new version</a>;
                this.addSuccessMessage(<div>{this.state.title} has a {redirect_url} available, check it out!</div>, null, 10000);
            } else {
                console.log("Didn't find a more recent version of application");
            }
        }).catch((e) => {
            console.log("Error while checking for updates", e);
            this.addErrorMessage("Error while checking for updates");
        });
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

        if (hash == "about") {
            title = "About " + this.state.title;
        } else {
            const category_id = (hash == "" ? null : hash);
            const cached = this.state.cache[category_id];

            category = {"txid": category_id, "needsdata": true};

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
        }, () => {
            if (category && category.needsdata) {
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

            const category_id = (this.state.category ? this.state.category.txid : null);
            fetch_from_network(category_id).then((rows) => {

                const txpool = processOpenDirectoryTransactions(rows);
                const results = processResults(rows, txpool);
                const success = this.checkForUpdatedActiveCategory(results);

                console.log("RESULTS", JSON.stringify(results, null, 4));

                const raw = this.state.raw;
                raw[category_id] = rows;

                const cache = this.state.cache;
                cache[category_id] = results;

                this.setState({
                    "networkActive": false,
                    "isLoading": false,
                    "isError": !success,
                    "txpool": txpool,
                    "items": results,
                    "raw": raw,
                    "cache": cache,
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

        const query = get_bitdb_query(this.state.category ? this.state.category.txid : null);
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

