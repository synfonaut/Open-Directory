
class ChangeLog extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            "isExpanded": false,
            "isShowAll": false,
        };
    }


    handleToggleExpand(e) {
        this.setState({
            "isExpanded": !this.state.isExpanded,
        });
    }

    handleToggleShowAll(e) {
        this.setState({
            "isShowAll": !this.state.isShowAll
        });
    }

    render() {

        var idx = 0;
        const max = 5;

        // For now only show open directory protocol changes in changelog—in future may want to
        // pull in related bitcoin media
        const changelog = (this.props.changelog ? this.props.changelog.slice(0).reverse() : []).filter(i => {
            return i.data.s1 == OPENDIR_PROTOCOL || i.data.s1 == SETTINGS.admin_address;
        });

        return (changelog && changelog.length > 0 && 
                  <div className="row">
                      <div className="column">
                        <div id="changelog">
                            <h3>Changelog</h3>
                            <table>
                                <tbody>
                                {changelog.map(i => {
                                    if ((idx++ <= max) || this.state.isShowAll) {
                                        return <ChangeLogItem item={i} txpool={this.props.txpool} key={"changelog-" + i.txid} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} isExpanded={this.state.isExpanded} />;
                                    }
                                })}
                                </tbody>
                                {(!this.state.isShowingWarning && changelog.length > max) && <tbody><tr>
                                    <td colSpan="6" className="expand">
                                        <a onClick={this.handleToggleShowAll.bind(this)}>{this.state.isShowAll ? "Hide" : "Show"} all {changelog.length} changes from changelog</a>
                                        &nbsp;<a onClick={this.handleToggleExpand.bind(this)}>expanded</a>
                                    </td>
                                 </tr></tbody>}
                            </table>
                        </div>
                      </div>
                  </div>
        )
    }

    
}

class ChangeLogItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isShowingWarning: false,
            isExpanded: false,
            undo_reason: ""
        };
    }

    clearForm() {
        const el = document.getElementById("changelog-action-" + this.props.item.txid).querySelector(".undo-money-button");
        if (el) {
            const parentNode = el.parentNode;
            parentNode.removeChild(el);
            const newEl = document.createElement('div');
            newEl.className = "undo-money-button";
            parentNode.appendChild(newEl);
        }
    }

    handleClickUndo(e) {
        e.preventDefault();
        this.setState({"isShowingWarning": true});
    }



    handleUndoSubmit(e) {
        e.preventDefault();

        const object = findObjectByTX(this.props.item.txid, this.props.txpool);
        if (!object) {
            alert("Error while finding undo object, please try again");
            return;
        }

        const action_id = findRootActionID(object, this.props.txpool);
        if (!action_id) {
            alert("Error while finding undo object action_id, please try again");
        }

        console.log("LOCKED ON TO ", action_id);

        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            "undo",
            action_id,
            this.props.item.txid,
        ];

        if (this.state.undo_reason) {
            OP_RETURN.push(this.state.undo_reason);
        } else {
            if (!confirm("Are you sure you want to continue? You didn't specify an undo reason.\n\nProviding a reason helps everyone understand your thinking behind this change, and can prevent it from being reverted in the future.")) {
                return;
            }
        }

        console.log(OP_RETURN);

        const el = document.getElementById("changelog-action-" + this.props.item.txid).querySelector(".undo-money-button");
        databutton.build({
            data: OP_RETURN,
            button: {
                $el: el,
                onPayment: (msg) => {
                    setTimeout(() => {
                        this.clearForm();
                        this.setState({"isShowingWarning": false, "isExpanded": false, "undo_reason": ""});
                        this.props.onSuccessHandler("Successfully reversed transaction, it will appear automatically—please refresh the page if it doesn't.");
                    }, 3000);
                }
            }
        });
    }

    handleToggleExpand(e) {
        this.setState({
            "isExpanded": !this.state.isExpanded,
            "isShowingWarning": false,
        });
    }

    handleChangeUndoReason(e) {  
        this.setState({"undo_reason": e.target.value});
    }

    render() {
        const timestamp = (new Date()).getTime();

        var amount = satoshisToDollars(this.props.item.satoshis, BSV_PRICE);
        const sats = (this.props.item.satoshis > 0 ? this.props.item.satoshis + " sats" : "");

        var action;
        if (this.props.item.type == "admin") {
            action = this.props.item.type + "." + this.props.item.action;
        } else {
            action = this.props.item.data.s2;
        }

        return (<React.Fragment>
                    <tr>
                        <td className="height">
                            <a onClick={this.handleToggleExpand.bind(this)} className="arrow">{(this.props.isExpanded || this.state.isExpanded) ? "▼" : "▶"}</a>
                            {this.props.item.height ? <span className="block">#{this.props.item.height}</span> : <span className="pending">pending</span>}
                        </td>
                        <td className="action">{action}</td>
                        <td className="time">{timeDifference(timestamp, this.props.item.time * 1000)}</td>
                        <td className="amount" title={sats}>{amount}</td>
                        <td className="description">{this.props.item.description}</td>
                        <td className="address">{this.props.item.address}</td>
                    </tr>
                    {(this.props.isExpanded || this.state.isExpanded) && <tr>
                        <td className="data" colSpan="6"><pre><code>{JSON.stringify(this.props.item.data, null, 4)}</code></pre></td>
                        </tr>}
                    {(this.props.isExpanded || this.state.isExpanded) && <tr>
                            <td className="undo" colSpan="6" id={"changelog-action-" + this.props.item.txid}>
                            <a href={"https://whatsonchain.com/tx/" + this.props.item.txid}>{this.props.item.txid}</a>&nbsp;
                        {false && <a onClick={this.handleClickUndo.bind(this)}>undo</a>}
                            {this.state.isShowingWarning && <div className="notice"><span className="warning">You are undoing this change, are you sure you want to do this?</span><div className="explain"><p>If you undo this change, you'll be permanently undoing it in this directory for everyone else. Please only do this if you think it's in the best interest of the directory. Your Bitcoin key is forever tied to this transaction, so it will always be traced to you.</p><p><strong>Why are you undoing this change?</strong></p>

                                <form onSubmit={this.handleUndoSubmit.bind(this)}>
                                <input type="text" placeholder="reason for undo" value={this.state.undo_reason} onChange={this.handleChangeUndoReason.bind(this)} /> <input type="submit" className="button button-outline" value="undo" />
                                </form>
    <div className="undo-money-button"></div> </div></div>}
                            </td>
                            </tr>}
                </React.Fragment>
        );
    }
}
