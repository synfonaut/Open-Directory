import databutton from "./databutton-0.0.4"
import { OPENDIR_PROTOCOL } from "./process"

export class DeleteItem extends React.Component {

    constructor(props) {
        super(props);
        this._isMounted = false;
        this.state = {
            delete_reason: ""
        };
    }

    componentDidMount() {
        this._isMounted = true;
        window.addEventListener('popstate', this.clearMoneyButton.bind(this), false);
    }

    componentWillUnmount() {
        this._isMounted = false;
        window.removeEventListener('popstate', this.clearMoneyButton.bind(this));
    }

    clearMoneyButton() {
        if (this._isMounted) {

            const container = document.getElementById(this.props.item.txid);
            if (container) {
                const deleteButton = container.querySelector(".delete-money-button");
                if (deleteButton) {
                    const parentNode = deleteButton.parentNode;
                    parentNode.removeChild(deleteButton);
                    const newEl = document.createElement('div');
                    newEl.className = "delete-money-button";
                    parentNode.appendChild(newEl);
                }
            }
        }
    }

    handleDelete(e) {

        e.preventDefault();

        const action = this.props.item.type + ".delete";
        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            action,
            this.props.item.txid,
        ];

        if (this.state.delete_reason) {
            OP_RETURN.push(this.state.delete_reason);
        } else {
            if (!confirm("Are you sure you want to continue? You didn't specify a reason for deletion.\n\nProviding a reason helps everyone understand your thinking behind this change, and can prevent it from being reverted in the future.")) {
                return;
            }
        }

        console.log(OP_RETURN);

        const button = document.getElementById(this.props.item.txid).querySelector(".delete-money-button")
        databutton.build({
            data: OP_RETURN,
            button: {
                $el: button,
                onPayment: (msg) => {
                    console.log(msg);
                    setTimeout(() => {
                        this.setState({"delete_reason": ""});
                        this.clearMoneyButton();
                        this.props.onSuccessHandler();
                    }, 5000);
                }
            }
        });
    }

    handleChangeDeleteReason(e) {  
        this.setState({"delete_reason": e.target.value});
    }

    render() {
        const msg = "If you remove this " + this.props.item.type + " you'll be permanently removing it from this directory for others to view. Please only do this if you think it's in the best interest of the directory. Your Bitcoin key is forever tied to this transaction, so it will always be traced to you.";
        return <div className="notice">
            <span className="warning">You are about to delete this {this.props.item.type}, are you sure you want to do this?</span><div className="explain"><p>{msg}</p>
            <p><strong>What are you deleting this {this.props.item.type}?</strong></p>

            <form onSubmit={this.handleDelete.bind(this)}>
            <input type="text" placeholder="reason for delete" value={this.state.delete_reason} onChange={this.handleChangeDeleteReason.bind(this)} /> <input type="submit" className="button button-outline" value="delete" />
            </form>
            <div className="delete-money-button"></div>
            </div>
            </div>;

    }
}
