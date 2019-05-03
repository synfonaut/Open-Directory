
class EntryItem extends React.Component {

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

    clearForm() {

        if (this._isMounted) {
            this.setState({
                "isExpanded": false,
                "isDeleting": false,
                "isEditing": false,
                "isTipping": false,
                "isShowingTipChain": false,
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
        this.setState({"isTipping": true});

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
                "entry.delete",
                this.props.item.txid,
            ];

            const button = document.getElementById(this.props.item.txid).querySelector(".entry-delete-money-button")
            databutton.build({
                data: OP_RETURN,
                button: {
                    $el: button,
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
            "isTipping": false,
            "isShowingTipChain": false,
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

        const amount = Number(this.state.tip);

        console.log("tipchain", tipchain);
        const payments = calculateTipPayment(tipchain, amount, OPENDIR_TIP_CURRENCY);
        console.log("payments", payments);

        const button = document.getElementById(this.props.item.txid).querySelector(".entry-tip-money-button");
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
                        this.props.onSuccessHandler("Successfully upvoted link, it will appear automatically—please refresh the page if it doesn't");
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

        const tipchain = expandTipchainInformation(this.props.item.tipchain, this.state.tip, this.props.items);

        var actions = (
            <span className="actions">
                <a onClick={this.handleToggleExpand.bind(this)} className="arrow">{this.state.isExpanded ? "▶" : "▼"}</a>
                {this.state.isExpanded && <a className="action" onClick={this.handleEdit.bind(this)}>edit</a>}
                {this.state.isExpanded && <a className="action" onClick={this.handleDelete.bind(this)}>delete</a>}
            </span>);

        const price = satoshisToDollars(this.props.item.satoshis, BSV_PRICE, true);

        return (
            <li id={this.props.item.txid} className="entry">
                <div className="upvoteContainer">
                    <div className="upvote"><a onClick={this.handleUpvote.bind(this)}>▲</a> <span className="number">{price}</span><br /><span className="number">{this.props.item.votes}</span></div>
                    <div className="entry">
                        <h5><a href={this.props.item.link}>{this.props.item.name}</a> {!this.props.item.height && <span className="pending">pending</span>} {actions}</h5>
                        <p className="description">{this.props.item.description}</p>
                        <p className="url"><a href={this.props.item.link}>{this.props.item.link}</a></p>
                        <p className="txid">{this.props.item.txid}</p>
                        {this.state.isEditing && <div className="column"><EditEntryForm item={this.props.item} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} onSubmit={this.collapse.bind(this)} /></div>}
                        {this.state.isDeleting && <div className="notice"><span className="warning">You are about to delete this entry, are you sure you want to do this?</span><div className="explain"><p>If you remove this link you'll be permanently removing it from this directory for others to view. Please only do this if you think it's in the best interest of the directory. Your Bitcoin key is forever tied to this transaction, so it will always be traced to you.</p><p><strong>Permanently delete this link from this directory</strong></p><div className="entry-delete-money-button"></div> </div></div>}

                        {this.state.isTipping && <div className="tipping">
                                <form onSubmit={this.handleTipSubmit.bind(this)}>
                                <label>Tip &nbsp;<a className="suggested-tip" data-value="0.05" onClick={this.handleClickTip}>5¢</a>
                                <a className="suggested-tip" data-value="0.10" onClick={this.handleClickTip}>10¢</a>
                                <a className="suggested-tip" data-value="0.25" onClick={this.handleClickTip}>25¢</a>
                                <a className="suggested-tip" data-value="1.00" onClick={this.handleClickTip}>$1.00</a>
                                $</label>
                                <input className="tip" type="text" placeholder="0.05" value={this.state.tip} onChange={this.handleChangeTip.bind(this)} /> <input type="submit" className="button button-outline" value="tip" />
                                </form>
                                <hr />
                                <div className="tipchain">
                                    <p><a onClick={this.handleClickTipchain.bind(this)}>{pluralize(tipchain.length, "address", "addresses")}</a> in this tipchain</p>
                                    {this.state.isShowingTipChain && <ul>
                                        {tipchain.map((t, i) => {
                                            const split = (Number(t.split) * 100).toFixed(2);
                                            var amount = Number(t.amount).toFixed(2);
                                            var symbol = "$";
                                            if (t.amount > 0 && amount == "0.00") {
                                                amount = Number(t.amount).toFixed(3);
                                            }
                                            if (t.type == "opendirectory") {
                                                return <li key={t.address}>{symbol}{amount} to <strong>{t.name}</strong> {t.address}</li>;
                                            } else if (t.type == "media") {
                                                return <li key={t.address}>{symbol}{amount} to original content owner <strong>{t.address}</strong></li>;
                                            } else if (t.type == "category") {
                                                return <li key={t.address}>{symbol}{amount} to <strong>{t.name}</strong> category creator {t.address}</li>;
                                            } else if (t.type == "entry") {
                                                return <li key={t.address}>{symbol}{amount} to <strong>{t.name}</strong> entry submitter {t.address}</li>;
                                            } else {
                                                return <li key={t.address}>{symbol}{amount} <strong>{t.name}</strong> {t.address}</li>;
                                            }
                                        })}
                                        <li key="desc"><a href="#about">Learn more</a></li>
                                        </ul>}
                                </div>
                                <div className="money-button-wrapper">
                                    <div className="entry-tip-money-button"></div>
                                </div>
                                </div>}
                   </div>
                    <div className="clearfix"></div>
                </div>
            </li>
        )
    }
}

class AddEntryForm extends React.Component {

    render() {
        return (
            <div className="column">
                <h3>Add new link to <span className="highlight">{this.props.category.name}</span></h3>
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
                            Link:
                            <input type="text" value={this.state.link} onChange={this.handleLinkChange} placeholder="bit://" />
                        </label>
                        <label>
                            Description:
                            <textarea onChange={this.handleDescriptionChange} value={this.state.description}></textarea>
                        </label>
                        <input type="submit" className="button-outline" value="Add new link" />
                        <div>
                            <div className="add-entry-money-button"></div>
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

        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            "entry.create",
            this.props.category.txid,
            "name",
            this.state.title,
            "link",
            this.state.link,
            "description",
            this.state.description,
        ];

        console.log(OP_RETURN);

        const el = document.querySelector(".add-entry-money-button");

        databutton.build({
            data: OP_RETURN,
            button: {
                $el: el,
                onPayment: (msg) => {
                    console.log(msg)


                    setTimeout(() => {
                        this.clearForm();
                    }, 5000);

                    setTimeout(() => {
                        this.setState({
                            title: "",
                            link: "",
                            description: ""
                        });

                        this.props.onSuccessHandler("Successfully added new link, it will appear automatically—please refresh the page if it doesn't.");
                    }, 3000);
                }
            }
        })

    }

    constructor(props) {
        super(props);
        this.state = {
            title: "",
            link: "",
            description: ""
        };

        this._isMounted = false;
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleLinkChange = this.handleLinkChange.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
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
            const el = document.querySelector(".add-entry-money-button");
            if (el) {
                const parentNode = el.parentNode;
                parentNode.removeChild(el);
                const newEl = document.createElement('div');
                newEl.className = "add-entry-money-button";
                parentNode.appendChild(newEl);
            }

            this.setState({
                title: "",
                link: "",
                description: ""
            });
        }
    }

    validate() {
        if (!this.props.category) {
            alert("Invalid category");
            return false;
        }

        if (!this.state.title) {
            alert("Invalid title");
            return false;
        }

        if (!this.state.link) {
            alert("Invalid link");
            return false;
        }

        if (this.state.link.indexOf("://") == -1) {
            if (!confirm("The link doesn't look valid, are you sure you want to continue?")) {
                return false;
            }
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

class EditEntryForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            title: props.item.name,
            link: props.item.link,
            description: props.item.description,
            isShowingWarning: false,
        };

        this._isMounted = false;
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleLinkChange = this.handleLinkChange.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
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
            const el = document.getElementById(this.props.item.txid).querySelector(".change-entry-money-button");
            if (el) {
                const parentNode = el.parentNode;
                parentNode.removeChild(el);
                const newEl = document.createElement('div');
                newEl.className = "change-entry-money-button";
                parentNode.appendChild(newEl);
            }

            this.setState({
                title: "",
                link: "",
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

        if (!this.state.link) {
            alert("Invalid link");
            return false;
        }

        if (this.state.link.indexOf("://") == -1) {
            if (!confirm("The link doesn't look valid, are you sure you want to continue?")) {
                return false;
            }
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

    render() {
        return (
            <div className="column">
                <br />
                <h3>Edit link <span className="highlight">{this.props.item.name}</span></h3>
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
                            Link:
                            <input type="text" value={this.state.link} onChange={this.handleLinkChange} placeholder="bit://" />
                        </label>
                        <label>
                            Description:
                            <textarea onChange={this.handleDescriptionChange} value={this.state.description}></textarea>
                        </label>
                        <input type="submit" className="button-outline" value="Edit link" />
                        <div>
                            {this.state.isShowingWarning && <div className="notice"><span className="warning">You are editing this link, are you sure you want to do this?</span><div className="explain"><p>If you change this link you'll be permanently changing it in this directory for everyone else. Please only do this if you think it's in the best interest of the directory. Your Bitcoin key is forever tied to this transaction, so it will always be traced to you.</p><p><strong>Permanently change this link?</strong></p><div className="change-entry-money-button"></div> </div></div>}
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

        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            "entry.update",
            this.props.item.txid,
        ];

        var edited = false;
        if (this.props.item.name != this.state.title) {
            OP_RETURN.push("name");
            OP_RETURN.push(this.state.title);
            edited = true;
        }

        if (this.props.item.link != this.state.link) {
            OP_RETURN.push("link");
            OP_RETURN.push(this.state.link);
            edited = true;
        }

        if (this.props.item.description != this.state.description) {
            OP_RETURN.push("description");
            OP_RETURN.push(this.state.description);
            edited = true;
        }

        if (!edited) {
            alert("Nothing was edited with the category, please try again");
            return;
        }

        console.log(OP_RETURN);


        this.setState({"isShowingWarning": true}, () => {
            const el = document.getElementById(this.props.item.txid).querySelector(".change-entry-money-button");
            databutton.build({
                data: OP_RETURN,
                button: {
                    $el: el,
                    onPayment: (msg) => {
                        console.log(msg)


                        setTimeout(() => {
                            const name = this.state.title;
                            const desc = this.state.description;
                            const link = this.state.link;

                            this.clearForm()
                            this.setState({ title: name, description: desc, link: link });

                            this.props.onSubmit();
                        }, 5000);

                        setTimeout(() => {
                            this.setState({
                                title: "",
                                link: "",
                                description: ""
                            });

                            this.props.onSuccessHandler("Successfully edited new link, it will appear automatically—please refresh the page if it doesn't.");
                        }, 3000);
                    }
                }
            });
        });


    }
}


