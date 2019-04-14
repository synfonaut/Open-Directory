class OpenDirectoryApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = { items: [], text: '' };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.processResults = this.processResults.bind(this);
        this.processResult = this.processResult.bind(this);
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
                "find": { "out.s1": "1AaTyUTs5wBLu75mHt3cJfswowPyNRHeFi" },
                "limit": 100
            }
        };

        var url = "https://genesis.bitdb.network/q/1FnauZ9aUH2Bex6JzdcV4eNX7oLSSEbxtN/" + btoa(JSON.stringify(query));
        var header = { headers: { key: "1PaG83ScnLXRhtvNSZQFiRvK8eEZBVfkio" } };

        fetch(url, header).then(function(r) {
            return r.json()
        }).then(this.processResults).then(function(results) {
            console.log(results);
            //this.setState({results: results});
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

    processResult(result) {
        const opendir_protocol = result.out[0].s1;
        const opendir_action = result.out[0].s2;
        const map_protocol = result.out[0].s3;
        const map_action = result.out[0].s4;

        var metadata = {};

        if (map_action == "SET") {
            var key = null, name = null, value = null, tmp = null, idx = 5;
            key = "s" + idx;

            while (tmp = result.out[0][key]) {
                if (name) {
                    value = tmp;
                } else {
                    name = tmp;
                }

                if (name && value) {
                    metadata[name] = value;
                    name = null;
                    value = null;
                }

                idx++;
                key = "s" + idx;
            }

            metadata["txid"] = result.tx.h;
        } else if (map_action == "DEL") {
            console.log("delete...");
        }

        return metadata;
    }

    processResults(results) {
        const confirmed = results.c;
        const processed = [];
        for (const result of confirmed) {
            const metadata = this.processResult(result);
            if (metadata) {
                processed.push(metadata);
            } else {
                console.log("Error initializing metadata");
            }
        }

        return processed;
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

const app = <OpenDirectoryApp />;
ReactDOM.render(
    app,
    document.getElementById("app")
);


