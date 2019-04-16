class OpenDirectoryApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = { items: [] };
    }

    render() {
        return (
            <div className="open-directory">
                <h1>Open Directory</h1>
                <p>DMOZ on Bitcoin SV</p>
                <hr />
                <List items={this.state.items} />
                <AddEntryForm />
            </div>
        );
    }

    componentDidMount() {
        this.networkAPIFetch();
    }

    networkAPIFetch() {
        var query = {
            "v": 3,
            "q": {
                "find": { "out.s1": OPENDIR_PROTOCOL }
            },
            "r": {
                "f": "[.[] | {\"txid\": .tx.h, \"data\": .out[0] | with_entries(select(((.key | startswith(\"s\")) and (.key != \"str\"))))}]"
            }
        };

        var url = "https://bitomation.com/q/1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z/" + btoa(JSON.stringify(query));
        var header = { headers: { key: "1D23Q8m3GgPFH15cwseLFZVVGSNg3ypP2z" } };

        fetch(url, header).then(function(r) {
            return r.json()
        }).then(function(results) {
            return processOpenDirectoryTransactions(results.c)
                .concat(processOpenDirectoryTransactions(results.u));
        }).then((results) => {
            var final = []
            for (const result of results) { final = this.processResult(result, final) }
            return final;
        }).then((results) => {
            this.setState({
                items: results.reverse()
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

    render() {
        return (
            <ul className="list">
                {this.props.items.map(item => (
                    <Item key={item.txid} item={item} />
                ))}
            </ul>
        );
    }
}

class Item extends React.Component {

    categoryStyle() {
        return {
        }
    }

    render() {
        if (this.props.item.type == "category") {
            return (
                <li className="category">
                    <h3>{this.props.item.name}</h3>
                    <p>{this.props.item.description}</p>
                </li>
            )
        } else if (this.props.item.type == "entry") {
            return (
                <li>
                <p><a href={this.props.item.link}>{this.props.item.name}</a></p>
                <p>{this.props.item.description}</p>
                </li>
            )
        } 
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
                            <div className="money-button"></div>
                        </fieldset>
                    </form>
                </div>
            </div>
        )
    }

    handleSubmit(e) {
        e.preventDefault();
        console.log(e);

        alert("submit");
        const data = [
            "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi",
            "entry.create",
            "1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5",
            "SET",
            "category",
            "21c347c8d6e6e014a986a5106793470c07f2c8523a5dff961e4e9305b4764aba", // category txid
            "name",
            this.state.title,
            "link",
            this.state.link,
            "description",
            this.state.description,
        ];

        console.log(data);

        // VALIDATE FIRST

        databutton.build({
            data: data,
            button: {
                $el: document.querySelector(".money-button"),
                onPayment: function(msg) {
                    console.log(msg)
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

ReactDOM.render(<OpenDirectoryApp />, document.getElementById("app"));

/*
console.log(processOpenDirectoryTransaction({
    "txid": "21c347c8d6e6e014a986a5106793470c07f2c8523a5dff961e4e9305b4764aba",
    data: {
        "s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi",
        "s2": "category.create",
        "s3": "1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5",
        "s4": "SET",
        "s5": "name",
        "s6": "hello world",
        "s7": "description",
        "s8": "this is the first open directory category ever created",
    },
}));

console.log(processOpenDirectoryTransaction({
    data: {
        "s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi",
        "s2": "entry.create",
        "s3": "1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5",
        "s4": "SET",
        "s5": "category",
        "s6": "21c347c8d6e6e014a986a5106793470c07f2c8523a5dff961e4e9305b4764aba",
        "s7": "name",
        "s8": "Planaria",
        "s9": "link",
        "s10": "https://planaria.network/",
        "s11": "description",
        "s12": "Infinite API over Bitcoin",
    },
    txid: "c42bc6f4d17b4f2997d14560c3b8ec9f1c2c6db6854e2b59c3fc7101f1739eb3",
}));

console.log(processOpenDirectoryTransaction({
    data: {
        "s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi",
        "s2": "entry.update",
        "s3": "c42bc6f4d17b4f2997d14560c3b8ec9f1c2c6db6854e2b59c3fc7101f1739eb3", // entry_id
        "s3": "1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5",
        "s4": "SET",
        "s5": "category",
        "s6": "12345-new", // new category_id
    },
    txid: "c42bc6f4d17b4f2997d14560c3b8ec9f1c2c6db6854e2b59c3fc7101f1739eb3",
}));

console.log(processOpenDirectoryTransaction({
    data: {
        "s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi",
        "s2": "entry.delete",
        "s3": "c42bc6f4d17b4f2997d14560c3b8ec9f1c2c6db6854e2b59c3fc7101f1739eb3", // entry_id
    },
    txid: "...",
}));

console.log(processOpenDirectoryTransaction({
    data: {
        "s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi",
        "s2": "category.delete",
        "s3": "21c347c8d6e6e014a986a5106793470c07f2c8523a5dff961e4e9305b4764aba", // category_id
    },
    txid: "...",
}));
*/
