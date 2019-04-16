'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var PropTypes = _interopDefault(require('prop-types'));
var React = require('react');
var React__default = _interopDefault(React);

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

class Config {
  constructor(values) {
    this.keyDefined = key => key in values;

    this.getValue = key => values[key];
  }

  get(key) {
    if (this.keyDefined(key)) {
      return this.getValue(key);
    } else {
      throw new Error(`Unknown configuration: ${key}`);
    }
  }

}

class MoneyButtonConfigBuilder {
  constructor() {
    this.variables = {};
  }

  build() {
    return new Config(this.variables);
  }

  addValue(key, value) {
    if (value === undefined) {
      throw new Error(`Failed to add "${key}" property. The value cannot be undefined`);
    }

    if (key in this.variables) {
      throw new Error(`"${key}" already has a value defined.`);
    }

    this.variables[key] = value;
    return this;
  }

  addValueWithDefault(key, value, defaultValue) {
    if (defaultValue === undefined) {
      throw new Error(`Failed to add "${key}" property. Default value cannot be undefined`);
    }

    return this.addValue(key, value === undefined ? defaultValue : value);
  }

}

const config = new MoneyButtonConfigBuilder().addValueWithDefault('MONEY_BUTTON_IFRAME_LOADER_URI', process.env.MONEY_BUTTON_IFRAME_LOADER_URI, 'https://www.moneybutton.com/moneybutton.js').build();

const MONEY_BUTTON_JS_URL = config.get('MONEY_BUTTON_IFRAME_LOADER_URI');

class AsyncIframeLoader {
  constructor() {
    this.promise = new Promise(resolve => {
      this._resolve = resolve;
    });
  }

  fetchScript() {
    const aScript = document.createElement('script');
    aScript.type = 'text/javascript';
    aScript.src = MONEY_BUTTON_JS_URL;
    document.head.appendChild(aScript);
    MoneyButton.loadingLibrary = true;

    aScript.onload = () => {
      this._resolve(window.moneyButton);
    };
  }

  async iframeLoader() {
    return this.promise;
  }

}

class MoneyButton extends React.Component {
  constructor(_props) {
    super(_props);

    _defineProperty(this, "iframeLoader", async () => {
      return MoneyButton.asyncIframeLoader.iframeLoader();
    });

    _defineProperty(this, "refreshMoneyButton", async props => {
      const iframeLoader = await this.iframeLoader();
      iframeLoader.render(this.ref, this.createParams(props));
    });

    _defineProperty(this, "createParams", props => {
      return {
        to: props.to,
        amount: props.amount,
        currency: props.currency,
        label: props.label,
        successMessage: props.successMessage,
        opReturn: props.opReturn,
        outputs: props.outputs,
        clientIdentifier: props.clientIdentifier,
        buttonId: props.buttonId,
        buttonData: props.buttonData,
        type: props.type,
        onPayment: props.onPayment,
        onError: props.onError,
        editable: props.editable,
        disabled: props.disabled,
        devMode: props.devMode
      };
    });

    _defineProperty(this, "setRef", r => {
      this.ref = r;
    });

    this.ref = null;
  }

  async componentDidMount() {
    MoneyButton.asyncIframeLoader.fetchScript();
    await this.refreshMoneyButton(this.props);
  }

  shouldComponentUpdate(nextProps) {
    this.refreshMoneyButton(nextProps);
    return false;
  }

  render() {
    return React__default.createElement("div", {
      ref: this.setRef
    });
  }

}

_defineProperty(MoneyButton, "propTypes", {
  to: PropTypes.string,
  amount: PropTypes.string,
  editable: PropTypes.bool,
  currency: PropTypes.string,
  label: PropTypes.string,
  hideAmount: PropTypes.bool,
  opReturn: PropTypes.string,
  outputs: PropTypes.array,
  clientIdentifier: PropTypes.string,
  buttonId: PropTypes.string,
  buttonData: PropTypes.string,
  type: PropTypes.string,
  onPayment: PropTypes.func,
  onError: PropTypes.func,
  devMode: PropTypes.bool
});

_defineProperty(MoneyButton, "asyncIframeLoader", new AsyncIframeLoader());

module.exports = MoneyButton;
//# sourceMappingURL=index.js.map
