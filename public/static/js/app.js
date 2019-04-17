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

        if (hash == "about") {
            return (
                <div className="open-directory">
                <h1>About Open Directory</h1>
                <p>✌️</p>
                </div>
            );
        } else {
            var body = <List items={this.state.items} category={this.state.category} />;
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

            return (
                <div className="open-directory">
                    <h1>Open Directory v0.1</h1>
                    <p>DMOZ on Bitcoin SV</p>
                    <hr />
                    {body}
                    {(!this.state.isLoading && !this.state.isError) && <AddEntryForm category={this.state.category} onAddEntry={this.onEntryHandler.bind(this)}/>}
                    {(!this.state.isLoading && !this.state.isError) && <div><hr /><AddCategoryForm category={this.state.category} onAddCategory={this.onCategoryHandler.bind(this)} /></div>}
                </div>
            );
        }
    }

    onEntryHandler() {
        this.networkAPIFetch();
    }

    onCategoryHandler() {
        this.networkAPIFetch();
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

    render() {
        const categories = this.getCategories();
        const entries = this.getEntries();

        var back = <a href="/#">Back</a>;

        var heading;
        if (this.props.category) {
            if (this.props.category.category) {
                back = <a href={"/#" + this.props.category.category.txid}>MORE BACK</a>;
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
            <p><a href={this.props.item.link}>{this.props.item.name}</a></p>
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
            <div className="row">
                <div className="column column-40">
                    <h3>Add new entry</h3>
                    <form onSubmit={this.handleSubmit}>
                        <fieldset>
                            <label>
                                Title:
                                <input type="text" value={this.state.title} onChange={this.handleTitleChange} />
                            </label>
                            <label>
                                Link:
                                <input type="text" value={this.state.link} onChange={this.handleLinkChange} />
                            </label>
                            <label>
                                Description:
                                <textarea onChange={this.handleDescriptionChange} defaultValue={this.state.description}></textarea>
                            </label>
                            <input type="submit" value="Save" />
                            <div className="add-entry-money-button"></div>
                        </fieldset>
                    </form>
                </div>
            </div>
        )
    }

    handleSubmit(e) {
        e.preventDefault();

        if (!this.props.category.txid) {
            alert("Invalid category transaction ID");
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
                    this.props.onEntryHandler();
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
            <div className="row">
                <div className="column column-40">
                    <h3>Add new category</h3>
                    <form onSubmit={this.handleSubmit}>
                        <fieldset>
                            <label>
                                Title:
                                <input type="text" value={this.state.title} onChange={this.handleTitleChange} />
                            </label>
                            <label>
                                Description:
                                <textarea onChange={this.handleDescriptionChange} defaultValue={this.state.description}></textarea>
                            </label>
                            <input type="submit" value="Save" />
                            <div className="add-category-money-button"></div>
                        </fieldset>
                    </form>
                </div>
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
                    location.reload();
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

