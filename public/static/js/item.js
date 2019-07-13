export class Item extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            "isExpanded": false,
            "action": null,
        };

        this._isMounted = false;
    }

    componentDidMount() {
        this._isMounted = true;
        window.addEventListener('popstate', this.clearForm.bind(this), false);
    }

    componentWillUnmount() {
        this._isMounted = false;
        window.removeEventListener('popstate', this.clearForm.bind(this));
    }

    // hack for scale during launch
    getLocation() {
        return window.location.hash.replace(/^#\/?|\/$/g, '').split('/');
    }

    handleSuccessfulTip() {
        this.setState({"action": null});
        if (this.props.item.type == "category") {
            const location = this.getLocation();
            if (location.length == 0) {
                this.props.onSuccessHandler("Successfully upvoted " + this.props.item.type + ", due to high demand we've cached the homepage for 1 minute. Please refresh after that time to see your upvote. We're working hard on a fix!");
                return;
            }
        }

        this.props.onSuccessHandler("Successfully upvoted " + this.props.item.type + ", it will appear automatically—please refresh the page if it doesn't");
    }

    handleSuccessfulDelete() {
        this.setState({"action": null});
        this.props.onSuccessHandler("Successfully deleted " + this.props.item.type + ", it will appear automatically—please refresh the page if it doesn't");
    }

    clearForm() {
        if (this._isMounted) {
            this.setState({
                "isExpanded": false,
                "action": null,
            });
        }
    }

    handleUpvote(e) {
        this.setState({"action": "tipping"});
    }

    handleToggleExpand(e) {
        this.setState({
            "isExpanded": !this.state.isExpanded,
            "action": null,
        });
    }

    handleEdit(e) {
        this.setState({"action": "editing"});
    }

    handleDelete(e) {
        this.setState({"action": "deleting"});
    }
}
