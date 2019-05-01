class List extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            "sort": "votes",
            "limit": 10,
            "cursor": 0,
        };
    }

    getCategories() {
        const category_id = (this.props.category ? this.props.category.txid : null);
        const categories = this.props.items.filter(i => { return !i.deleted && i.type == "category" && i.category == category_id });
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
            const entries = this.props.items.filter(i => { return !i.deleted && i.type == "entry" && i.category && i.category == this.props.category.txid });
            return entries.sort((a, b) => {
                if (this.state.sort == "time") {
                    if (!a.height) { return -1; }
                    if (a.height < b.height) { return 1; }
                    if (a.height > b.height) { return -1; }
                } else {
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

    findCategoryByTXID(txid) {
        return this.props.items.filter(i => { return i.type == "category" && i.txid == txid }).shift();
    }

    handleChangeSortOrder(order) {
        if (order == "time") {
            this.setState({"sort": "time"});
        } else {
            this.setState({"sort": "votes"});
        }
    }

    handlePageChange(page) {
        const idx = (page - 1);
        const cursor = idx * this.state.limit;
        this.setState({"cursor": cursor});
    }

    render() {
        const categories = this.getCategories();
        const entries = this.getEntries();

        var slice = entries.slice(this.state.cursor, this.state.cursor + this.state.limit);

        var numPages = Math.ceil(entries.length / this.state.limit);

        var pages = [...Array(numPages).keys()].map(idx => {
            const page = idx + 1;
            return <a key={"page-" + page} className={this.state.cursor == (idx*this.state.limit) ? "active" : null} onClick={() => { this.handlePageChange(page) }}>{page}</a>;
        });

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
                <h1>{this.props.category.name}</h1>
                <p dangerouslySetInnerHTML={{__html: this.props.category.rendered_description}}></p>
            </div>);
        }

        var entryListing;
        if (this.props.category.address && slice.length > 0) {
            entryListing = (
                <div>
                    <div className="sort">
                        <span className="label">sort by</span>
                        <ul>
                            <li><a onClick={() => { this.handleChangeSortOrder("vote") }} className={this.state.sort == "votes" ? "active" : ""}>votes</a></li>
                            <li><a onClick={() => { this.handleChangeSortOrder("time") }} className={this.state.sort == "time" ? "active" : ""}>time</a></li>
                        </ul>
                        <div className="clearfix"></div>
                    </div>

                    <ul className="entry list">
                        {slice.map(entry => (
                            <EntryItem key={"entry-" + entry.txid} item={entry} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} />
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

        return (
            <div>
                {heading}
                <ul className="category list">
                    {categories.map(category => (
                        <CategoryItem key={"category-" + category.txid} item={category} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} />
                    ))}
                </ul>
                <div className="clearfix"></div>
                {entryListing}
                <div className="clearfix"></div>
            </div>
        );
    }
}

