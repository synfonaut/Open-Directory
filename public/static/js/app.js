class OpenDirectoryApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            raw: {},
            cache: {},
            items: [],
            location: [""],
            messages: [],
            category: {"txid": null, "needsupdate": true},
            isLoading: true,
            isError: false,
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
        window.addEventListener('hashchange', this.didUpdateLocation.bind(this), false);
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    performCheckForUpdates() {
        getLatestUpdate().then(update => {
            if (document.location.origin != update.uri) {
                console.log("Current location doesn't match latest update URI...new version available", document.location.origin, update.uri);
                const redirect_url = <a href={update.uri}>new version</a>;
                this.addSuccessMessage(<div>Open Directory has a {redirect_url} available, check it out!</div>, null, 10000);
            }
        }).catch((e) => {
            console.log("Error while checking for updates", e);
            this.addErrorMessage("Error while checking for updates");
        });
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

    render() {
        const hash = this.state.location[0];

        var body, loading, error;
        var shouldShowAddNewCategoryForm = false,
            shouldShowAddNewEntryForm = false;
        var changelog;

        if (hash == "about") {
            body = (
                <div>
                    <h1>About Open Directory</h1>
                    <p>it's early days so no moderation, let's call it a feature instead of a bug for now and see what the market does</p>
                    <p>tip chain</p>
                    <p>tools, milligram, bitdb, moneybutton</p>
                    <p>* add bitcom protocol link on about page</p>
                    <p>* add information about micro payments. they're built into the actions of the site</p>
                    <p>* about with tip screen</p>
                    <p>* about page (BSV particle effect, only run when active)</p>
                     <p><code>v0.1—beta</code> </p>
                    <p>✌️ synfonaut</p>
                </div>
            );
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
                    <p>Loading Open Directory...</p>
                </div>

            error = <div>
                <h2>Error</h2>
                <p><strong>Sorry, there was an error while loading open directory information. Please refresh to try again or contact <a href="https://twitter.com/synfonaut">@synfonaut</a></strong></p>
                <br />
                <p><button onClick={() => { location.reload() }} className="button button-outline">Refresh This Page</button></p>
           </div>
        }


        return (
            <div>
                <nav className="navigation">
                  <section className="container">
                    <a href="/#" className="navigation-title">Open Directory</a>
                    <div className={this.state.networkActive ? "spinner active" : "spinner"}>
                        <div className="bounce1"></div>
                        <div className="bounce2"></div>
                        <div className="bounce3"></div>
                    </div>
                    <ul className="navigation-list float-right">
                      <li className="navigation-item">
                        <a className="navigation-link" href="#about">About</a>
                      </li>
                    </ul>
                  </section>
                </nav>
                <div className="container">
                  <div className="row">
                    <div className="column">
                       <div className="messages">
                           {this.state.messages.map((m) => {
                               return <div key={m.key} className={"message " + m.type}>{m.message}</div>;
                           })}
                      </div>
                      <div className="open-directory">
                          {hash == "" && 
                            <div className="intro">
                              <img id="logo" src="/static/img/logo.png" />
                              <div className="row">
                                  <div className="column">
                                      <p>Open Directory lets anyone build resources like <a href="https://www.reddit.com">Reddit</a>, <a href="https://github.com/sindresorhus/awesome">Awesome Lists</a> and <a href="http://dmoz-odp.org">DMOZ</a> ontop of Bitcoin (SV). With Open Directory you can:</p>
                                      <ul className="blurb">
                                          <li>💡 Create your own resource and earn money when people tip through upvotes</li>
                                          <li>💰 Incentivize quality submissions by sharing a portion of tips back to contributors</li>
                                          <li>🛠 Organize an existing directory or fork it with 1-click and start your own</li>
                                      </ul>
      
                                      <p className="nopadding">Create your own directory or view the existing ones below.</p>
                                  </div>
                              </div>
                            </div>}
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
                          {changelog && 
                              <div className="row">
                                  <div className="column">
                                    <ChangeLog items={changelog} category={this.state.category} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} />
                                  </div>
                              </div>}
                          <div className="row">
                              <div className="column">
                                  <p align="center">built by <a href="https://twitter.com/synfonaut">@synfonaut</a></p>
                              </div>
                          </div>
                      </div>

                    </div>
                  </div>
                </div>
            </div>
        );

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
        var title = "Open Directory";

        if (hash == "about") {
            title = "About Open Directory";
        } else {
            const category_id = (hash == "" ? null : hash);
            const cached = this.state.cache[category_id];

            category = {"txid": category_id, "needsdata": true};

            if (cached) {
                items = cached;

                const cachedCategory = findObjectByTX(category_id, cached);
                if (cachedCategory) {
                    cachedCategory.needsdata = true; // don't know for sure the server hasn't updated since we last cached
                    title = category.name + " — Open Directory";
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


                //console.log("ROWS", JSON.stringify(rows, null, 4));
                //console.log("ROWS", rows.length);

                const raw = this.state.raw;
                raw[category_id] = rows;

                const state = {
                    "raw": raw,
                    "networkActive": false,
                    "isLoading": false,
                    "isError": false
                };

                const results = processResults(rows);
                if (this.state.category && this.state.category.txid && this.state.category.needsdata) { // hacky...better way?
                    var found = false;
                    for (const result of results) {
                        if (result.type == "category" && result.txid == this.state.category.txid) {
                            this.setState({category: result});
                            document.title = result.name + " — Open Directory";
                            found = true;
                            break;
                        }
                    }

                    if (!found) {
                        state["isError"] = true; // category deleted?
                    }
                }

                //console.log("RESULTS", JSON.stringify(results, null, 4));

                const cache = this.state.cache;
                cache[category_id] = results;

                state["cache"] = cache;
                state["items"] = results;
                this.setState(state);
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

    setupNetworkSocket() {

        if (this.socket) {
            console.log("refreshing network socket");
            this.socket.close();
            delete this.socket;
        } else {
            console.log("setting up new network socket");
        }

        const query = get_bitdb_query(this.state.category ? this.state.category.txid : null);
        const url = "https://bitomation.com/s/1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z/" + toBase64(JSON.stringify(query));
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

var application = <OpenDirectoryApp />;
ReactDOM.render(application, document.getElementById("app"));

