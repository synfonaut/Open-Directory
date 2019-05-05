class Item extends React.Component {

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
        window.addEventListener('hashchange', this.clearForm.bind(this), false);
    }

    componentWillUnmount() {
        this._isMounted = false;
        window.removeEventListener('hashchange', this.clearForm.bind(this));
    }

    handleSuccessfulTip() {
        this.setState({"action": null});
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
