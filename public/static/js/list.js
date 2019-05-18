class List extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            "sort": "hot",
            "limit": 10,
            "cursor": 0,
            "action": null,
            "isExpanded": false,
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
                "action": null,
                "isExpanded": false,
                "cursor": 0,
            });
        }
    }

    findCategoryByTXID(txid) {
        return this.props.items.filter(i => { return i.type == "category" && i.txid == txid }).shift();
    }

    handleChangeSortOrder(order) {
        if (order == "time") {
            this.setState({"sort": "time"});
        } else if (order == "votes") {
            this.setState({"sort": "votes"});
        } else if (order =="money") {
            this.setState({"sort": "money"});
        } else {
            this.setState({"sort": "hot"});
        }
    }

    handlePageChange(page) {
        const idx = (page - 1);
        const cursor = idx * this.state.limit;
        this.setState({"cursor": cursor});
    }

    handleSuccessfulTip() {
        this.setState({"action": null});
        this.props.onSuccessHandler("Successfully upvoted " + this.props.category.type + ", it will appear automatically—please refresh the page if it doesn't");
    }

    handleSuccessfulDelete() {
        this.setState({"action": null});
        this.props.onSuccessHandler("Successfully deleted " + this.props.category.type + ", it will appear automatically—please refresh the page if it doesn't");
    }

    handleUpvote(e) {
        this.setState({"action": "tipping"});
    }

    handleToggleExpand(e) {
        this.setState({
            "isExpanded": !this.state.isExpanded,
            "action": null,
        });
    }

    handleEdit(e) {
        this.setState({"action": "editing"});
    }

    handleDelete(e) {
        this.setState({"action": "deleting"});
    }


    render() {
        const categories = this.getCategories();
        const entries = this.getEntries();
        const price = satoshisToDollars(this.props.category.satoshis, BSV_PRICE, true);

        var slice = entries.slice(this.state.cursor, this.state.cursor + this.state.limit);

        var numPages = Math.ceil(entries.length / this.state.limit);

        var pages = [...Array(numPages).keys()].map(idx => {
            const page = idx + 1;
            return <a key={"page-" + page} className={this.state.cursor == (idx*this.state.limit) ? "active" : null} onClick={() => { this.handlePageChange(page) }}>{page}</a>;
        });

        var actions = (
            <span className="actions">
                <a onClick={this.handleToggleExpand.bind(this)} className="arrow" title={"txid " + this.props.category.txid}>{this.state.isExpanded ? "▶" : "▼"}</a>
                {this.state.isExpanded && <a className="action" onClick={this.handleEdit.bind(this)}>edit</a>}
                {this.state.isExpanded && <a className="action" onClick={this.handleDelete.bind(this)}>delete</a>}
            </span>);



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
            if (this.props.category.name) {
                heading = (<div className="category-meta" id={this.props.category.txid}>
                    {back}
                    <div className="upvoteContainer">
                    <div className="upvote"><a onClick={this.handleUpvote.bind(this)}>▲</a> <span className="number" title={this.props.category.satoshis + " sats"}>{price}</span><br /><span className="number">{this.props.category.votes}</span></div>
                    <div>
                    <h1>{this.props.category.name}
                    {actions}
                    </h1>
                    {this.state.action && <div className="category-container">
                        {this.state.action == "editing" && <div className="column"><EditCategoryForm category={this.props.category} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} onSubmit={this.clearForm.bind(this)} /></div>}
                        {this.state.action == "tipping" && <TipchainItem item={this.props.category} items={this.props.items} onSuccessHandler={this.handleSuccessfulTip.bind(this)} onErrorHandler={this.props.onErrorHandler} />}
                        {this.state.action == "deleting"  && <DeleteItem item={this.props.category} onSuccessHandler={this.handleSuccessfulDelete.bind(this)} onErrorHandler={this.props.onErrorHandler} />}
                    </div>}
                    <div className="markdown"><ReactMarkdown source={this.props.category.description} /></div>
                    </div>
                    <div className="clearfix"></div>
                    </div>
                    </div>);
            }
        }

        var entryListing;
        if (this.props.category.address && slice.length > 0) {
            entryListing = (
                <div>
                <div className="sort">
                <span className="label">sort by</span>
                <ul>
                <li><a onClick={() => { this.handleChangeSortOrder("hot") }} className={this.state.sort == "hot" ? "active" : ""}>hot</a></li>
                <li><a onClick={() => { this.handleChangeSortOrder("money") }} className={this.state.sort == "money" ? "active" : ""}>$</a></li>
                <li><a onClick={() => { this.handleChangeSortOrder("votes") }} className={this.state.sort == "votes" ? "active" : ""}>votes</a></li>
                <li><a onClick={() => { this.handleChangeSortOrder("time") }} className={this.state.sort == "time" ? "active" : ""}>new</a></li>
                </ul>
                <div className="clearfix"></div>
                </div>

                <ul className="entry list">
                {slice.map(entry => (
                    <EntryItem key={"entry-" + entry.txid} item={entry} items={this.props.items} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} />
                ))}
                </ul>
                {pages.length > 1 && <div className="pages">{pages}</div>}
                </div>
            );
        } else {
            if (!this.props.isError && !this.props.isLoading && this.props.category && this.props.category.txid) {
                entryListing = (
                    <div className="empty-entry-listing">
                    <img src="/static/img/link.png" />
                    <p>There's no links here yet. Go ahead and add a new link below. 👍</p>
                    </div>
                );
            }
        }


        const isHome = this.props.category.txid == null;
        return (
            <div>
            {heading}
            {categories && categories.length > 0 && 
                    <div className={isHome ? "homepage" : "subcategories"}>
                    <ul className="category list">
                    {categories.map((category, i) => {
                        const output = <CategoryItem key={"category-" + category.txid} item={category} items={this.props.items} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} />;

                        if (((i+1) % 3) == 0) {
                            return [
                                output,
                                <div key={"category-clearfix-" + i} className="clearfix three-column"></div>
                            ];
                        } else if (((i+1) % 2) == 0) {
                            return [
                                output,
                                <div key={"category-clearfix-" + i} className="clearfix two-column"></div>
                            ];
                        } else {
                            return output;
                        }
                    })}
                    <div className="clearfix"></div>
                    </ul>
                    <div className="clearfix"></div>
                    </div>}
            {entryListing}
            <div className="clearfix"></div>
            </div>
        );
    }

    getCategories() {
        const category_id = (this.props.category ? this.props.category.txid : null);
        const categories = this.props.items.filter(i => { return !i.deleted && i.type == "category" && i.category == category_id });
        return categories.sort((a, b) => {
            if (a.satoshis < b.satoshis) { return 1; }
            if (a.satoshis > b.satoshis) { return -1; }
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
                } else if (this.state.sort == "votes") {
                    if (a.votes < b.votes) { return 1; }
                    if (a.votes > b.votes) { return -1; }
                    if (a.height < b.height) { return 1; }
                    if (a.height > b.height) { return -1; }
                } else if (this.state.sort == "money") {
                    if (a.satoshis < b.satoshis) { return 1; }
                    if (a.satoshis > b.satoshis) { return -1; }
                    if (a.votes < b.votes) { return 1; }
                    if (a.votes > b.votes) { return -1; }
                    if (a.height < b.height) { return 1; }
                    if (a.height > b.height) { return -1; }
                } else { // hot
                    if (a.hottness < b.hottness) { return 1; }
                    if (a.hottness > b.hottness) { return -1; }
                    if (a.satoshis < b.satoshis) { return 1; }
                    if (a.satoshis > b.satoshis) { return -1; }
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

}

