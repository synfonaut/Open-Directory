class OpenDirectoryApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            items: [],
            location: [""],
            category: null,
            isLoading: false,
            isError: false
        };
    }

    render() {
        const hash = this.state.location[0];

        var body;
        var shouldShowAddNewCategoryForm = false,
            shouldShowAddNewEntryForm = false;

        if (hash == "about") {
            body = (
                <div>
                    <h1>About Open Directory</h1>
                    <p>✌️</p>
                </div>
            );
        } else {

            if (!this.state.isLoading && !this.state.isError) {
                shouldShowAddNewCategoryForm = true;

                if (this.state.category) {
                    shouldShowAddNewEntryForm = true;
                }
            }

            body = <List items={this.state.items} category={this.state.category} />;

            if (this.state.isLoading) {
                body = <div className="loading">
                        <div className="lds-circle"><div></div></div>
                        <p>Loading Open Directory...</p>
                    </div>
            }

            if (this.state.isError) {
                body = <div>
                    <h2>Error</h2>
                    <p><strong>Sorry, there was an error while loading open directory information. Please refresh to try again or contact <a href="https://twitter.com/synfonaut">@synfonaut</a></strong></p>
                    <br />
                    <p><button onClick={() => { location.reload() }} className="button button-outline">Refresh This Page</button></p>
               </div>
            }

        }

        return (
            <div>
                <div className="open-directory">
                    {hash == "" && 
                      <div>
                        <h1>Open Directory <code>v0.1</code></h1>
                        <blockquote>An Open Directory for Bitcoin</blockquote>
                        <p>Open Directory let's anyone create a collection of resources, like Awesome Lists, BSVDEVs and more. It's hosted 100% on Bitcoin (SV) and works with Bitcoin native protocols like b://, c://, bit:// and more</p>
                        <p>Check out some of the on-chain resources below, or create your own!</p>
                        <hr />
                      </div>}
                    {body}
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

        var category = null;
        if (hash != "" && hash != "about") {
            category = this.findObjectByTX(hash);
            if (!category) {
                category = {"txid": hash, "needsdata": true};
            }
        }

        this.setState({
            location: location,
            category: category,
        });
    }

    componentDidMount() {
        this.networkAPIFetch();
        this.setupNetworkSocket();
        this.didUpdateLocation();
        window.addEventListener('hashchange', this.didUpdateLocation.bind(this), false);
    }

    getEncodedQuery() {
        var query = {
            "v": 3,
            "q": {
                "find": { "out.s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi" }
            },
            "r": {
                "f": "[.[] | {\"height\": .blk.i, \"address\": .in[0].e.a, \"txid\": .tx.h, \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}] | reverse"
            }
        };

        return btoa(JSON.stringify(query));
    }

    networkAPIFetch() {

        console.log("Network fetching");

        // only need to show loading when there are no items
        if (this.state.items.length == 0) {
            this.setState({isLoading: true});
        }

        var query_url = "https://bitomation.com/q/1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z/" + this.getEncodedQuery();
        var header = { headers: { key: "1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z" } };
        fetch(query_url, header).then(function(r) {
            return r.json()
        }).then(function(results) {
            if (!results.c || !results.u) {
                return [];
            }

            return processOpenDirectoryTransactions(results.c)
                .concat(processOpenDirectoryTransactions(results.u));
        }).then((results) => {
            var final = []

            // process them in this order because blockchain may be out of order and we need to build hierarchy in correct way
            for (const result of results.filter(r => { return r.type == "category" })) {
                final = this.processResult(result, final)
            }
            for (const result of results.filter(r => { return r.type == "entry" })) {
                final = this.processResult(result, final)
            }
            for (const result of results.filter(r => { return r.type == "vote" })) {
                final = this.processResult(result, final)
            }
            return final;
        }).then((results) => {
            if (this.state.category && this.state.category.needsdata) { // hacky...better way?
                for (const result of results) {
                    if (result.type == "category" && result.txid == this.state.category.txid) {
                        this.setState({category: result});
                        break;
                    }
                }
            }

            this.setState({
                items: results,
                isLoading: false,
                isError: false
            });
        }).catch((e) => {
            console.log("error", e);
            this.setState({
                items: [],
                isLoading: false,
                isError: true,
            });
        });
    }

    setupNetworkSocket() {
        const socket = new EventSource("https://bitomation.com/s/1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z/" + this.getEncodedQuery());
        socket.onmessage = (e) => {
            try {
                const resp = JSON.parse(e.data);
                console.log("socket received data", resp);
                if ((resp.type == "c" || resp.type == "u") && (resp.data.length > 0)) {
                    this.networkAPIFetch();
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

            if (obj.type == "entry") {
                const category = this.findObjectByTX(obj.category, existing);
                if (category) {
                    category.entries += 1;
                } else {
                    console.log(obj, existing);
                    console.log("Couldn't find categoryect for category", category);
                }
            } else if (obj.type == "category") {
                if (!obj.entries) {
                    obj.entries = 0;
                }

            }

            existing.push(obj);
        } else if (result.type == "vote") {
            const obj = this.findObjectByTX(result.action_id, existing);
            if (obj) {
                obj.votes += 1;
            } else {
                console.log("Couldn't find object for vote", obj);
            }
        } else {
            console.log("Error processing result", result);
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
                <ul className="list">
                    {categories.map(category => (
                        <CategoryItem key={category.txid} item={category} />
                    ))}
                </ul>
                <br />
                <ul className="list">
                    {entries.map(entry => (
                        <EntryItem key={entry.txid} item={entry} />
                    ))}
                </ul>
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
                        <h5><a href={this.props.item.link}>{this.props.item.name}</a></h5>
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
                            <a href={"#" + this.props.item.txid}>{this.props.item.name}</a>
                            <span className="category-count">({this.props.item.entries})</span>
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

        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleLinkChange = this.handleLinkChange.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    render() {
        return (
            <div className="column">
                <h3>Add new entry</h3>
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
                        <input type="submit" value="Add new entry" />
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
                    this.setState({
                        title: "",
                        link: "",
                        description: ""
                    });
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

        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleLinkChange = this.handleLinkChange.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    render() {

        return (
            <div className="column">
                <h3>Add new {this.props.category ? "subcategory under '" + this.props.category.name + "'" : "directory"}</h3>
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
                        <input type="submit" value={this.props.category ? "Add new subcategory" : "Add new directory"} />
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

        if (this.props.category) {
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
                    console.log(msg)
                    this.setState({
                        title: "",
                        description: ""
                    });
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

