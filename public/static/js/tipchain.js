class TipchainItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            "showingTipchain": false,
            "tip": SETTINGS["tip_amount"],
        };

        this.handleTipSubmit = this.handleTipSubmit.bind(this);
        this.handleClickTip = this.handleClickTip.bind(this);
    }

    componentDidMount() {
        window.addEventListener('hashchange', this.clearMoneyButton.bind(this), false);
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange', this.clearMoneyButton.bind(this));
    }

    clearMoneyButton() {
        const container = document.getElementById(this.props.item.txid);
        if (container) {
            const voteButton = container.querySelector(".tip-money-button");
            if (voteButton) {
                const parentNode = voteButton.parentNode;
                parentNode.removeChild(voteButton);
                const newEl = document.createElement('div');
                newEl.className = "tip-money-button";
                parentNode.appendChild(newEl);
            }
        }
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

        const button = document.getElementById(this.props.item.txid).querySelector(".tip-money-button");
        databutton.build({
            data: OP_RETURN,
            button: {
                $el: button,
                label: "upvote",
                $pay: { to: payments, },
                onPayment: (msg) => {
                    console.log(msg);
                    const local_settings = get_local_settings();
                    local_settings["tip_amount"] = amount;
                    use_local_settings(local_settings);
                    save_local_settings(local_settings);

                    setTimeout(() => {
                        this.clearMoneyButton();
                        this.props.onSuccessHandler();
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
        this.setState({"showingTipchain": !this.state.showingTipchain});
    }

    render() {
        const tipchain = expandTipchainInformation(this.props.item.tipchain, this.state.tip, this.props.items);

        return <div className="tipping">
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
                {this.state.showingTipchain && <ul>
                    {tipchain.map((t, i) => {
                        const split = (Number(t.split) * 100).toFixed(2);
                        const key = i + t.type + t.address + t.split;
                        var amount = Number(t.amount).toFixed(2);
                        var symbol = "$";
                        if (t.amount > 0 && amount == "0.00") {
                            amount = Number(t.amount).toFixed(3);
                        }
                        if (t.type == "opendirectory") {
                            return <li key={key}>{symbol}{amount} to <strong>{t.name}</strong> {t.address}</li>;
                        } else if (t.type == "media") {
                            return <li key={key}>{symbol}{amount} to original content owner <strong>{t.address}</strong></li>;
                        } else if (t.type == "category") {
                            return <li key={key}>{symbol}{amount} to <strong>{t.name}</strong> category creator {t.address}</li>;
                        } else if (t.type == "entry") {
                            return <li key={key}>{symbol}{amount} to <strong>{t.name}</strong> entry submitter {t.address}</li>;
                        } else {
                            return <li key={key}>{symbol}{amount} <strong>{t.name}</strong> {t.address}</li>;
                        }
                    })}
                </ul>
               }
               <div className="money-button-wrapper">
                   <div className="tip-money-button"></div>
               </div>
            </div>
        </div>
    }
}


