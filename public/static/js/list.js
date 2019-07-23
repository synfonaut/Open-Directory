import { pluralize, satoshisToDollars } from "./helpers"
import { EntryItem } from "./entry"
import { CategoryItem } from "./category"
import { get_root_category_txid } from "./process";

class BaseList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            "sort": "hot",
            "limit": props.limit || 10,
            "category_limit": 10,
            "cursor": 0,
            "action": null,
            "isExpanded": false,
        };

        this._isMounted = false;
    }

    componentDidMount() {
        this._isMounted = true;
        window.addEventListener('popstate', this.clearForm.bind(this), false);
    }

    componentWillUnmount() {
        this._isMounted = false;
        window.removeEventListener('popstate', this.clearForm.bind(this));
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
            this.setState({"sort": "time", "cursor": 0});
        } else if (order == "votes") {
            this.setState({"sort": "votes", "cursor": 0});
        } else if (order =="money") {
            this.setState({"sort": "money", "cursor": 0});
        } else if (order =="submissions") {
            this.setState({"sort": "submissions", "cursor": 0});
        } else {
            this.setState({"sort": "hot", "cursor": 0});
        }
    }

    handlePageChange(page) {
        const idx = (page - 1);
        const cursor = idx * this.state.limit;
        this.setState({"cursor": cursor});
        this.scrollToTop();
    }

    handleSuccessfulTip() {
        this.setState({"action": null});
        this.props.onSuccessHandler("Successfully upvoted " + this.props.category.type + ", it will appear automatically—please refresh the page if it doesn't");
    }

    handleShowAllCategories() {
        this.setState({"category_limit": -1});
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

    getUnsortedCategories() {
        const category_id = (this.props.category ? this.props.category.txid : get_root_category_txid());
        return this.props.items.filter(i => { return !i.deleted && i.type == "category" && i.category == category_id });
    }

    getUnsortedEntries() {
        return this.props.items.filter(i => { return !i.deleted && i.type == "entry" });
    }


    sortCompare(a, b) {
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
        } else if (this.state.sort == "submissions") {
            if (a.entries < b.entries) { return 1; }
            if (a.entries > b.entries) { return -1; }
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
    }

    getCategories() {
        return this.getUnsortedCategories().sort((a, b) => {
            return this.sortCompare(a, b);
        });
    }

    getEntries() {
        if (this.props.category) {
            const entries = this.props.items.filter(i => { return !i.deleted && i.type == "entry" && i.category && i.category == this.props.category.txid });
            return entries.sort((a, b) => {
                return this.sortCompare(a, b);
            });
        }

        return [];
    }


}

export class SubcategoryList extends BaseList {

    handleClickShowAllSubcategories() {
        this.setState({"category_limit": -1});
    }

    render() {
        const categories = this.getCategories();

        var top_categories;
        if (this.state.category_limit == -1) {
            top_categories = categories;
        } else {
            top_categories = categories.slice(0, this.state.category_limit);
        }

        const entries = this.getEntries();
        const price = satoshisToDollars(this.props.category.satoshis, window.BSV_PRICE, true);

        var slice = entries.slice(this.state.cursor, this.state.cursor + this.state.limit);

        var numPages = Math.ceil(entries.length / this.state.limit);

        var pages = [...Array(numPages).keys()].map(idx => {
            const page = idx + 1;
            return <a key={"page-" + page} className={this.state.cursor == (idx*this.state.limit) ? "active" : null} onClick={() => { this.handlePageChange(page) }}>{page}</a>;
        });

        var actions = (
            <span className="actions">
                <a onClick={this.handleToggleExpand.bind(this)} className="arrow" title={"txid " + this.props.category.txid}>{this.state.isExpanded ? <i class="fas fa-caret-right"></i> : <i className="fas fa-caret-down"></i>}</a>
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
                const root_category_txid = get_root_category_txid();
                if (root_category_txid == null || this.props.category.txid !== root_category_txid) {
                    var parent_url = "/category/" + parent.txid;
                    if (parent.txid == root_category_txid) {
                        parent_url = "/";
                    }

                    back = <div className="back"><a onClick={() => { this.props.changeURL(parent_url) }}><i className="fas fa-long-arrow-alt-left"></i> {parent.name}</a><hr /></div>;
                }

            }
            if (this.props.category.name) {
                heading = (<div className="category-meta" id={this.props.category.txid}>
                    {back}
                    <div className="upvoteContainer">
                    <div className="upvote"><a onClick={this.handleUpvote.bind(this)}><i className="fas fa-chevron-up"></i></a> <span className="number satoshis" title={this.props.category.satoshis + " sats"}>{price}</span><span className="number votes" title={this.props.category.hottness + " hottness"}>{pluralize(this.props.category.votes, "vote", "votes")}</span></div>
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
                <div id="valid-links-exist"></div>
                <div className="controls">
                    <div className="sort">
                        <span className="label">sort by</span>
                        <ul>
                        <li><i class="fab fa-hotjar"></i> <a onClick={() => { this.handleChangeSortOrder("hot") }} className={this.state.sort == "hot" ? "active" : ""}>hot</a></li>
                        <li><i class="fas fa-dollar-sign"></i> <a onClick={() => { this.handleChangeSortOrder("money") }} className={this.state.sort == "money" ? "active" : ""}>money</a></li>
                        <li><i class="fas fa-poll"></i> <a onClick={() => { this.handleChangeSortOrder("votes") }} className={this.state.sort == "votes" ? "active" : ""}>votes</a></li>
                        <li><i class="fas fa-plus"></i> <a onClick={() => { this.handleChangeSortOrder("time") }} className={this.state.sort == "time" ? "active" : ""}>new</a></li>
                        </ul>
                        <div className="clearfix"></div>
                    </div>
                </div>

                <ul className="entry list">
                {slice.map(entry => (
                    <EntryItem key={"entry-" + entry.txid} item={entry} items={this.props.items} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} changeURL={this.changeURL} />
                ))}
                </ul>
                {pages.length > 1 && <div className="pages">{pages}</div>}
                </div>
            );
        } else {
            if (!this.props.isError && !this.props.isLoading && this.props.category && this.props.category.txid) {
                entryListing = (
                    <div className="empty-entry-listing">
                    <p><i className="fas fa-link"></i></p>
                    <p>There's no links here yet—you should submit one! If you submit a good one and it gets upvoted, you'll get paid Bitcoin (SV)! 👍</p>
                    </div>
                );
            }
        }

        return (
            <div>
            {this.props.category.deleted && <div className="deleted">This category is deleted</div>}
            {heading}
            {categories && categories.length > 0 && 
                    <div className="category-wrapper">
                    <ul className="category list">
                    {top_categories.map((category, i) => {
                        const output = <CategoryItem key={"category-" + category.txid} item={category} items={this.props.items} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} changeURL={this.props.changeURL} />;

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
                    {(categories.length > top_categories.length) && <div className="show-all-subcategories"><i class="fas fa-chevron-circle-down"></i> <a onClick={this.handleShowAllCategories.bind(this)}>Show all {categories.length} subcategories</a></div>}
                    </div>}
            {entryListing}
            <div className="clearfix"></div>
            </div>
        );
    }

}

export class HomepageEntries extends BaseList {

    handleChangeEntryLimit(num) {
        this.setState({"limit": num, "cursor": 0});
    }

    getHomepageEntries() {
        const entries = this.props.items.filter(i => { return !i.deleted && i.type == "entry" });
        return entries.sort((a, b) => {
            return this.sortCompare(a, b);
        });
    }

    setCursorWithBoundsCheck(cursor) {
        const entries = this.getTopHomepageEntries();
        const numPages = Math.ceil(entries.length / this.state.limit);
        const max_cursor = ((numPages-1) * this.state.limit);
        if (cursor < 0) {
            cursor = 0;
        } else if (cursor > max_cursor) {
            cursor = max_cursor;
        }
        
        this.setState({"cursor": cursor});
    }

    scrollToTop() {
        const top = document.querySelector(".homepage.entries .top")
        if (top) {
            top.scrollIntoView(true);
        }
    }


    handleNextPageChange() {
        this.setCursorWithBoundsCheck(this.state.cursor + this.state.limit);
        this.scrollToTop();
    }

    handlePreviousPageChange() {
        this.setCursorWithBoundsCheck(this.state.cursor - this.state.limit);
        this.scrollToTop();
    }

    getTopHomepageEntries(max_entries_on_homepage=88) {
        return this.getHomepageEntries().slice(0, max_entries_on_homepage);
    }

    render() {
        const entries = this.getTopHomepageEntries();

        var slice = entries.slice(this.state.cursor, this.state.cursor + this.state.limit);

        var numPages = Math.ceil(entries.length / this.state.limit);

        var pages = [...Array(numPages).keys()].map(idx => {
            const page = idx + 1;
            return <a key={"page-" + page} className={this.state.cursor == (idx*this.state.limit) ? "active" : null} onClick={() => { this.handlePageChange(page) }}>{page}</a>;
        });

        const num_control = (
            <div className="num_per_page">
            <span className="label">per page</span>
            <ul>
            <li><a onClick={() => { this.handleChangeEntryLimit(15) }} className={this.state.limit == 15 ? "active" : ""}>15</a></li>
            <li><a onClick={() => { this.handleChangeEntryLimit(25) }} className={this.state.limit == 25 ? "active" : ""}>25</a></li>
            <li><a onClick={() => { this.handleChangeEntryLimit(50) }} className={this.state.limit == 50 ? "active" : ""}>50</a></li>
            </ul>
            <div className="clearfix"></div>
            </div>);



        if (this.state.cursor > 0) {
            pages.unshift(<a key="page-previous" onClick={() => { this.handlePreviousPageChange() }}><i className="fas fa-angle-double-left"></i></a>);
        } else {
            pages.unshift(<a className="disabled" key="page-previous"><i className="fas fa-angle-double-left"></i></a>);
        }

        const max_cursor = ((numPages-1) * this.state.limit);
        if (this.state.cursor < max_cursor) {
            pages.push(<a key="page-next" onClick={() => { this.handleNextPageChange() }}><i className="fas fa-angle-double-right"></i></a>);
        } else {
            pages.push(<a className="disabled" key="page-next"><i className="fas fa-angle-double-right"></i></a>);
        }

        if (entries.length > 0) {
            return (
                <div className="homepage entries">
                <div className="top"></div>
                <h3>Trending Links</h3>
                <div className="controls">
                    <div className="sort">
                        <span className="sort-wrapper">
                        <span className="label">sort by</span>
                        <ul>
                        <li><i class="fab fa-hotjar"></i> <a onClick={() => { this.handleChangeSortOrder("hot") }} className={this.state.sort == "hot" ? "active" : ""}>hot</a></li>
                        <li><i class="fas fa-dollar-sign"></i> <a onClick={() => { this.handleChangeSortOrder("money") }} className={this.state.sort == "money" ? "active" : ""}>money</a></li>
                        <li><i class="fas fa-poll"></i> <a onClick={() => { this.handleChangeSortOrder("votes") }} className={this.state.sort == "votes" ? "active" : ""}>votes</a></li>
                        <li><i class="fas fa-plus"></i> <a onClick={() => { this.handleChangeSortOrder("time") }} className={this.state.sort == "time" ? "active" : ""}>new</a></li>
                        </ul>
                        </span>
                    </div>
                    {num_control}
                    <div className="clearfix"></div>
                </div>

                <ul className="entry list">
                {slice.map(entry => (
                    <EntryItem key={"entry-" + entry.txid} item={entry} items={this.props.items} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} showCategory={true} changeURL={this.props.changeURL} />
                ))}
                </ul>
                {pages.length > 1 && <div className="pages">{pages}</div>}
                <hr />
                </div>
            );
        } else {
            return null;
        }
    }

}

export class HomepageList extends BaseList {

    scrollToTop() {
        const top = document.querySelector(".homepage-categories .top")
        if (top) {
            top.scrollIntoView(true);
        }
    }


    handlePageChange(page) {
        const idx = (page - 1);
        const cursor = idx * this.state.category_limit;
        this.setState({"cursor": cursor});
        this.scrollToTop();
    }

    setCursorWithBoundsCheck(cursor) {
        const categories = this.getUnsortedCategories();
        const numPages = Math.ceil(categories.length / this.state.category_limit);
        const max_cursor = ((numPages-1) * this.state.category_limit);
        if (cursor < 0) {
            cursor = 0;
        } else if (cursor > max_cursor) {
            cursor = max_cursor;
        }
        
        this.setState({"cursor": cursor});
    }

    handleNextPageChange() {
        this.setCursorWithBoundsCheck(this.state.cursor + this.state.category_limit);
        this.scrollToTop();
    }

    handlePreviousPageChange() {
        this.setCursorWithBoundsCheck(this.state.cursor - this.state.category_limit);
        this.scrollToTop();
    }

    handleChangeCategoryLimit(num) {
        this.setState({"category_limit": num, "cursor": 0});
    }

    render() {
        const categories = this.getCategories();

        const price = satoshisToDollars(this.props.category.satoshis, window.BSV_PRICE, true);

        var slice = categories.slice(this.state.cursor, this.state.cursor + this.state.category_limit);

        var numPages = Math.ceil(categories.length / this.state.category_limit);

        var pages = [...Array(numPages).keys()].map(idx => {
            const page = idx + 1;
            return <a key={"page-" + page} className={this.state.cursor == (idx*this.state.category_limit) ? "active" : null} onClick={() => { this.handlePageChange(page) }}>{page}</a>;
        });


        if (this.state.cursor > 0) {
            pages.unshift(<a key="page-previous" onClick={() => { this.handlePreviousPageChange() }}><i className="fas fa-angle-double-left"></i></a>);
        } else {
            pages.unshift(<a className="disabled" key="page-previous"><i className="fas fa-angle-double-left"></i></a>);
        }

        const max_cursor = ((numPages-1) * this.state.category_limit);
        if (this.state.cursor < max_cursor) {
            pages.push(<a key="page-next" onClick={() => { this.handleNextPageChange() }}><i className="fas fa-angle-double-right"></i></a>);
        } else {
            pages.push(<a className="disabled" key="page-next"><i className="fas fa-angle-double-right"></i></a>);
        }

        var actions = (
            <span className="actions">
                <a onClick={this.handleToggleExpand.bind(this)} className="arrow" title={"txid " + this.props.category.txid}>{this.state.isExpanded ? <i class="fas fa-caret-right"></i> : <i className="fas fa-caret-down"></i>}</a>
                {this.state.isExpanded && <a className="action" onClick={this.handleEdit.bind(this)}>edit</a>}
                {this.state.isExpanded && <a className="action" onClick={this.handleDelete.bind(this)}>delete</a>}
            </span>);



        var parent;
        if (this.props.category && this.props.category.category) {
            parent = this.findCategoryByTXID(this.props.category.category);
        }

        var back;
        if (this.props.category) {
            if (parent) {
                const root_category_txid = get_root_category_txid();
                if (root_category_txid == null || this.props.category.txid !== root_category_txid) {
                    var parent_url = "/#" + parent.txid;
                    if (parent.txid == root_category_txid) {
                        parent_url = "/#";
                    }

                    back = <div className="back"><a href={parent_url}><i className="fas fa-long-arrow-alt-left"></i> {parent.name}</a><hr /></div>;
                }

            }
        }

        const sort_control = (
            <div className="sort-control">
                <div className="sort">
                <span className="label">sort by</span>
                <ul>
                <li><i className="fab fa-hotjar"></i> <a onClick={() => { this.handleChangeSortOrder("hot") }} className={this.state.sort == "hot" ? "active" : ""}>hot</a></li>
                <li><i className="fas fa-dollar-sign"></i> <a onClick={() => { this.handleChangeSortOrder("money") }} className={this.state.sort == "money" ? "active" : ""}>money</a></li>
                <li><i class="fas fa-poll"></i> <a onClick={() => { this.handleChangeSortOrder("votes") }} className={this.state.sort == "votes" ? "active" : ""}>votes</a></li>
                <li><i class="fas fa-link"></i> <a onClick={() => { this.handleChangeSortOrder("submissions") }} className={this.state.sort == "submisions" ? "active" : ""}>links</a></li>
                <li><i class="fas fa-plus"></i> <a onClick={() => { this.handleChangeSortOrder("time") }} className={this.state.sort == "time" ? "active" : ""}>new</a></li>
                </ul>
                <div className="clearfix"></div>
                </div></div>);

        const num_control = (
            <div className="num_per_page">
            <span className="label">per page</span>
            <ul>
            <li><a onClick={() => { this.handleChangeCategoryLimit(15) }} className={this.state.category_limit == 15 ? "active" : ""}>15</a></li>
            <li><a onClick={() => { this.handleChangeCategoryLimit(25) }} className={this.state.category_limit == 25 ? "active" : ""}>25</a></li>
            <li><a onClick={() => { this.handleChangeCategoryLimit(50) }} className={this.state.category_limit == 50 ? "active" : ""}>50</a></li>
            </ul>
            <div className="clearfix"></div>
            </div>);


        return (
            <div>
            {categories && categories.length > 0 && 
                    <div className="homepage-categories">
                    <div className="top"></div>
                    <h3>Open Directories</h3>
                    <div className="controls">
                        {sort_control}
                        {num_control}
                        <div className="clearfix"></div>
                    </div>
                    <ul className="category list">
                    {slice.map((category, i) => {
                        const output = <CategoryItem key={"category-" + category.txid} item={category} items={this.props.items} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} changeURL={this.props.changeURL} />;
                        return output;
                    })}
                    <div className="clearfix"></div>
                    </ul>
                    {pages.length > 1 && <div className="pages">{pages}</div>}
                    <div className="clearfix"></div>
                    </div>}
            <div className="clearfix"></div>
            </div>
        );
    }

}
