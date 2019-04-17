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
                        <p>Open Directory let's anyone create a collection of resources, like Awesome Lists, BSVDEVs and more. It's hosted 100% on Bitcoin (SV) and works with Bitcoin native protocols like b://, c://, bit:// and more</p>
                        <p>Check out some of the on-chain resources below, or create your own!</p>
                        <hr />
                      </div>}
                    {body}
                    <hr />
                    <div className="row">
                        {(shouldShowAddNewEntryForm ? <div className="column"><AddEntryForm category={this.state.category} onAddEntry={this.onEntryHandler.bind(this)}/></div> : null )}
                        <div className="column">
                        {(shouldShowAddNewCategoryForm ? <div><AddCategoryForm category={this.state.category} onAddCategory={this.onCategoryHandler.bind(this)} /></div> : null)}
                        </div>
                        {(shouldShowAddNewEntryForm ? null : <div className="column"></div> )}
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

    onEntryHandler() {
        setTimeout(() => {
            this.networkAPIFetch();
        }, 2000);
    }

    onCategoryHandler() {
        setTimeout(() => {
            this.networkAPIFetch();
        }, 2000);
    }

    findCategoryByTXID(txid) {
        return this.state.items.filter(i => { return i.type == "category" && i.txid == txid }).shift();
    }

    getLocation() {
        return window.location.hash.replace(/^#\/?|\/$/g, '').split('/');
    }

    didUpdateLocation() {
        const location = this.getLocation();
        const hash = location[0];

        var category = null;
        if (hash != "" && hash != "about") {
            category = this.findCategoryByTXID(hash);
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
        this.didUpdateLocation();
        window.addEventListener('hashchange', this.didUpdateLocation.bind(this), false);
    }

    getEncodedQuery() {
        var query = {
            "v": 3,
            "q": {
                "find": { "out.s1": OPENDIR_PROTOCOL }
            },
            "r": {
                "f": "[.[] | {\"txid\": .tx.h, \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}]"
            }
        };

        return btoa(JSON.stringify(query));
    }

    networkAPIFetch() {

        this.setState({isLoading: true});

        var query_url = "https://bitomation.com/q/1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z/" + this.getEncodedQuery();
        var header = { headers: { key: "1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z" } };
        fetch(query_url, header).then(function(r) {
            return r.json()
        }).then(function(results) {
            return processOpenDirectoryTransactions(results.c)
                .concat(processOpenDirectoryTransactions(results.u));
        }).then((results) => {
            var final = []
            for (const result of results) { final = this.processResult(result, final) }
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
                items: results.reverse(),
                isLoading: false,
                isError: false
            });
        }).catch((e) => {
            this.setState({
                items: [],
                isLoading: false,
                isError: true,
            });
        });
    }

    processResult(result, existing) {
        if (result.action == "create" && result.change.action == "SET") {
            const obj = result.change.value;
            obj.type = result.type;
            obj.txid = result.txid;
            existing.push(obj);
        } else {
            console.log("Error processing result", result);
        }
        return existing;
    }
}

class List extends React.Component {

    getCategories() {
        const category_id = (this.props.category ? this.props.category.txid: null);
        return this.props.items.filter(i => { return i.type == "category" && i.category == category_id });
    }

    getEntries() {
        if (this.props.category) {
            return this.props.items.filter(i => { return i.type == "entry" && i.category == this.props.category.txid });
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

        var back = <div><a href="/#">&laquo; Back</a><hr /></div>;

        var heading;
        if (this.props.category) {
            if (parent) {
                back = <div><a href={"/#" + parent.txid}>&laquo; {parent.name}</a><hr /></div>;
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
    render() {
        return (
            <li>
            <h5><a href={this.props.item.link}>{this.props.item.name}</a></h5>
            <p>{this.props.item.description}</p>
            </li>
        )
    }
}

class CategoryItem extends React.Component {

    render() {
        return (
            <li className="category">
            <h3><a href={"#" + this.props.item.txid}>{this.props.item.name}</a></h3>
            <p>{this.props.item.description}</p>
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
                            <input type="text" value={this.state.link} onChange={this.handleLinkChange} placeholder="http://" />
                        </label>
                        <label>
                            Description:
                            <textarea onChange={this.handleDescriptionChange} defaultValue={this.state.description}></textarea>
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
                    this.props.onAddEntry();
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
                            <textarea onChange={this.handleDescriptionChange} defaultValue={this.state.description}></textarea>
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
                    this.props.onAddCategory();
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

