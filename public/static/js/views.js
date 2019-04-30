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
        const category_id = (this.props.category ? this.props.category.txid: null);
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
        if (slice.length > 0) {
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

class EntryItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            "isExpanded": false,
            "isDeleting": false,
            "isEditing": false,
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
                "isExpanded": false,
                "isDeleting": false,
                "isEditing": false,
            });
        }

        const container = document.getElementById(this.props.item.txid);
        if (container) {
            const voteButton = container.querySelector(".entry-tip-money-button");
            if (voteButton) {
                const parentNode = voteButton.parentNode;
                parentNode.removeChild(voteButton);
                const newEl = document.createElement('div');
                newEl.className = "entry-tip-money-button";
                parentNode.appendChild(newEl);
            }

            const deleteButton = container.querySelector(".entry-delete-money-button");
            if (deleteButton) {
                const parentNode = deleteButton.parentNode;
                parentNode.removeChild(deleteButton);
                const newEl = document.createElement('div');
                newEl.className = "entry-delete-money-button";
                parentNode.appendChild(newEl);
            }
        }
    }

    handleUpvote(e) {
        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            "vote",
            this.props.item.txid,
        ];

        const button = document.getElementById(this.props.item.txid).querySelector(".entry-tip-money-button");
        databutton.build({
            data: OP_RETURN,
            button: {
                $el: button,
                /*$pay: {
                    to: [{
                        address: OPENDIR_PROTOCOL,
                        value: 50000,
                    }]
                },*/
                onPayment: (msg) => {
                    console.log(msg);
                    setTimeout(() => {
                        this.clearForm();
                        this.props.onSuccessHandler("Successfully upvoted link, it will appear automatically—please refresh the page if it doesn't");
                    }, 5000);
                }
            }
        });
    }

    handleToggleExpand(e) {
        this.setState({
            "isExpanded": !this.state.isExpanded,
            "isDeleting": false,
            "isEditing": false,
        });
    }

    handleEdit(e) {
        this.setState({ "isEditing": true, "isDeleting": false });
    }

    handleDelete(e) {
        this.setState({
            "isDeleting": true,
            "isEditing": false,
        }, () => {
            const OP_RETURN = [
                OPENDIR_PROTOCOL,
                "entry.delete",
                this.props.item.txid,
            ];

            const button = document.getElementById(this.props.item.txid).querySelector(".entry-delete-money-button")
            databutton.build({
                data: OP_RETURN,
                button: {
                    $el: button,
                    /*$pay: {
                    to: [{
                        address: OPENDIR_PROTOCOL,
                        value: 50000,
                    }]
                },*/
                    onPayment: (msg) => {
                        console.log(msg);
                        setTimeout(() => {
                            this.clearForm();
                            this.props.onSuccessHandler("Successfully deleted link, it will disappear automatically—please refresh the page if it doesn't");
                        }, 5000);
                    }
                }
            });
        });

    }

    collapse() {
        this.setState({
            "isExpanded": false,
            "isDeleting": false,
            "isEditing": false,
        });
    }

    render() {

        var actions = (
            <span className="actions">
                <a onClick={this.handleToggleExpand.bind(this)} className="arrow">{this.state.isExpanded ? "▶" : "▼"}</a>
                {this.state.isExpanded && <a className="action" onClick={this.handleEdit.bind(this)}>edit</a>}
                {this.state.isExpanded && <a className="action" onClick={this.handleDelete.bind(this)}>delete</a>}
            </span>);

        return (
            <li id={this.props.item.txid} className="entry">
                <div className="upvoteContainer">
                    <div className="upvote"><a onClick={this.handleUpvote.bind(this)}>▲</a> <span className="number">{this.props.item.votes}</span></div>
                    <div className="entry">
                        <h5><a href={this.props.item.link}>{this.props.item.name}</a> {!this.props.item.height && <span className="pending">pending</span>} {actions}</h5>
                        <p className="description">{this.props.item.description}</p>
                        <p className="url"><a href={this.props.item.link}>{this.props.item.link}</a></p>
                        {this.state.isEditing && <div className="column"><EditEntryForm item={this.props.item} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} onSubmit={this.collapse.bind(this)} /></div>}
                        {this.state.isDeleting && <div className="notice"><span className="warning">You are about to delete this entry, are you sure you want to do this?</span><div className="explain"><p>If you remove this link you'll be permanently removing it from this directory for others to view. Please only do this if you think it's in the best interest of the directory. Your Bitcoin key is forever tied to this transaction, so it will always be traced to you.</p><p><strong>Permanently delete this link from this directory</strong></p><div className="entry-delete-money-button"></div> </div></div>}

                        <div className="entry-tip-money-button"></div>
                   </div>
                    <div className="clearfix"></div>
                </div>
            </li>
        )
    }
}

class CategoryItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            "isExpanded": false,
            "isDeleting": false,
            "isEditing": false,
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

    collapse() {
        this.setState({
            "isExpanded": false,
            "isDeleting": false,
            "isEditing": false,
        });
    }

    clearForm() {
        if (this._isMounted) {
            this.setState({
                "isExpanded": false,
                "isDeleting": false,
                "isEditing": false,
            });

            const el = document.getElementById(this.props.item.txid).querySelector(".category-tip-money-button");
            if (el) {
                const parentNode = el.parentNode;
                if (parentNode) {
                    parentNode.removeChild(el);
                    const newEl = document.createElement('div');
                    newEl.className = "category-tip-money-button";
                    parentNode.appendChild(newEl);
                }
            }
        }
    }

    // this is the same as EntryItem above ...share code?
    handleUpvote(e) {
        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            "vote",
            this.props.item.txid,
        ];

        const button = document.getElementById(this.props.item.txid).querySelector(".category-tip-money-button");
        databutton.build({
            data: OP_RETURN,
            button: {
                $el: button,
                onPayment: (msg) => {
                    console.log(msg);
                    setTimeout(() => {
                        this.clearForm();
                    }, 5000);
                }
            }
        });
        e.preventDefault();
    }

    handleLink(e) {
        const url = e.target.href;
        history.pushState({}, "", url);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
        e.preventDefault();
    }

    handleToggleExpand(e) {
        this.setState({
            "isExpanded": !this.state.isExpanded,
            "isDeleting": false,
            "isEditing": false,
        });
    }

    handleEdit(e) {
        this.setState({"isEditing": true, "isDeleting": false});
    }


    handleDelete(e) {
        this.setState({
            "isDeleting": true,
            "isEditing": false,
        }, () => {
            const OP_RETURN = [
                OPENDIR_PROTOCOL,
                "category.delete",
                this.props.item.txid,
            ];

            const button = document.getElementById(this.props.item.txid).querySelector(".category-delete-money-button")
            console.log(button);

            databutton.build({
                data: OP_RETURN,
                button: {
                    $el: button,
                    /*$pay: {
                    to: [{
                        address: OPENDIR_PROTOCOL,
                        value: 50000,
                    }]
                },*/
                    onPayment: (msg) => {
                        console.log(msg);
                        setTimeout(() => {
                            this.clearForm();
                            this.props.onSuccessHandler("Successfully deleted category, it will disappear automatically—please refresh the page if it doesn't.");
                        }, 5000);
                    }
                }
            });
        });

    }

    render() {
        var actions = (
            <span className="actions">
                <a onClick={this.handleToggleExpand.bind(this)} className="arrow">{this.state.isExpanded ? "▶" : "▼"}</a>
                {this.state.isExpanded && <a className="action" onClick={this.handleEdit.bind(this)}>edit</a>}
                {this.state.isExpanded && <a className="action" onClick={this.handleDelete.bind(this)}>delete</a>}
            </span>);


        return (
            <li id={this.props.item.txid} className="category">

                <div className="upvoteContainer">
                    <div className="upvote">
                        <a onClick={this.handleUpvote.bind(this)}>▲</a>
                        <span className="number">{this.props.item.votes}</span>
                    </div>
                    <div className="category">
                        <h3>
                            <a href={"#" + this.props.item.txid} onClick={this.handleLink.bind(this)}>{this.props.item.name}</a>
                            {!this.props.item.height && <span className="pending">pending</span>}
                            <span className="category-count">({this.props.item.entries})</span>
                            {actions}
                        </h3>
                        <p className="description" dangerouslySetInnerHTML={{__html: this.props.item.rendered_description}}></p>
                        {this.state.isEditing && <div className="column"><EditCategoryForm category={this.props.item} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} onSubmit={this.collapse.bind(this)} /></div>}
                        {this.state.isDeleting && <div className="notice"><span className="warning">You are about to delete this entry, are you sure you want to do this?</span><div className="explain"><p>If you remove this category you'll be permanently removing it from this directory for others to view. Please only do this if you think it's in the best interest of the directory. Your Bitcoin key is forever tied to this transaction, so it will always be traced to you.</p><p><strong>Permanently delete category from this directory</strong></p><div className="category-delete-money-button"></div> </div></div>}
                        <div className="category-tip-money-button"></div>
                    </div>
                    <div className="clearfix"></div>
                </div>
            </li>

        )
    }
}

class Changelog extends React.Component {

    render() {
        return (
            <div id="changelog">
                <table>
                    <tbody>
                    {this.props.items.length == 0 && <tr><td>Empty changelog</td></tr>}
                    {this.props.items.map(i => {
                        const txid = i.txid.substring(0, 25);
                        return <React.Fragment key={"changelog-" + i.txid}><tr>
                            <td className="height">{i.height ? i.height : "pending"}</td>
                            <td className="action">{i.data.s2}</td>
                            <td className="address">{i.address}</td>
                            <td className="txid"><a href={"https://whatsonchain.com/tx/" + i.txid}>{txid}...</a></td></tr>
                            <tr>
                            <td className="data" colSpan="4"><pre><code>{JSON.stringify(i.data, null, 4)}</code></pre></td>
                            </tr></React.Fragment>;
                    })}
                    </tbody>
                </table>
            </div>
        )
    }
}
