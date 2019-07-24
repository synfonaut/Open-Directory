import { getLink, findObjectByTX, pluralize, satoshisToDollars, timeDifference } from "./helpers"
import { fetch_search_from_network } from "./process";

export class SearchPage extends React.Component {


    constructor(props) {
        super(props);

        this.state = {
            "search": "",
            "items": [],
        };
    }

    handleSearch(search) {
        this.setState({"search": search});

        fetch_search_from_network(search, this.props.category.txid).then((results) => {
            this.setState({"items": results});
        });
    }


    render() {
        return (<div className="search">
                    <SearchForm search={this.state.search} title={this.props.title} onSearch={this.handleSearch.bind(this)} category={this.props.category} embed={this.props.embed} changeURL={this.props.changeURL} />
                    {this.state.search && <SearchResults search={this.state.search} items={this.state.items} changeURL={this.props.changeURL} />}
                </div>);
    }
}

export class SearchForm extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            "search": "",
        };
    }

    handleSearch(e) {
        e.preventDefault();
        this.props.onSearch(this.state.search);
    }

    handleChangeSearch(e) {
        this.setState({"search": e.target.value});
    }

    render() {
        var searching;
        if (this.props.category && this.props.category.name) {
            searching = <span>Search <a onClick={() => { this.props.changeURL("/category/" + this.props.category.txid) }}>{this.props.category.name}</a></span>;
        } else if (this.props.category && this.props.category.txid) {
            searching = <span>Search category {this.props.category.txid.slice(0, 5)}...</span>;
        } else if (this.props.category && !this.props.category.txid) {
            searching = <span>Search <a onClick={() => { this.props.changeURL("/") }}>Open Directory</a></span>;
        }

        if (this.props.embed) {
            return (<div className="search embed">
                        <form onSubmit={this.handleSearch.bind(this)}>
                            <input type="search" value={this.state.search} onChange={this.handleChangeSearch.bind(this)} placeholder="Search the Open Directory..." />
                            <input type="submit" className="button-outline" value="Search" />
                        </form>
                    </div>);
        } else {
            return (<div className="search page">
                        <h2>{searching}</h2>
                        <p className="blurb">Search by name, description, link, txid, address...</p>
                        <form onSubmit={this.handleSearch.bind(this)}>
                            <input type="search" value={this.state.search} onChange={this.handleChangeSearch.bind(this)} />
                            <input type="submit" className="button-outline" value="Search" />
                        </form>
                    </div>);
        }
    }
}

export class SearchResults extends React.Component {

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
        var slice = this.props.items.slice(this.state.cursor, this.state.cursor + this.state.limit);

        var numPages = Math.ceil(this.props.items.length / this.state.limit);

        var pages = [...Array(numPages).keys()].map(idx => {
            const page = idx + 1;
            return <a key={"page-" + page} className={this.state.cursor == (idx*this.state.limit) ? "active" : null} onClick={() => { this.handlePageChange(page) }}>{page}</a>;
        });

        return <div>
                    <ul className="search-results">
                    {slice.map(result => {
                        return <SearchResult key={result.txid} item={result} items={this.props.items} changeURL={this.props.changeURL} />
                    })}
                    </ul>
                    <p className="num-results">Found {pluralize(this.props.items.length, "result", "results")}</p>
                    {pages.length > 1 && <div className="pages">{pages}</div>}
             </div>
    }
}

class SearchResult extends React.Component {
    render() {

        if (this.props.item.type == "category") {
            var url;
            if (this.props.item.txid) {
                url = "/category/" + this.props.item.txid;
            } else {
                url = "/";
            }

            return (<div className="search-result">
                <h4><a onClick={() => { this.props.changeURL(url) }}>{this.props.item.name}</a> <span className={"badge badge-type-" + this.props.item.type}>{this.props.item.type}</span></h4>

            {(this.props.item.type == "entry") && <a className="url" href={getLink(this.props.item.link)}>{this.props.item.link}</a>}
            <div className="satoshis">{satoshisToDollars(this.props.item.satoshis)} - {pluralize(this.props.item.votes, "vote", "votes")} - {pluralize(this.props.item.entries, "link", "links")} in category</div>
            <ReactMarkdown source={this.props.item.description} />
            </div>);

        } else if (this.props.item.type == "entry") {

            const url = this.props.item.link;
            var category = findObjectByTX(this.props.item.category, this.props.items);

            return (<div className="search-result">
                <h4><a href={url}>{this.props.item.name}</a> <span className={"badge badge-type-" + this.props.item.type}>{this.props.item.type}</span> <span className="from-category-prefix">in</span> <a className="from-category" onClick={() => { this.props.changeURL("/category/" + category.txid) }}>{category.name}</a></h4>

            {(this.props.item.type == "entry") && <a className="url" href={getLink(this.props.item.link)}>{this.props.item.link}</a>}
            <div className="satoshis">{satoshisToDollars(this.props.item.satoshis)} - {pluralize(this.props.item.votes, "vote", "votes")}</div>
            <ReactMarkdown source={this.props.item.description} />
            </div>);
        }


    }
}
