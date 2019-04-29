class OpenDirectoryApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
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

    addMessage(msg, type, cb=null) {
        const key = (new Date()).getTime();
        const messages = this.state.messages.concat([{
            "type": type, "message": msg, "key": key,
        }]);

        this.setState({ "messages": messages }, () => {
            setTimeout(() => {
                this.hideMessage(key);
            }, 5000);
            if (cb) { cb(); }
        });
    }

    addSuccessMessage(msg, cb=null) {
        this.addMessage(msg, "success", cb);
    }

    addErrorMessage(msg, cb=null) {
        this.addMessage(msg, "error");
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

            body = <List items={this.state.items} category={this.state.category} isLoading={this.state.isLoading} onSuccessHandler={this.addSuccessMessage} onErrorHandler={this.addErrorMessage} />;

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

    componentDidMount() {
        this._isMounted = true;
        this.didUpdateLocation();
        window.addEventListener('hashchange', this.didUpdateLocation.bind(this), false);
    }

    componentWillUnmount() {
        this._isMounted = false;
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

                const results = processResults(rows);
                if (this.state.category && this.state.category.needsdata) { // hacky...better way?
                    for (const result of results) {
                        if (result.type == "category" && result.txid == this.state.category.txid) {
                            this.setState({category: result});
                            document.title = result.name + " — Open Directory";
                            break;
                        }
                    }
                }

                const cache = this.state.cache;

                cache[category_id] = results;

                this.setState({
                    "cache": cache,
                    "items": results,
                    "networkActive": false,
                    "isLoading": false,
                    "isError": false
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

class List extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            "sort": "votes",
            "limit": 10,
            "cursor": 0,
        };
    }

    getCategories() {
        const category_id = (this.props.category ? this.props.category.txid: null);
        const categories = this.props.items.filter(i => { return !i.deleted && i.type == "category" && i.category == category_id });
        return categories.sort((a, b) => {
            if (a.votes < b.votes) { return 1; }
            if (a.votes > b.votes) { return -1; }
            if (a.entries < b.entries) { return 1; }
            if (a.entries > b.entries) { return -1; }
            if (a.height < b.height) { return 1; }
            if (a.height > b.height) { return -1; }
            return 0;
        });
    }

    getEntries() {
        if (this.props.category) {
            const entries = this.props.items.filter(i => { return !i.deleted && i.type == "entry" && i.category && i.category == this.props.category.txid });
            return entries.sort((a, b) => {
                if (this.state.sort == "time") {
                    if (!a.height) { return -1; }
                    if (a.height < b.height) { return 1; }
                    if (a.height > b.height) { return -1; }
                } else {
                    if (a.votes < b.votes) { return 1; }
                    if (a.votes > b.votes) { return -1; }
                    if (a.height < b.height) { return 1; }
                    if (a.height > b.height) { return -1; }
                }
                return 0;
            });
        }

        return [];
    }

    findCategoryByTXID(txid) {
        return this.props.items.filter(i => { return i.type == "category" && i.txid == txid }).shift();
    }

    handleChangeSortOrder(order) {
        if (order == "time") {
            this.setState({"sort": "time"});
        } else {
            this.setState({"sort": "votes"});
        }
    }

    handlePageChange(page) {
        const idx = (page - 1);
        const cursor = idx * this.state.limit;
        this.setState({"cursor": cursor});
    }

    render() {
        const categories = this.getCategories();
        const entries = this.getEntries();

        var slice = entries.slice(this.state.cursor, this.state.cursor + this.state.limit);

        var numPages = Math.ceil(entries.length / this.state.limit);

        var pages = [...Array(numPages).keys()].map(idx => {
            const page = idx + 1;
            return <a key={"page-" + page} className={this.state.cursor == (idx*this.state.limit) ? "active" : null} onClick={() => { this.handlePageChange(page) }}>{page}</a>;
        });

        var parent;
        if (this.props.category && this.props.category.category) {
            parent = this.findCategoryByTXID(this.props.category.category);
        }

        var back;
        var heading;
        if (this.props.category) {
            if (parent) {
                back = <div className="back"><a href={"/#" + parent.txid}>&laquo; {parent.name}</a><hr /></div>;
            }
            heading = (<div>
                {back}
                <h1>{this.props.category.name}</h1>
                <p dangerouslySetInnerHTML={{__html: this.props.category.description}}></p>
            </div>);
        }

        var entryListing;
        if (slice.length > 0) {
            entryListing = (
                <div>
                    <div className="sort">
                        <span className="label">sort by</span>
                        <ul>
                            <li><a onClick={() => { this.handleChangeSortOrder("vote") }} className={this.state.sort == "votes" ? "active" : ""}>votes</a></li>
                            <li><a onClick={() => { this.handleChangeSortOrder("time") }} className={this.state.sort == "time" ? "active" : ""}>time</a></li>
                        </ul>
                        <div className="clearfix"></div>
                    </div>

                    <ul className="entry list">
                        {slice.map(entry => (
                            <EntryItem key={"entry-" + entry.txid} item={entry} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} />
                        ))}
                    </ul>
                    {pages.length > 1 && <div className="pages">{pages}</div>}
                </div>
            );
        } else {
            if (!this.props.isLoading && this.props.category && this.props.category.txid) {
                entryListing = (
                    <div className="empty-entry-listing">
                        <img src="/static/img/link.png" />
                        <p>There's no links here yet. Go ahead and add a new link below. 👍</p>
                    </div>
                );
            }
        }

        return (
            <div>
                {heading}
                <ul className="category list">
                    {categories.map(category => (
                        <CategoryItem key={"category-" + category.txid} item={category} />
                    ))}
                </ul>
                <div className="clearfix"></div>
                {entryListing}
                <div className="clearfix"></div>
            </div>
        );
    }
}

class EntryItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            "isExpanded": false,
            "isDeleting": false,
            "isEditing": false,
        };

        this._isMounted = false;
    }

    componentDidMount() {
        this._isMounted = true;
        window.addEventListener('hashchange', this.clearForm.bind(this), false);
    }

    componentWillUnmount() {
        this._isMounted = false;
        window.removeEventListener('hashchange', this.clearForm.bind(this));
    }

    clearForm() {

        if (this._isMounted) {
            this.setState({
                "isExpanded": false,
                "isDeleting": false,
                "isEditing": false,
            });
        }

        const container = document.getElementById(this.props.item.txid);
        if (container) {
            const voteButton = container.querySelector(".entry-tip-money-button");
            if (voteButton) {
                const parentNode = voteButton.parentNode;
                parentNode.removeChild(voteButton);
                const newEl = document.createElement('div');
                newEl.className = "entry-tip-money-button";
                parentNode.appendChild(newEl);
            }

            const deleteButton = container.querySelector(".entry-delete-money-button");
            if (deleteButton) {
                const parentNode = deleteButton.parentNode;
                parentNode.removeChild(deleteButton);
                const newEl = document.createElement('div');
                newEl.className = "entry-delete-money-button";
                parentNode.appendChild(newEl);
            }
        }
    }

    handleUpvote(e) {
        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            "vote",
            this.props.item.txid,
        ];

        const button = document.getElementById(this.props.item.txid).querySelector(".entry-tip-money-button");
        databutton.build({
            data: OP_RETURN,
            button: {
                $el: button,
                /*$pay: {
                    to: [{
                        address: OPENDIR_PROTOCOL,
                        value: 50000,
                    }]
                },*/
                onPayment: (msg) => {
                    console.log(msg);
                    setTimeout(() => {
                        this.clearForm();
                        this.props.onSuccessHandler("Successfully upvoted link, it will appear automatically—please refresh the page if it doesn't");
                    }, 5000);
                }
            }
        });
    }

    handleToggleExpand(e) {
        this.setState({
            "isExpanded": !this.state.isExpanded,
            "isDeleting": false,
            "isEditing": false,
        });
    }

    handleEdit(e) {
        console.log("EDIT");
        this.setState({
            "isEditing": true
        }, () => {
            console.log("EDITING");
        });
    }

    handleDelete(e) {
        this.setState({
            "isDeleting": true
        }, () => {
            const OP_RETURN = [
                OPENDIR_PROTOCOL,
                "entry.delete",
                this.props.item.txid,
            ];

            const button = document.getElementById(this.props.item.txid).querySelector(".entry-delete-money-button")
            console.log(button);

            databutton.build({
                data: OP_RETURN,
                button: {
                    $el: button,
                    /*$pay: {
                    to: [{
                        address: OPENDIR_PROTOCOL,
                        value: 50000,
                    }]
                },*/
                    onPayment: (msg) => {
                        console.log(msg);
                        setTimeout(() => {
                            this.clearForm();
                            this.props.onSuccessHandler("Successfully deleted link, it will disappear automatically—please refresh the page if it doesn't");
                        }, 5000);
                    }
                }
            });
        });

    }

    render() {

        var actions = (
            <span className="actions">
                <a onClick={this.handleToggleExpand.bind(this)} className="arrow">{this.state.isExpanded ? "▶" : "▼"}</a>
                {this.state.isExpanded && <a className="action" onClick={this.handleEdit.bind(this)}>edit</a>}
                {this.state.isExpanded && <a className="action" onClick={this.handleDelete.bind(this)}>delete</a>}
            </span>);

        return (
            <li id={this.props.item.txid} className="entry">
                <div className="upvoteContainer">
                    <div className="upvote"><a onClick={this.handleUpvote.bind(this)}>▲</a> <span className="number">{this.props.item.votes}</span></div>
                    <div className="entry">
                        <h5><a href={this.props.item.link}>{this.props.item.name}</a> {!this.props.item.height && <span className="pending">pending</span>} {actions}</h5>
                        <p className="description">{this.props.item.description}</p>
                        <p className="url"><a href={this.props.item.link}>{this.props.item.link}</a></p>
                        {this.state.isDeleting && <div className="delete"><span className="warning">You are about to delete this entry, are you sure you want to do this?</span><div className="explain"><p>If you remove this link you'll be permanently removing it from this directory for others to view. Please only do this if you think it's in the best interest of the directory. Your Bitcoin key is forever tied to this transaction, so it will always be traced to you.</p><p><strong>Permanently delete this link from this directory</strong></p><div className="entry-delete-money-button"></div> </div></div>}

                        <div className="entry-tip-money-button"></div>
                   </div>
                    <div className="clearfix"></div>
                </div>
            </li>
        )
    }
}

class CategoryItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            "isExpanded": false,
            "isDeleting": false,
            "isEditing": false,
        };

        this._isMounted = false;
    }

    componentDidMount() {
        this._isMounted = true;
        window.addEventListener('hashchange', this.clearForm.bind(this), false);
    }

    componentWillUnmount() {
        this._isMounted = false;
        window.removeEventListener('hashchange', this.clearForm.bind(this));
    }

    clearForm() {

        if (this._isMounted) {
            this.setState({
                "isExpanded": false,
                "isDeleting": false,
                "isEditing": false,
            });
        }

        const el = document.querySelector(".category-tip-money-button");
        if (el) {
            const parentNode = el.parentNode;
            parentNode.removeChild(el);
            const newEl = document.createElement('div');
            newEl.className = "category-tip-money-button";
            parentNode.appendChild(newEl);
        }
    }


    // this is the same as EntryItem above ...share code?
    handleUpvote(e) {
        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            "vote",
            this.props.item.txid,
        ];

        const button = document.getElementById(this.props.item.txid).querySelector(".category-tip-money-button");
        databutton.build({
            data: OP_RETURN,
            button: {
                $el: button,
                onPayment: (msg) => {
                    console.log(msg);
                    setTimeout(() => {
                        this.clearForm();
                    }, 5000);
                }
            }
        });
        e.preventDefault();
    }

    handleLink(e) {
        const url = e.target.href;
        history.pushState({}, "", url);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
        e.preventDefault();
    }

    handleToggleExpand(e) {
        this.setState({
            "isExpanded": !this.state.isExpanded,
            "isDeleting": false,
            "isEditing": false,
        });
    }

    handleEdit(e) {
        console.log("EDIT");
        this.setState({
            "isEditing": true
        }, () => {
            console.log("EDITING");
        });
    }


    handleDelete(e) {
        this.setState({
            "isDeleting": true
        }, () => {
            const OP_RETURN = [
                OPENDIR_PROTOCOL,
                "category.delete",
                this.props.item.txid,
            ];

            const button = document.getElementById(this.props.item.txid).querySelector(".category-delete-money-button")
            console.log(button);

            databutton.build({
                data: OP_RETURN,
                button: {
                    $el: button,
                    /*$pay: {
                    to: [{
                        address: OPENDIR_PROTOCOL,
                        value: 50000,
                    }]
                },*/
                    onPayment: (msg) => {
                        console.log(msg);
                        setTimeout(() => {
                            this.clearForm();
                            this.props.onSuccessHandler("Successfully deleted category, it will disappear automatically—please refresh the page if it doesn't.");
                        }, 5000);
                    }
                }
            });
        });

    }

    render() {
        var actions = (
            <span className="actions">
                <a onClick={this.handleToggleExpand.bind(this)} className="arrow">{this.state.isExpanded ? "▶" : "▼"}</a>
                {this.state.isExpanded && <a className="action" onClick={this.handleEdit.bind(this)}>edit</a>}
                {this.state.isExpanded && <a className="action" onClick={this.handleDelete.bind(this)}>delete</a>}
            </span>);


        return (
            <li id={this.props.item.txid} className="category">

                <div className="upvoteContainer">
                    <div className="upvote">
                        <a onClick={this.handleUpvote.bind(this)}>▲</a>
                        <span className="number">{this.props.item.votes}</span>
                    </div>
                    <div className="category">
                        <h3>
                            <a href={"#" + this.props.item.txid} onClick={this.handleLink.bind(this)}>{this.props.item.name}</a>
                            {!this.props.item.height && <span className="pending">pending</span>}
                            <span className="category-count">({this.props.item.entries})</span>
                            {actions}
                        </h3>
                        <p className="description" dangerouslySetInnerHTML={{__html: this.props.item.description}}></p>
                        {this.state.isEditing && <div className="column"><AddCategoryForm category={this.props.item} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} /></div>}
                        {this.state.isDeleting && <div className="delete"><span className="warning">You are about to delete this entry, are you sure you want to do this?</span><div className="explain"><p>If you remove this category you'll be permanently removing it from this directory for others to view. Please only do this if you think it's in the best interest of the directory. Your Bitcoin key is forever tied to this transaction, so it will always be traced to you.</p><p><strong>Permanently delete category from this directory</strong></p><div className="category-delete-money-button"></div> </div></div>}
                        <div className="category-tip-money-button"></div>
                    </div>
                    <div className="clearfix"></div>
                </div>
            </li>

        )
    }
}

class AddEntryForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            title: "",
            link: "",
            description: ""
        };

        this._isMounted = false;
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleLinkChange = this.handleLinkChange.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        window.addEventListener('hashchange', this.clearForm.bind(this), false);
        this._isMounted = true;
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange', this.clearForm.bind(this));
        this._isMounted = false;
    }

    clearForm() {
        if (this._isMounted) {
            const el = document.querySelector(".add-entry-money-button");
            if (el) {
                const parentNode = el.parentNode;
                parentNode.removeChild(el);
                const newEl = document.createElement('div');
                newEl.className = "add-entry-money-button";
                parentNode.appendChild(newEl);
            }

            this.setState({
                title: "",
                link: "",
                description: ""
            });
        }
    }

    render() {
        return (
            <div className="column">
                <h3>Add new link to <span className="highlight">{this.props.category.name}</span></h3>
                <form onSubmit={this.handleSubmit}>
                    <fieldset>
                        <div className="row">
                            <div className="column">
                                <label>
                                    Title:
                                    <input type="text" value={this.state.title} onChange={this.handleTitleChange} />
                                </label>
                            </div>
                            <div className="column"></div>
                        </div>
                        <label>
                            Link:
                            <input type="text" value={this.state.link} onChange={this.handleLinkChange} placeholder="bit://" />
                        </label>
                        <label>
                            Description:
                            <textarea onChange={this.handleDescriptionChange} value={this.state.description}></textarea>
                        </label>
                        <input type="submit" className="button-outline" value="Add new link" />
                        <div>
                            <div className="add-entry-money-button"></div>
                        </div>
                    </fieldset>
                </form>
            </div>
        )
    }

    handleSubmit(e) {
        e.preventDefault();

        if (!this.props.category) {
            alert("Invalid category");
            return;
        }

        if (!this.state.title) {
            alert("Invalid title");
            return;
        }

        if (!this.state.link) {
            alert("Invalid link");
            return;
        }

        if (this.state.link.indexOf("://") == -1) {
            if (!confirm("The link doesn't look valid, are you sure you want to continue?")) {
                return;
            }
        }

        if (!this.state.description) {
            alert("Invalid description");
            return;
        }

        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            "entry.create",
            this.props.category.txid,
            "name",
            this.state.title,
            "link",
            this.state.link,
            "description",
            this.state.description,
        ];

        console.log(OP_RETURN);

        databutton.build({
            data: OP_RETURN,
            button: {
                $el: document.querySelector(".add-entry-money-button"),
                onPayment: (msg) => {
                    console.log(msg)


                    setTimeout(() => {
                        this.clearForm();
                    }, 5000);

                    setTimeout(() => {
                        this.setState({
                            title: "",
                            link: "",
                            description: ""
                        });

                        this.props.onSuccessHandler("Successfully added new link, it will appear automatically—please refresh the page if it doesn't.");
                    }, 3000);
                }
            }
        })

    }



    handleTitleChange(e) {
        this.setState({title: e.target.value});
    }

    handleLinkChange(e) {
        this.setState({link: e.target.value});
    }

    handleDescriptionChange(e) {
        this.setState({description: e.target.value});
    }
}

class AddCategoryForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            title: "",
            description: ""
        };

        this._isMounted = false;

        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleLinkChange = this.handleLinkChange.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        window.addEventListener('hashchange', this.clearForm.bind(this), false);
        this._isMounted = true;
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange', this.clearForm.bind(this));
        this._isMounted = false;
    }

    clearForm() {
        if (this._isMounted) {
            const el = document.querySelector(".add-category-money-button");
            if (el) {
                const parentNode = el.parentNode;
                parentNode.removeChild(el);
                const newEl = document.createElement('div');
                newEl.className = "add-category-money-button";
                parentNode.appendChild(newEl);
            }

            this.setState({
                title: "",
                description: ""
            });
        }
    }

    render() {
        var header = <h3>Add new directory</h3>
        if (this.props.category.txid) {
            header = <h3>Add new subcategory under <span className="highlight">{this.props.category.name}</span></h3>
        }

        return (
            <div className="column">
                {header}
                <form onSubmit={this.handleSubmit}>
                    <fieldset>
                        <div className="row">
                            <div className="column">
                                <label>
                                    Title:
                                    <input type="text" value={this.state.title} onChange={this.handleTitleChange} />
                                </label>
                            </div>
                            <div className="column"></div>
                        </div>
                        <label>
                            Description:
                            <textarea onChange={this.handleDescriptionChange} value={this.state.description}></textarea>
                        </label>
                        <input type="submit" className="button button-outline" value={this.props.category.txid ? "Add new subcategory" : "Add new directory"} />
                        <div>
                            <div className="add-category-money-button"></div>
                        </div>
                    </fieldset>
                </form>
            </div>
        )
    }

    handleSubmit(e) {
        e.preventDefault();

        if (!this.state.title) {
            alert("Invalid title");
            return;
        }

        if (!this.state.description) {
            alert("Invalid description");
            return;
        }

        var OP_RETURN = [
            OPENDIR_PROTOCOL,
            "category.create",
        ];

        if (this.props.category.txid) {
            OP_RETURN.push(this.props.category.txid);
        }

        OP_RETURN.push("name");
        OP_RETURN.push(this.state.title);

        OP_RETURN.push("description");
        OP_RETURN.push(this.state.description);

        console.log(OP_RETURN);

        databutton.build({
            data: OP_RETURN,
            button: {
                $el: document.querySelector(".add-category-money-button"),
                onPayment: (msg) => {
                    console.log(msg);
                    setTimeout(() => {
                        this.clearForm();
                    }, 5000);
                    setTimeout(() => {
                        this.setState({
                            title: "",
                            description: ""
                        });

                        this.props.onSuccessHandler("Successfully added new category, it will appear automatically—please refresh the page if it doesn't.");
                    }, 3000);
                }
            }
        })

    }

    handleTitleChange(e) {
        this.setState({title: e.target.value});
    }

    handleLinkChange(e) {
        this.setState({link: e.target.value});
    }

    handleDescriptionChange(e) {
        this.setState({description: e.target.value});
    }
}

var application = <OpenDirectoryApp />;
ReactDOM.render(application, document.getElementById("app"));

