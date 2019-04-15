class OpenDirectoryApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = { items: [], text: '' };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    render() {
        return (
            <div>
                <h3>TODO</h3>
                <TodoList items={this.state.items} />
                <form onSubmit={this.handleSubmit}>
                    <label htmlFor="new-todo">What needs to be done?</label>
                    <input id="new-todo" onChange={this.handleChange} value={this.state.text} />
                    <button>Add #{this.state.items.length + 1}</button>
                </form>
            </div>
        );
    }

    componentDidMount() {
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
        }).then(function(result) {
            console.log(result);
        });
    }


    handleChange(e) {
        this.setState({ text: e.target.value });
    }

    handleSubmit(e) {
        e.preventDefault();
        if (!this.state.text.length) {
            return;
        }
        const newItem = {
            text: this.state.text,
            id: Date.now()
        };
        this.setState(state => ({
            items: state.items.concat(newItem),
            text: ''
        }));
    }


}

class TodoList extends React.Component {
    render() {
        return (
            <ul>
            {this.props.items.map(item => (
                <li key={item.id}>{item.text}</li>
            ))}
            </ul>
        );
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
