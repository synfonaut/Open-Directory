
class ChangeLog extends React.Component {

    render() {

        const sorted = this.props.items.sort(function(a, b) {
            return (b.height===null)-(a.height===null) || +(b.height>a.height) || -(b.height<a.height);
        });

        return (
            <div id="changelog">
                <h3>Changelog</h3>
                <table>
                    <tbody>
                    {sorted.map(i => {
                        return <ChangeLogItem item={i} key={"changelog-" + i.txid} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} />;
                    })}
                    </tbody>
                </table>
            </div>
        )
    }

    
}

class ChangeLogItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isShowingWarning: false,
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



    handleUndo(e) {
        e.preventDefault();

        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            "undo",
            this.props.item.txid,
        ];

        console.log(OP_RETURN);

        this.setState({"isShowingWarning": true}, () => {
            const el = document.getElementById("changelog-action-" + this.props.item.txid).querySelector(".undo-money-button");
            databutton.build({
                data: OP_RETURN,
                button: {
                    $el: el,
                    onPayment: (msg) => {
                        setTimeout(() => {
                            this.clearForm();
                            this.setState({"isShowingWarning": false});
                            this.props.onSuccessHandler("Successfully reversed transaction, please refresh the page.");
                        }, 3000);
                    }
                }
            });
        });
    }



    render() {
        return (<React.Fragment>
                    <tr>
                        <td className="height">{this.props.item.height ? this.props.item.height : "pending"}</td>
                        <td className="action">{this.props.item.data.s2}</td>
                        <td className="address">{this.props.item.address}</td>
                    </tr>
                    <tr>
                        <td className="data" colSpan="3"><pre><code>{JSON.stringify(this.props.item.data, null, 4)}</code></pre></td>
                    </tr>
                    <tr>
                        <td className="undo" colSpan="3" id={"changelog-action-" + this.props.item.txid}>
                            <a href={"https://whatsonchain.com/tx/" + this.props.item.txid}>{this.props.item.txid}</a>&nbsp;
                            <a onClick={this.handleUndo.bind(this)}>undo</a>
                            {this.state.isShowingWarning && <div className="notice"><span className="warning">You are undoing this change, are you sure you want to do this?</span><div className="explain"><p>If you undo this change, you'll be permanently undoing it in this directory for everyone else. Please only do this if you think it's in the best interest of the directory. Your Bitcoin key is forever tied to this transaction, so it will always be traced to you.</p><p><strong>Permanently undo this change?</strong></p><div className="undo-money-button"></div> </div></div>}
                        </td>
                    </tr>
                </React.Fragment>
        );
    }
}
