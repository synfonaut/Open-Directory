class CategoryItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            "isExpanded": false,
            "isDeleting": false,
            "isEditing": false,
            "isTipping": false,
            "tip": 0.05,
            "isShowingTipChain": false
        };

        this._isMounted = false;
        this.handleTipSubmit = this.handleTipSubmit.bind(this);
        this.handleClickTip = this.handleClickTip.bind(this);
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
            "isTipping": false,
            "isShowingTipChain": false,
        });
    }

    clearForm() {
        if (this._isMounted) {
            this.setState({
                "isExpanded": false,
                "isDeleting": false,
                "isEditing": false,
                "isTipping": false,
                "isShowingTipChain": false,
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

    handleUpvote(e) {
        this.setState({"isTipping": true});
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
            "isTipping": false,
            "isShowingTipChain": false,
        });
    }

    handleEdit(e) {
        this.setState({ "isEditing": true, "isDeleting": false, "isTipping": false, "isShowingTipChain": false });
    }


    handleDelete(e) {
        this.setState({
            "isDeleting": true,
            "isEditing": false,
            "isTipping": false,
            "isTipping": false,
            "isShowingTipChain": false,
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

    handleTipSubmit(e) {
        if (e) {
            e.preventDefault();
        }

        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            "vote",
            this.props.item.txid,
        ];

        var tipchain = this.props.item.tipchain;
        if (!tipchain || tipchain.length == 0) {
            if (!confirm("Tipchain is invalid, please refresh or press OK to continue anyway")) {
                return;
            }
        }

        var amount = OPENDIR_TIP_AMOUNT;
        const tip = this.state.tip;
        if (this.state.tip > 0) {
            amount = this.state.tip;
        }

        console.log("tipchain", tipchain);
        const payments = calculateTipPayment(tipchain, amount, OPENDIR_TIP_CURRENCY);
        console.log("payments", payments);

        const button = document.getElementById(this.props.item.txid).querySelector(".category-tip-money-button");
        databutton.build({
            data: OP_RETURN,
            button: {
                $el: button,
                label: "upvote",
                $pay: { to: payments, },
                onPayment: (msg) => {
                    console.log(msg);
                    setTimeout(() => {
                        this.clearForm();
                        this.props.onSuccessHandler("Successfully upvoted category, it will appear automatically—please refresh the page if it doesn't");
                    }, 5000);
                }
            }
        });
    }

    handleClickTip(e) {
        const amt = e.currentTarget.dataset.value;
        if (amt > 0) {
            this.setState({"tip": amt}, () => {
                this.handleTipSubmit();
            });
        }
    }

    handleChangeTip(e) {  
        this.setState({"tip": e.target.value});
    }

    handleClickTipchain(e) {  
        this.setState({"isShowingTipChain": !this.state.isShowingTipChain});
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
        var header = <h3>Add new directory</h3>
        if (this.props.category.txid) {
            header = <h3>Add new subcategory under <span className="highlight">{this.props.category.name}</span></h3>
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
                        this.props.onSuccessHandler("Successfully added new category, it will appear automatically—please refresh the page if it doesn't.");
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
                <br />
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
