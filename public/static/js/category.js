class CategoryItem extends Item {

    render() {
        const price = satoshisToDollars(this.props.item.satoshis, BSV_PRICE, true);

        return (
            <li id={this.props.item.txid} className="category">

                <div className="upvoteContainer">
                    <div className="upvote"><a onClick={this.handleUpvote.bind(this)}><i className="fas fa-chevron-up"></i>&nbsp;</a> <span className="number" title={this.props.item.satoshis + " sats"}>{price}</span><br /><span className="number votes">{this.props.item.votes}</span></div>
                    <div className="category">
                        <h3>
                            <a href={"#" + this.props.item.txid} onClick={this.handleUpvote.bind(this)}>{this.props.item.name}</a>
                            {!this.props.item.height && <span className="pending">pending</span>}
                            <span className="category-count">({this.props.item.entries})</span>
                        </h3>
                        <ReactMarkdown className="description" source={this.props.item.description} />
                        {this.state.action == "tipping" && <TipchainItem item={this.props.item} items={this.props.items} onSuccessHandler={this.handleSuccessfulTip.bind(this)} onErrorHandler={this.props.onErrorHandler} />}
                    </div>
                    <div className="clearfix"></div>
                </div>
            </li>
        )
    }
}


class AddCategoryForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            title: "",
            description: "",
        };

        this._isMounted = false;

        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleLinkChange = this.handleLinkChange.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }



    render() {
        const dirtype = (this.props.category.txid ? "category" : "directory");
        var header;
        if (this.props.category.txid) {
            header = <div><h3><i className="fas fa-folder"></i> Add new subcategory under <span className="highlight">{this.props.category.name}</span></h3>
                <p>Submit a new subcategory to earn money when links get submitted and upvoted. Keep it high-quality, remember this action is forever tied to your Bitcoin address.</p></div>
        } else {
            header = <div>
                <h3><i className="fas fa-folder"></i> Add new directory</h3>
                <p>Submit a new directory to earn money when links and categories get submitted and upvoted. Keep it high-quality, remember this action is forever tied to your Bitcoin address.</p>
                </div>
        }
        return (
            <div className="column" id={this.getCategoryID()}>
                {header}
                <form onSubmit={this.handleSubmit}>
                    <fieldset>
                        <div className="row">
                            <div className="column">
                                <label>
                                    Title:
                                    <input type="text" value={this.state.title} onChange={this.handleTitleChange} />
                                </label>
                            </div>
                            <div className="column"></div>
                        </div>
                        <label>
                            Description:
                            <textarea onChange={this.handleDescriptionChange} value={this.state.description}></textarea>
                        </label>
                        <input type="submit" className="button button-outline" value={this.props.category.txid ? "Add new subcategory" : "Add new directory"} />
                        <div>
                            <div className="add-category-money-button"></div>
                        </div>
                    </fieldset>
                </form>
            </div>
        )
    }


    handleSubmit(e) {
        e.preventDefault();

        if (!this.validate()) {
            return;
        }

        var OP_RETURN = [
            OPENDIR_PROTOCOL,
            "category.create",
        ];

        if (this.props.category.txid) {
            OP_RETURN.push(this.props.category.txid);
        }

        OP_RETURN.push("name");
        OP_RETURN.push(this.state.title);

        OP_RETURN.push("description");
        OP_RETURN.push(this.state.description);

        console.log(OP_RETURN);

        const el = document.querySelector(".add-category-money-button");
        databutton.build({
            data: OP_RETURN,
            button: {
                $el: el,
                onPayment: (msg) => {
                    console.log(msg);
                    setTimeout(() => { this.clearForm() }, 5000);
                    setTimeout(() => {
                        this.setState({ title: "", description: "" });
                        if (this.props.category.txid) {
                            this.props.onSuccessHandler("Successfully added new category, it will appear automatically—please refresh the page if it doesn't.");
                        } else {
                            this.props.onSuccessHandler("Successfully added new category. Due to heavy demand we're caching the front page longer, so please wait up to a minute and refresh. We're working on resolving this ASAP!");
                        }
                    }, 3000);
                }
            }
        })

    }

    getCategoryID() {
        return (this.props.category.txid ? this.props.category.txid : "root-category");
    }

    componentDidMount() {
        window.addEventListener('hashchange', this.clearForm.bind(this), false);
        this._isMounted = true;
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange', this.clearForm.bind(this));
        this._isMounted = false;
    }

    clearForm() {
        if (this._isMounted) {
            const el = document.querySelector(".add-category-money-button");
            if (el) {
                const parentNode = el.parentNode;
                parentNode.removeChild(el);
                const newEl = document.createElement('div');
                newEl.className = "add-category-money-button";
                parentNode.appendChild(newEl);
            }

            this.setState({
                title: "",
                description: "",
            });
        }
    }

    validate() {
        if (!this.state.title) {
            alert("Invalid title");
            return false;
        }

        if (!this.state.description) {
            alert("Invalid description");
            return false;
        }

        return true;
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

class EditCategoryForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            title: props.category.name,
            description: props.category.description,
            isShowingWarning: false,
        };

        this._isMounted = false;

        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleLinkChange = this.handleLinkChange.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    render() {
        return (
            <div className="column" id={this.getCategoryID()}>
                <h3>Edit <span className="highlight">{this.props.category.name}</span></h3>
                <form onSubmit={this.handleSubmit}>
                    <fieldset>
                        <div className="row">
                            <div className="column">
                                <label>
                                    Title:
                                    <input type="text" value={this.state.title} onChange={this.handleTitleChange} />
                                </label>
                            </div>
                            <div className="column"></div>
                        </div>
                        <label>
                            Description:
                            <textarea onChange={this.handleDescriptionChange} value={this.state.description}></textarea>
                        </label>
                        <input type="submit" className="button button-outline" value="Edit category" />
                        <div>
                            {this.state.isShowingWarning && <div className="notice"><span className="warning">You are editing this category, are you sure you want to do this?</span><div className="explain"><p>If you change this category you'll be permanently changing it in this directory for everyone else. Please only do this if you think it's in the best interest of the directory. Your Bitcoin key is forever tied to this transaction, so it will always be traced to you.</p><p><strong>Permanently change this category?</strong></p><div className="change-category-money-button"></div> </div></div>}
                        </div>
                    </fieldset>
                </form>
            </div>
        )
    }

    handleSubmit(e) {
        e.preventDefault();

        if (!this.validate()) {
            return;
        }

        if (!this.props.category.txid) {
            alert("An unknown error occured, category doesn't have a txid to edit");
            return;
        }

        var OP_RETURN = [
            OPENDIR_PROTOCOL,
            "category.update",
            this.props.category.txid,
        ];

        var edited = false;
        if (this.props.category.name != this.state.title) {
            OP_RETURN.push("name");
            OP_RETURN.push(this.state.title);
            edited = true;
        }

        if (this.props.category.description != this.state.description) {
            OP_RETURN.push("description");
            OP_RETURN.push(this.state.description);
            edited = true;
        }

        if (!edited) {
            alert("Nothing was edited with the category, please try again");
            return;
        }

        this.setState({"isShowingWarning": true}, () => {
            console.log(OP_RETURN);

            const el = document.getElementById(this.getCategoryID()).querySelector(".change-category-money-button");
            databutton.build({
                data: OP_RETURN,
                button: {
                    $el: el,
                    onPayment: (msg) => {
                        console.log(msg);
                        setTimeout(() => {
                            const name = this.state.title;
                            const desc = this.state.description;

                            this.clearForm()
                            this.setState({ title: name, description: desc });

                            this.props.onSubmit();
                        }, 5000);
                        setTimeout(() => {
                            this.props.onSuccessHandler("Successfully edited category, it will appear automatically—please refresh the page if it doesn't.");
                        }, 3000);
                    }
                }
            })
        });

    }

    getCategoryID() {
        return (this.props.category.txid ? this.props.category.txid : "root-category");
    }

    componentDidMount() {
        window.addEventListener('hashchange', this.clearForm.bind(this), false);
        this._isMounted = true;
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange', this.clearForm.bind(this));
        this._isMounted = false;
    }

    clearForm() {
        if (this._isMounted) {
            const el = document.getElementById(this.getCategoryID()).querySelector(".change-category-money-button");
            if (el) {
                const parentNode = el.parentNode;
                parentNode.removeChild(el);
                const newEl = document.createElement('div');
                newEl.className = "change-category-money-button";
                parentNode.appendChild(newEl);
            }

            this.setState({
                title: "",
                description: "",
                isShowingWarning: false,
            });
        }
    }

    validate() {
        if (!this.state.title) {
            alert("Invalid title");
            return false;
        }

        if (!this.state.description) {
            alert("Invalid description");
            return false;
        }

        return true;
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

class AddDirectoryPage extends React.Component {
    render() {
        return <div>
            <br />
            <AddCategoryForm category={this.props.category} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} />
        </div>;
    }
}
