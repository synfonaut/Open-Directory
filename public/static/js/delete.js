class DeleteItem extends React.Component {

    constructor(props) {
        super(props);
        this._isMounted = false;
    }

    componentDidMount() {
        this._isMounted = true;
        this.handleDelete();
        window.addEventListener('hashchange', this.clearMoneyButton.bind(this), false);
    }

    componentWillUnmount() {
        this._isMounted = false;
        window.removeEventListener('hashchange', this.clearMoneyButton.bind(this));
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

    handleDelete() {
        const action = this.props.item.type + ".delete";
        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            action,
            this.props.item.txid,
        ];

        console.log(OP_RETURN);

        const button = document.getElementById(this.props.item.txid).querySelector(".delete-money-button")
        databutton.build({
            data: OP_RETURN,
            button: {
                $el: button,
                onPayment: (msg) => {
                    console.log(msg);
                    setTimeout(() => {
                        this.clearMoneyButton();
                        this.props.onSuccessHandler();
                    }, 5000);
                }
            }
        });
    }

    render() {
        const msg = "If you remove this " + this.props.item.type + " you'll be permanently removing it from this directory for others to view. Please only do this if you think it's in the best interest of the directory. Your Bitcoin key is forever tied to this transaction, so it will always be traced to you.";
        return <div className="notice"><span className="warning">You are about to delete this {this.props.item.type}, are you sure you want to do this?</span><div className="explain"><p>{msg}</p><p><strong>Permanently delete this {this.props.item.type} from this directory</strong></p><div className="delete-money-button"></div> </div></div>;

    }
}
