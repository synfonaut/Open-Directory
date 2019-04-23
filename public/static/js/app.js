class OpenDirectoryApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            archive: [],
            items: [],
            location: [""],
            category: null,
            isLoading: true,
            isError: false,
        };

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
                     <p><code>v0.1—beta</code> </p>
                    <p>✌️ synfonaut</p>
                </div>
            );
        } else {

            if (!this.state.isLoading && !this.state.isError) {
                shouldShowAddNewCategoryForm = true;

                if (this.state.category && this.state.category.txid) {
                    shouldShowAddNewEntryForm = true;
                }
            }

            body = <List items={this.state.items} category={this.state.category} />;

            loading = <div className="loading">
                    <div className="lds-circle"><div></div></div>
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
                <div className="open-directory">
                    {hash == "" && 
                      <div className="intro">
                        <img id="logo" src="/static/img/logo.png" />
                        <div className="row">
                            <div className="column">
                                <p>Open Directory lets anyone build resources like <a href="https://www.reddit.com">Reddit</a>, <a href="https://github.com/sindresorhus/awesome">Awesome Lists</a> and <a href="http://dmoz-odp.org">DMOZ</a> ontop of Bitcoin. With Open Directory you can:</p>
                                <ul>
                                    <li>💡 Create your own resource and earn money when people tip through upvotes</li>
                                    <li>💰 Incentivize quality submissions by sharing a portion of tips back to contributors</li>
                                    <li>🛠 Organize an existing directory or fork it with 1-click and start your own</li>
                                </ul>

                                <p>Create your own directory or view the existing ones below.</p>
                            </div>
                        </div>

                        <hr />
                      </div>}
                    {body}
                    {this.state.isLoading && loading}
                    {this.state.isError && error}
                    <hr />
                    <div className="row">
                        {(shouldShowAddNewEntryForm ? <div className="column"><AddEntryForm category={this.state.category}/></div> : null )}
                        <div className="column">
                        {(shouldShowAddNewCategoryForm ? <div><AddCategoryForm category={this.state.category} /></div> : null)}
                        </div>
                        {(shouldShowAddNewEntryForm ? null : <div className="column"></div>)}
                    </div>
                    <div className="row">
                        <div className="column">
                            <p align="center">made by <a href="https://twitter.com/synfonaut">@synfonaut</a></p>
                        </div>
                    </div>
                </div>
            </div>
        );

    }

    findObjectByTX(txid, results=null) {
        if (!results) { results = this.state.items; }
        for (const result of results) {
            if (result.txid == txid) {
                return result;
            }
        }
        return null;
    }

    getLocation() {
        return window.location.hash.replace(/^#\/?|\/$/g, '').split('/');
    }

    didUpdateLocation() {
        const location = this.getLocation();
        const hash = location[0];

        console.log("Location updated", hash);

        var category = null;
        var items = [];

        if (hash != "about") {
            if (hash == "") {
                category = {"txid": null, "needsdata": true};
            } else {
                category = this.findObjectByTX(hash, this.state.archive);
                if (category) {
                    category.needsdata = true;
                } else {
                    category = {"txid": hash, "needsdata": true};
                }
            }

            items = this.buildItemsFromArchive(category.txid, this.state.archive);

        }

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
        this.didUpdateLocation();
        window.addEventListener('hashchange', this.didUpdateLocation.bind(this), false);
    }

    getItemFromArchive(txid, results=[]) {
        const items = results.filter(result => {
            return txid == result.txid;
        });

        if (items.length == 1) {
            return items[0];
        }

        return null;
    }

    buildItemsFromArchive(category_id, results=[]) {

        // TODO: YUCKY. Clean this up

        // It's like this beause need to build hierarchy in specific way.

        const items = [];
        const leftover = [];
        for (const result of results) {
            if (category_id == result.txid) {
                items.push(result);
            } else {
                leftover.push(result);
            }
        }

        const leftover2 = [];
        for (const result of leftover) {
            if (category_id == result.category) {
                items.push(result);
            } else {
                leftover2.push(result);
            }
        }

        const leftover3 = [];
        for (const result of leftover2) {
            if (category_id == result.category) {
                items.push(result);
            } else {
                leftover3.push(result);
            }
        }

        if (items[0] && items[0].category) {
            const response = this.buildItemsFromArchive(items[0].category, leftover3);
            return response.concat(items);
        }

        return items;
    }

    networkAPIFetch() {

        console.log("network fetching");

        if (this.state.items.length == 0) {
            this.setState({isLoading: true});
        }

        const category_id = (this.state.category ? this.state.category.txid : null);
        fetch_from_network(category_id).then((rows) => {

            const results = this.processResults(rows);

            // Rebuild archive with new results, keeping old copies
            var unique_archive = new Map();
            for (const item of this.state.archive) {
                unique_archive.set(item.txid, item);
            }

            for (const result of results) {
                unique_archive.set(result.txid, result);
            }

            const archive = Array.from(unique_archive.values());
            const items = this.buildItemsFromArchive(category_id, archive);

            this.setState({
                "archive": archive,
                "items": items,
                "isLoading": false,
                "isError": false
            });

            this.setupNetworkSocket();

        }).catch((e) => {
            console.log("error", e);
            this.setState({
                "isLoading": false,
                "isError": true,
            });
        });

    }

    processResults(results) {
        const processed = processOpenDirectoryTransactions(results);
        var processing = []

        // process them in this order because blockchain may be out of order and we need to build hierarchy in correct way
        for (const result of processed.filter(r => { return r.type == "category" })) {
            processing = this.processResult(result, processing)
        }
        for (const result of processed.filter(r => { return r.type == "entry" })) {
            processing = this.processResult(result, processing)
        }
        for (const result of processed.filter(r => { return r.type == "vote" })) {
            processing = this.processResult(result, processing)
        }

        const final = this.updateCategoryEntryCounts(processing);

        if (this.state.category && this.state.category.needsdata) { // hacky...better way?
            for (const result of final) {
                if (result.type == "category" && result.txid == this.state.category.txid) {
                    this.setState({category: result});
                    break;
                }
            }
        }

        return final;
    }

    updateCategoryEntryCounts(results) {

        const counts = {};
        for (const result of results) {
            if (result.category) {
                if (counts[result.category]) {
                    counts[result.category] += 1;
                } else {
                    counts[result.category] = 1;
                }
            }
        }


        return results.map(r => {
            if (r.type == "category") {
                var count = counts[r.txid];
                if (!count) { count = 0; }
                r.entries = count;
            }
            return r;
        });
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

    processResult(result, existing) {

        if (result.action == "create" && result.change.action == "SET") {
            const obj = result.change.value;
            obj.type = result.type;
            obj.txid = result.txid;
            obj.address = result.address;
            obj.height = result.height;
            obj.votes = 0;
            existing.push(obj);
        } else if (result.type == "vote") {
            const obj = this.findObjectByTX(result.action_id, existing);
            if (obj) {
                obj.votes += 1;
            } else {
                console.log("couldn't find object for vote", obj, result);
            }
        } else {
            console.log("error processing result", result);
        }
        return existing;
    }
}

class List extends React.Component {

    getCategories() {
        const category_id = (this.props.category ? this.props.category.txid: null);
        const categories = this.props.items.filter(i => { return i.type == "category" && i.category == category_id });
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
            const entries = this.props.items.filter(i => { return i.type == "entry" && i.category == this.props.category.txid });
            return entries.sort((a, b) => {
                if (a.votes < b.votes) { return 1; }
                if (a.votes > b.votes) { return -1; }
                if (a.height < b.height) { return 1; }
                if (a.height > b.height) { return -1; }
                return 0;
            });
        }

        return [];
    }

    findCategoryByTXID(txid) {
        return this.props.items.filter(i => { return i.type == "category" && i.txid == txid }).shift();
    }

    render() {
        const categories = this.getCategories();
        const entries = this.getEntries();

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
                <h2>{this.props.category.name}</h2>
                <p>{this.props.category.description}</p>
            </div>);
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
                <ul className="entry list">
                    {entries.map(entry => (
                        <EntryItem key={"entry-" + entry.txid} item={entry} />
                    ))}
                </ul>
                <div className="clearfix"></div>
            </div>
        );
    }
}

class EntryItem extends React.Component {
    handleUpvote(e) {
        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            "vote",
            this.props.item.txid,
        ];

        const button = document.getElementById(this.props.item.txid).querySelector(".tip-money-button");
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
                }
            }
        });
    }

    render() {
        return (
            <li id={this.props.item.txid} className="entry">
                <div className="row">
                    <div className="column-10">
                        <div className="upvote"><a onClick={this.handleUpvote.bind(this)}>▲</a> <span className="number">{this.props.item.votes}</span></div> 
                    </div>
                    <div className="column">
                        <h5><a href={this.props.item.link}>{this.props.item.name}</a> {!this.props.item.height && <span className="pending">pending</span>}</h5>
                        <p className="description">{this.props.item.description}</p>
                        <p className="url"><a href={this.props.item.link}>{this.props.item.link}</a></p>
                        <div className="tip-money-button"></div>
                    </div>
                </div>
            </li>
        )
    }
}

class CategoryItem extends React.Component {

    // this is the same as EntryItem above ...share code?
    handleUpvote(e) {
        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            "vote",
            this.props.item.txid,
        ];

        const button = document.getElementById(this.props.item.txid).querySelector(".tip-money-button");
        databutton.build({
            data: OP_RETURN,
            button: {
                $el: button,
                onPayment: (msg) => {
                    console.log(msg);
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

    render() {
        return (
            <li id={this.props.item.txid} className="category">
                <div className="row">
                    <div className="column-10">
                        <div className="upvote">
                            <a onClick={this.handleUpvote.bind(this)}>▲</a>
                            <span className="number">{this.props.item.votes}</span>
                        </div> 
                    </div>
                    <div className="column">
                        <h3>
                            <a href={"#" + this.props.item.txid} onClick={this.handleLink.bind(this)}>{this.props.item.name}</a>
                            <span className="category-count">({this.props.item.entries})</span>
                            {!this.props.item.height && <span className="pending">pending</span>}
                        </h3>
                        <p className="description">{this.props.item.description}</p>
                        <div className="tip-money-button"></div>
                    </div>
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
            MAP_PROTOCOL,
            "SET",
            "category",
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
            MAP_PROTOCOL,
            "SET",
        ];

        if (this.props.category && this.props.category.txid) {
            OP_RETURN.push("category");
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

