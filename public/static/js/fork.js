class Fork extends React.Component {

    handleSubmit(e) {
        e.preventDefault();
    }

    removeTipChainTip() {
        console.log("REMOVE TIPCHAIN TIP");
    }

    handleChangeForkType() {
        console.log("CHANGE FORK TYPE");
    }

    render() {
        return <div className="fork">
                    <a className="close" onClick={this.props.onCloseFork}>X</a>
                    <h2>⑂ Fork</h2>
                    <p>Forking allows you to take control of a directory—to be the admin, change the theme, insert yourself in the tipchain—whatever you want.</p>
                    <form onSubmit={this.handleSubmit}>
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
                                    <select>
                                        <option>Open Directory</option>
                                        <option>Good one</option>
                                        <option>Other oneone</option>
                                    </select>
                                </div>
                            </div>
                            <div className="row form-item">
                                <div className="column">
                                    <label>
                                        Admin Address
                                    </label>
                                    <p>Set the address that gets special rights, like notifying users about updated versions and detatching directories. The easiest way to generate an address you control is with Bitcom and MoneyButton.</p>
                                    <input type="text" defaultValue={OPENDIR_ADMIN_ADDRESS} />
                                </div>
                            </div>
                            <div className="row form-item">
                                <div className="column">
                                    <label>
                                        Default Tipchain
                                    </label>
                                    <p>Set the addresses you want to send payments when transactions happen on the site (you might consider leaving Open Directory :)</p>
                                    <table className="tipchain">
                                    <tbody>
                                    <tr>
                                        <td className="name"><strong>Open Directory</strong><br />{OPENDIR_TIP_ADDRESS}</td>
                                        <td className="percentage">100%</td>
                                        <td className="remove"><a onClick={this.removeTipChainTip.bind(this)}>x</a></td>
                                    </tr>
                                    <tr>
                                        <td className="add" colSpan="3"><a>Add address to tipchain</a></td>
                                    </tr>
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
                                    <input type="text" defaultValue="Open Directory" />
                                </div>
                            </div>
                            <div className="row form-item">
                                <div className="column">
                                    <label>
                                        Theme
                                    </label>
                                    <p>Select one of the 4 default themes</p>
                                    <div className="row">
                                        <div className="column">1</div>
                                        <div className="column">2</div>
                                        <div className="column">3</div>
                                        <div className="column">4</div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="column">
                                    <label>
                                        Intro
                                    </label>
                                    <p>Optional text that goes at top of the home page of your directory (markdown supported)</p>
                                    <textarea value={this.props.introMarkdown} onChange={this.props.onIntroChange}></textarea>
                                </div>
                            </div>
                            <div className="row">
                                <div className="column form-item">
                                    <label>
                                        About
                                    </label>
                                    <p>Optional text that goes on about page (markdown supported)</p>
                                    <textarea></textarea>
                                </div>
                            </div>
                            <div className="row form-item">
                                <div className="column">
                                    <label>
                                        Custom CSS
                                    </label>
                                    <p>Add custom styles to customize the theme even more</p>
                                    <textarea></textarea>
                                </div>
                            </div>
                            <div className="row">
                                <div className="column">
                                    <p>You are about to fork ...</p>
                                    <input type="submit" className="button" value="Add new link" value="Fork" />
                                </div>
                            </div>
                        </fieldset>
                    </form>
            </div>

    }
}

