class Fork extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            "action": null,
            "fork_address": null,
            "tip_addresses": JSON.parse(JSON.stringify(SETTINGS.tip_addresses)),
            "admin_address": SETTINGS.admin_address,
        };
    }

    validate() {

        if (this.state.tip_addresses.length == 0) {
            if (!confirm("The tipchain doesn't have any addresses, are you sure you want to continue?")) {
                return false;
            }
        }

        if (!bsv.Address.isValid(this.state.admin_address)) {
            alert("The admin address doesn't look valid, please use a Bitcom generated address through the admin console");
            return false;
        }

        if (this.state.admin_address == SETTINGS.admin_address) {
            if (!confirm("The admin address hasn't changed—you won't be able to admin this directory if you don't control this address. Are you sure you want to continue?")) {
                return false;
            }
        }


        return true;
    }

    prepareOPReturnForPingback(txid) {
        if (txid) {
            const url = getBMediaURLForTXID(txid);
            return [OPENDIR_PROTOCOL, "fork.soft", url];
        } else {
            return [OPENDIR_PROTOCOL, "fork.soft"];
        }
    }

    handleSubmit(e) {
        e.preventDefault();

        if (!this.validate()) {
            return;
        }

        console.log("FORKING");
        this.setState({"action": "forking"}, () => {

            const OP_RETURN = [
                B_MEDIA_PROTOCOL,
                "DATA",
                "text/html",
                "utf-8",
                "Open Directory.html",
            ];

            console.log(OP_RETURN);

            const el = document.querySelector(".fork-money-button");

            databutton.build({
                data: OP_RETURN,
                button: {
                    $el: el,
                    onPayment: (msg) => {
                        console.log("HANDLE RESPONSE", msg)
                        this.handleForkResponse(msg);
                    }
                }
            })

        });
    }

    handleForkResponse(txid) {

        if (!txid) {
            alert("There was an error while forking—we didn't receive a valid txid. Please try again or contact the developers");
            return;
        }

        console.log("Successfully forked to txid", txid);

        const url = getBMediaURLForTXID(txid);
        console.log("Forked to", url);
        this.setState({"action": "post-fork", "fork_address": url}, () => {

            const OP_RETURN = [
                OPENDIR_PROTOCOL,
                "fork.soft",
                url,
            ];

            console.log(OP_RETURN);

            const el = document.querySelector(".pingback-money-button");

            databutton.build({
                data: OP_RETURN,
                button: {
                    $el: el,
                    onPayment: (msg) => {
                        console.log("PINGBACK RESPONSE", msg)
                        this.handleSuccessfulTip();
                    }
                }
            })

        });
    }


    removeTipChainTip(address) {
        const tip_addresses = this.state.tip_addresses.filter(tip => { return tip.address !== address });
        this.setState({"tip_addresses": tip_addresses});
    }

    handleChangeForkType() {
        console.log("CHANGE FORK TYPE");
    }

    handleAddAddressToTipchain() {
        this.setState({"action": "adding-tip-address"});
    }

    handleCancelAddingAddressToTipchain() {
        this.setState({"action": null});
    }

    handleAddTipchainAddress(address) {
        if (!address.address) {
            return alert("Please enter a valid tip address");
        }

        if (!bsv.Address.isValid(address.address)) {
            return alert("This Bitcoin address is not valid, please check and try again");
        }

        for (const tip_address of this.state.tip_addresses) {
            if (tip_address.address == address.address) {
                return alert("This address is already listed in the tipchain, try adding a different one");
            }
        }

        if (!address.name) {
            return alert("Please enter a name for this address, it will help people understand where they're sending money");
        }

        const tip_addresses = this.state.tip_addresses;
        tip_addresses.push(address);

        this.setState({
            "action": null,
            "tip_addresses": tip_addresses
        });
    }

    handleChangeAdminAddress(e) {
        this.setState({"admin_address": e.target.value});
    }

    handleCategoryChange(e) {
        var txid = e.target.value;
        if (txid == "") { txid = null }
        this.props.onChangeCategory(txid);
    }

    handleSuccessfulTip() {
        console.log("SUCCESSFUL TIP");
        this.setState({"action": "post-ping"});

        //this.props.onSuccessHandler("Successfully upvoted " + this.props.item.type + ", it will appear automatically—please refresh the page if it doesn't");
    }

    render() {

        const splits = calculateTipchainSplits(this.state.tip_addresses);
        const opendir_tips = JSON.parse(JSON.stringify(this.state.tip_addresses)); // hacky deep copy
        for (var i = 0; i < opendir_tips.length; i++) {
            opendir_tips[i].split = splits[i];
        }

        const select_value = (this.props.category.txid ? this.props.category.txid : "");

        var categories = this.props.items.filter(i => { return i.type == "category" });
        categories.unshift({
            "txid": "",
            "name": "Open Directory"
        });

        return <div className="fork">
                    <a className="close" onClick={this.props.onCloseFork}>X</a>
                    <h2>⑂ Fork</h2>
                    <p>Forking allows you to take control of a directory—to be the admin, change the theme, insert yourself in the tipchain—whatever you want.</p>
                    <form onSubmit={this.handleSubmit.bind(this)}>
                        <fieldset>
                            <div className="row compressed form-item">
                                <div className="column">
                                    <label>
                                        <input type="radio" value="soft" checked="checked" onChange={this.handleChangeForkType.bind(this)} /> Soft Fork <span className="desc">— fork application</span>
                                    </label>
                                    <label>
                                        <input type="radio" value="soft" disabled="disabled" onChange={this.handleChangeForkType.bind(this)} /> Hard Fork <span className="desc">— fork data (coming soon)</span>
                                    </label>
                                </div>
                            </div>
                            <div className="row form-item">
                                <div className="column">
                                    <label>
                                        Category
                                    </label>
                                    <p>Select the category you want to fork. It will be published to the blockchain with a new address where everyone can access it with the changes you've made. You can even fork the entire Open Directory.</p>
                                    <select onChange={this.handleCategoryChange.bind(this)} value={select_value}>
                                        {categories.map(category => {
                                            return <option value={category.txid} key={category.txid}>{category.name}</option>
                                        })}
                                    </select>
                                </div>
                            </div>
                            <div className="row form-item">
                                <div className="column">
                                    <label>
                                        Admin Address
                                    </label>
                                    <p>Set the address that gets special rights, like notifying users about updated versions and detatching directories. <a href="https://github.com/synfonaut/OpenDirectory-Admin-Console" target="_blank">Generate an OpenDirectory Admin Address</a></p>
                                    <input type="text" value={this.state.admin_address} onChange={this.handleChangeAdminAddress.bind(this)} />
                                </div>
                            </div>
                            <div className="row form-item">
                                <div className="column">
                                    <label>
                                        Default Tipchain
                                    </label>
                                    <p>Specify which addresses get included in the tipchain</p>
                                    <table className="tipchain">
                                    <tbody>
                                        {opendir_tips.map((tip, i) => {
                                            return (<tr key={i} id={tip.address}>
                                                    <td className="name"><strong>{tip.name}</strong><br />{tip.address}</td>
                                                    <td className="percentage">{numberFormat(tip.split * 100, 2)}%</td>
                                                    <td className="remove"><a onClick={() => { this.removeTipChainTip(tip.address) }}>x</a></td>
                                                </tr>);
                                        })}
                                    {this.state.action != "adding-tip-address" && <tr>
                                        <td className="add" colSpan="3">
                                            <a onClick={this.handleAddAddressToTipchain.bind(this)}>Add address to tipchain</a>
                                        </td>
                                    </tr>}
                                    {this.state.action == "adding-tip-address" && <tr>
                                        <td className="add" colSpan="3">
                                            <AddTipchainAddressForm onSubmit={this.handleAddTipchainAddress.bind(this)} onCancel={this.handleCancelAddingAddressToTipchain.bind(this)} />
                                        </td>
                                    </tr>}
                                    </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="row form-item">
                                <div className="column">
                                    <label>
                                        Title
                                    </label>
                                    <p>What is the name of your directory?</p>
                                    <input type="text" value={this.props.title} onChange={this.props.onChangeTitle} />
                                </div>
                            </div>
                            <div className="row form-item">
                                <div className="column">
                                    <label>
                                        Theme
                                    </label>
                                    <p>Select a color scheme</p>
                                    <div className="row select-a-theme">
                                        <div className="column"><a className={this.props.theme =="orange-theme" ? "active select-theme orange" : "select-theme orange"} onClick={() => { this.props.onChangeTheme("orange-theme") }}></a></div>
                                        <div className="column"><a className={this.props.theme =="blue-theme" ? "active select-theme blue" : "select-theme blue"} onClick={() => { this.props.onChangeTheme("blue-theme") }}></a></div>
                                        <div className="column"><a className={this.props.theme =="purple-theme" ? "active select-theme purple" : "select-theme purple"} onClick={() => { this.props.onChangeTheme("purple-theme") }}></a></div>
                                        <div className="column"><a className={this.props.theme =="green-theme" ? "active select-theme green" : "select-theme green"} onClick={() => { this.props.onChangeTheme("green-theme") }}></a></div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="column">
                                    <label>
                                        Intro
                                    </label>
                                    <p>Optional text that goes at top of the home page of your directory. Only works when forking entire directory, otherwise use directory description (markdown supported)</p>
                                    <textarea value={this.props.introMarkdown} onChange={this.props.onIntroChange}></textarea>
                                </div>
                            </div>
                            <div className="row">
                                <div className="column form-item">
                                    <label>
                                        About
                                    </label>
                                    <p>Optional text that goes on about page (markdown supported)</p>
                                    <textarea value={this.props.aboutMarkdown} onChange={this.props.onAboutChange}></textarea>
                                </div>
                            </div>

                            {(!this.state.action || this.state.action == "forking") && <div className="row">
                                <div className="column">
                                    <p>⚠️ <strong>You are about to fork.</strong> This will upload a new version of this application to the Bitcoin (SV) blockchain.</p>
                                    <p>Please take a moment to double check the settings above are correct. The most important one is the admin address
                                    <br />
                                    <mark><strong>{this.state.admin_address}</strong></mark></p>
                                    <p>If you lose control of this address, you lose control of the directory.</p>
                                    <input type="submit" className="button" value="Add new link" value="Fork" />

                                </div>
                            </div>}

                            {this.state.action == "forking" && <div className="row">
                                <div className="column">
                                        <br />
                                       <p><strong>Forking {this.props.title}...</strong></p>
                                        <p>Swipe the button below to fork this directory.</p>
                                        <div>
                                            <div className="fork-money-button"></div>
                                        </div>
                                </div>
                                </div>}
                        </fieldset>
                    </form>

                    {this.state.action == "post-fork" && <div className="row">
                        <div className="column">
                               <p><strong>✅ Successfully forked {this.props.title} to </strong></p>
                               <p><strong><a className="url" href={this.state.fork_address}>{this.state.fork_address}</a></strong></p>

                                <br />
                                <p>Would you like to send a parting ping? This will help users find your directory—you can pay to rank higher up the list.</p>
                                <div>
                                    <TipchainItem item={this.props.category} items={this.props.items} onSuccessHandler={this.handleSuccessfulTip.bind(this)} onErrorHandler={this.props.onErrorHandler} custom_OP_RETURN={this.prepareOPReturnForPingback.bind(this)} />
                                </div>
                        </div>
                        </div>}

                    {this.state.action == "post-ping" && <div className="row">
                        <div className="column">
                               <p><strong>✅ Successfully pinged {this.props.title}</strong></p>
                               <p>Please refresh to see your directory listed as a fork.</p>
                               <p><strong>Visit your directory at <a className="url" href={this.state.fork_address}>{this.state.fork_address}</a></strong></p>

                        </div>
                        </div>}
            </div>

    }


}


class AddTipchainAddressForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            "address": "",
            "name": "",
        };
    }

    handleNameChange(e) {
        this.setState({"name": e.target.value});
    }

    handleAddressChange(e) {
        this.setState({"address": e.target.value});
    }

    clearForm() {
        this.setState({
            "address": "",
            "name": "",
        });
    }

    handleSubmit() {
        this.props.onSubmit({
            "address": this.state.address,
            "name": this.state.name,
        });
    }

    render() {
        return (
            <fieldset>
                <div className="row">
                    <div className="column">
                        <label>
                            Name:
                            <input type="text" value={this.state.name} onChange={this.handleNameChange.bind(this)} />
                        </label>
                    </div>
                    <div className="column"></div>
                </div>
                <label>
                    Address:
                    <input type="text" value={this.state.address} onChange={this.handleAddressChange.bind(this)} />
                </label>
                <input type="button" className="button-outline" value="Add tip address" onClick={this.handleSubmit.bind(this)} />
                &nbsp;&nbsp;<a onClick={this.props.onCancel}>cancel</a>
            </fieldset>
        )
    }
}


class ForkLog extends React.Component {

    render() {
        const timestamp = (new Date()).getTime();
        const forks = this.props.forks;
        return (forks && forks.length > 0 && 
                  <div className="row">
                      <div className="column">
                        <div id="forklog">
                            <h3>Forks</h3>
                            <table>
                                <tbody>
                                {forks.map(i => {
                                    console.log(i);
                                    var amount = satoshisToDollars(i.satoshis, BSV_PRICE);
                                    if (!amount) {
                                        amount = "$0.00";
                                    }
                                    const sats = (i.satoshis > 0 ? i.satoshis + " sats" : "");
                                    return (<tr key={i.txid}>
                                        <td className="amount" title={sats}>{amount}</td>
                                        <td className="time">{timeDifference(timestamp, i.time * 1000)}</td>
                                        <td className="url"><a href={i.fork_url}>{i.fork_url}</a></td>
                                    </tr>);
                                })}
                                </tbody>
                            </table>
                            <br />
                            <hr />
                        </div>
                      </div>
                  </div>
        )
    }
}
