class SearchPage extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            "search": "",
        };
    }

    handleSearch(e) {
        this.setState({"search": e.target.value});
    }

    render() {
        return (<div className="search">
                    <SearchForm search={this.state.search} title={this.props.title} onSearch={this.handleSearch.bind(this)} category={this.props.category} embed={this.props.embed} />
                    {this.state.search && <SearchResults search={this.state.search} items={this.props.items} />}
                </div>);
    }
}

class SearchForm extends React.Component {

    handleSubmit(e) {
        e.preventDefault();
    }

    render() {
        var searching;
        if (this.props.category && this.props.category.name) {
            searching = <span>Search <a href={"#" + this.props.category.txid}>{this.props.category.name}</a></span>;
        } else if (this.props.category && this.props.category.txid) {
            searching = <span>Search category {this.props.category.txid.slice(0, 5)}...</span>;
        } else if (this.props.category && !this.props.category.txid) {
            searching = <span>Search <a href="#">Open Directory</a></span>;
        }

        if (this.props.embed) {
            return (<div className="search embed">
                        <form onSubmit={this.handleSubmit.bind(this)}>
                            <input type="search" value={this.props.search} onChange={this.props.onSearch.bind(this)} placeholder="Search the Open Directory.." />
                            <input type="submit" className="button-outline" value="Search" />
                        </form>
                    </div>);
        } else {
            return (<div className="search page">
                        <h2>{searching}</h2>
                        <p className="blurb">Search by name, description, link, txid, address...</p>
                        <form onSubmit={this.handleSubmit.bind(this)}>
                            <input type="search" value={this.props.search} onChange={this.props.onSearch.bind(this)} />
                            <input type="submit" className="button-outline" value="Search" />
                        </form>
                    </div>);
        }
    }
}

class SearchResults extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            "limit": 15,
            "cursor": 0,
        };
    }

    handlePageChange(page) {
        const idx = (page - 1);
        const cursor = idx * this.state.limit;
        this.setState({"cursor": cursor});
        window.scrollTo(0, 250);
    }

    render() {

        const search = this.props.search.toLowerCase();
        const results = this.props.items.filter(item => {
            if (item.name && item.name.toLowerCase().indexOf(search) !== -1) { return true }
            if (item.description && item.description.toLowerCase().indexOf(search) !== -1) { return true }
            if (item.txid && item.txid.toLowerCase().indexOf(search) !== -1) { return true }
            if (item.address && item.address.toLowerCase().indexOf(search) !== -1) { return true }
            if (item.link && item.link.toLowerCase().indexOf(search) !== -1) { return true }

            for (const tipchain of item.tipchain) {
                if (tipchain.address.toLowerCase().indexOf(search) !== -1) { return true }
            }

            return false;
        });

        const sorted = results.sort((a, b) => {
                if (a.hottness < b.hottness) { return 1; }
                if (a.hottness > b.hottness) { return -1; }
                if (a.satoshis < b.satoshis) { return 1; }
                if (a.satoshis > b.satoshis) { return -1; }
                if (a.votes < b.votes) { return 1; }
                if (a.votes > b.votes) { return -1; }
                if (a.height < b.height) { return 1; }
                if (a.height > b.height) { return -1; }
                return 0;
        });

        var slice = sorted.slice(this.state.cursor, this.state.cursor + this.state.limit);

        var numPages = Math.ceil(results.length / this.state.limit);

        var pages = [...Array(numPages).keys()].map(idx => {
            const page = idx + 1;
            return <a key={"page-" + page} className={this.state.cursor == (idx*this.state.limit) ? "active" : null} onClick={() => { this.handlePageChange(page) }}>{page}</a>;
        });



        return <div>
                    <ul className="search-results">
                    {slice.map(result => {
                        return <SearchResult key={result.txid} item={result} />
                    })}
                    </ul>
                    <p className="num-results">Found {pluralize(results.length, "result", "results")}</p>
                    {pages.length > 1 && <div className="pages">{pages}</div>}
             </div>
    }
}

class SearchResult extends React.Component {
    render() {

        var url;
        if (this.props.item.type == "category") {
            if (this.props.item.txid) {
                url = "#" + this.props.item.txid;
            } else {
                url = "#";
            }
        } else if (this.props.item.type == "entry") {
            url = this.props.item.link;
        }

        return (<div className="search-result">
                    <h4><a href={url}>{this.props.item.name}</a> <span className={"badge badge-type-" + this.props.item.type}>{this.props.item.type}</span></h4>
                    {(this.props.item.type == "entry") && <a className="url" href={this.props.item.link}>{this.props.item.link}</a>}
                    <div className="satoshis">{satoshisToDollars(this.props.item.satoshis)}</div>
                    <ReactMarkdown source={this.props.item.description} />
                </div>);
    }
}
