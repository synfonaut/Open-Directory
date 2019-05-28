class EntryItem extends Item {

    get_link() {

        if (this.props.item.link.indexOf("http") == 0) {
            return this.props.item.link;
        }

        if (isBottle()) {
            return this.props.item.link;
        } else {
            return "https://bico.media/" + this.props.item.link;
        }
    }

    render() {
        const timestamp = (new Date()).getTime();
        const price = satoshisToDollars(this.props.item.satoshis, BSV_PRICE, true);

        const category = findObjectByTX(this.props.item.category, this.props.items);

        if (!category) {
            console.log("ITEMS", this.props.items);
            console.log(this.props.item);
            throw "NO CATEGORY";
        }

        var actions = (
            <span className="actions">
                <a onClick={this.handleToggleExpand.bind(this)} className="arrow" title={"txid " + this.props.item.txid}>{this.state.isExpanded ? <i className="fas fa-caret-right"></i> : <i className="fas fa-caret-down"></i>}</a>
                {this.state.isExpanded && <a className="action" onClick={this.handleEdit.bind(this)}>edit</a>}
                {this.state.isExpanded && <a className="action" onClick={this.handleDelete.bind(this)}>delete</a>}
            </span>);

        return <li id={this.props.item.txid} className="entry">
                <div className="upvoteContainer">
                    <div className="upvote"><a onClick={this.handleUpvote.bind(this)}><i className="fas fa-chevron-up"></i></a> <span className="number satoshis" title={this.props.item.satoshis + " sats"}>{price}</span><span className="number votes" title={this.props.item.hottness.toFixed(2) + " hot score"}>{pluralize(this.props.item.votes, "vote", "votes")}</span></div>
                    <div className="entry">
                        <div className="entry-wrapper">
                            <h5><a target="_blank" href={this.get_link()}>{this.props.item.name}</a> {!this.props.item.height && <span className="pending">pending</span>}  {this.props.showCategory && <span><span className="from-category-prefix">in</span> <a className="from-category" onClick={() => { this.props.changeURL("/category/" + category.txid) }}>{category.name}</a></span>} <span className="time">{timeDifference(timestamp, this.props.item.time * 1000)}</span> {actions}</h5>

                            <p className="description">{this.props.item.description}</p>
                            <p className="url"><a target="_blank" href={this.get_link()}>{this.props.item.link}</a></p>
                            {this.state.action == "editing" && <div className="inline-edit"><EditEntryForm item={this.props.item} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} onSubmit={this.clearForm.bind(this)} /></div>}
                            {this.state.action == "tipping" && <TipchainItem item={this.props.item} items={this.props.items} onSuccessHandler={this.handleSuccessfulTip.bind(this)} onErrorHandler={this.props.onErrorHandler} />}
                            {this.state.action == "deleting"  && <div className="inline-delete"><DeleteItem item={this.props.item} onSuccessHandler={this.handleSuccessfulDelete.bind(this)} onErrorHandler={this.props.onErrorHandler} /></div>}
                        </div>
                   </div>
                    <div className="clearfix"></div>
                </div>
            </li>
    }
}

class AddEntryForm extends React.Component {

    render() {
        return (
            <div className="column">
                <h3><i className="fas fa-link"></i> Add new link to <span className="highlight">{this.props.category.name}</span></h3>
                <p>Submit a link and earn money when it gets upvoted. Keep it high-quality, remember this action is forever tied to your Bitcoin address.</p>
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
        window.addEventListener('popstate', this.clearForm.bind(this), false);
        this._isMounted = true;
    }

    componentWillUnmount() {
        window.removeEventListener('popstate', this.clearForm.bind(this));
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
        window.addEventListener('popstate', this.clearForm.bind(this), false);
        this._isMounted = true;
    }

    componentWillUnmount() {
        window.removeEventListener('popstate', this.clearForm.bind(this));
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


