const { EventEmitter } = require('events');
const Wallet = require('ethereumjs-wallet').default;
const ethUtil = require('ethereumjs-util');

const type = 'Simple Key Pair';
const sigUtil = require('eth-sig-util');

class SimpleKeyring extends EventEmitter {
  constructor(opts) {
    super();
    this.type = type;
    this._wallets = [];
    this.deserialize(opts);
  }

  async serialize() {
    return this._wallets.map((w) => w.getPrivateKey().toString('hex'));
  }

  async deserialize(privateKeys = []) {
    this._wallets = privateKeys.map((privateKey) => {
      const stripped = ethUtil.stripHexPrefix(privateKey);
      const buffer = Buffer.from(stripped, 'hex');
      const wallet = Wallet.fromPrivateKey(buffer);
      return wallet;
    });
  }

  async addAccounts(n = 1) {
    const newWallets = [];
    for (let i = 0; i < n; i++) {
      newWallets.push(Wallet.generate());
    }
    this._wallets = this._wallets.concat(newWallets);
    const hexWallets = newWallets.map((w) =>
      ethUtil.bufferToHex(w.getAddress()),
    );
    return hexWallets;
  }

  async getAccounts() {
    return this._wallets.map((w) => ethUtil.bufferToHex(w.getAddress()));
  }

  // tx is an instance of the ethereumjs-transaction class.
  async signTransaction(address, tx, opts = {}) {
    const privKey = this._getPrivateKeyFor(address, opts);
    const signedTx = tx.sign(privKey);
    // Newer versions of Ethereumjs-tx are immutable and return a new tx object
    return signedTx === undefined ? tx : signedTx;
  }

  // For eth_sign, we need to sign arbitrary data:
  async signMessage(address, data, opts = {}) {
    const message = ethUtil.stripHexPrefix(data);
    const privKey = this._getPrivateKeyFor(address, opts);
    const msgSig = ethUtil.ecsign(Buffer.from(message, 'hex'), privKey);
    const rawMsgSig = sigUtil.concatSig(msgSig.v, msgSig.r, msgSig.s);
    return rawMsgSig;
  }

  // For personal_sign, we need to prefix the message:
  async signPersonalMessage(address, msgHex, opts = {}) {
    const privKey = this._getPrivateKeyFor(address, opts);
    const privKeyBuffer = Buffer.from(privKey, 'hex');
    const sig = sigUtil.personalSign(privKeyBuffer, { data: msgHex });
    return sig;
  }

  // For eth_decryptMessage:
  async decryptMessage(withAccount, encryptedData) {
    const wallet = this._getWalletForAccount(withAccount);
    const privKey = ethUtil.stripHexPrefix(wallet.getPrivateKey());
    const sig = sigUtil.decrypt(encryptedData, privKey);
    return sig;
  }

  // personal_signTypedData, signs data along with the schema
  async signTypedData(withAccount, typedData, opts = { version: 'V1' }) {
    switch (opts.version) {
      case 'V1':
        return this._signTypedData_v1(withAccount, typedData, opts);
      case 'V3':
        return this._signTypedData_v3(withAccount, typedData, opts);
      case 'V4':
        return this._signTypedData_v4(withAccount, typedData, opts);
      default:
        return this._signTypedData_v1(withAccount, typedData, opts);
    }
  }

  // personal_signTypedData, signs data along with the schema
  async _signTypedData_v1(withAccount, typedData, opts = {}) {
    const privKey = this._getPrivateKeyFor(withAccount, opts);
    const sig = sigUtil.signTypedDataLegacy(privKey, { data: typedData });
    return sig;
  }

  // personal_signTypedData, signs data along with the schema
  async _signTypedData_v3(withAccount, typedData, opts = {}) {
    const privKey = this._getPrivateKeyFor(withAccount, opts);
    const sig = sigUtil.signTypedData(privKey, { data: typedData });
    return sig;
  }

  // personal_signTypedData, signs data along with the schema
  async _signTypedData_v4(withAccount, typedData, opts = {}) {
    const privKey = this._getPrivateKeyFor(withAccount, opts);
    const sig = sigUtil.signTypedData_v4(privKey, { data: typedData });
    return sig;
  }

  // get public key for nacl
  async getEncryptionPublicKey(withAccount, opts = {}) {
    const privKey = this._getPrivateKeyFor(withAccount, opts);
    const publicKey = sigUtil.getEncryptionPublicKey(privKey);
    return publicKey;
  }

  _getPrivateKeyFor(address, opts = {}) {
    if (!address) {
      throw new Error('Must specify address.');
    }
    const wallet = this._getWalletForAccount(address, opts);
    const privKey = ethUtil.toBuffer(wallet.getPrivateKey());
    return privKey;
  }

  // returns an address specific to an app
  async getAppKeyAddress(address, origin) {
    if (!origin || typeof origin !== 'string') {
      throw new Error(`'origin' must be a non-empty string`);
    }
    const wallet = this._getWalletForAccount(address, {
      withAppKeyOrigin: origin,
    });
    const appKeyAddress = sigUtil.normalize(
      wallet.getAddress().toString('hex'),
    );
    return appKeyAddress;
  }

  // exportAccount should return a hex-encoded private key:
  async exportAccount(address, opts = {}) {
    const wallet = this._getWalletForAccount(address, opts);
    return wallet.getPrivateKey().toString('hex');
  }

  removeAccount(address) {
    if (
      !this._wallets
        .map((w) => ethUtil.bufferToHex(w.getAddress()).toLowerCase())
        .includes(address.toLowerCase())
    ) {
      throw new Error(`Address ${address} not found in this keyring`);
    }
    this._wallets = this._wallets.filter(
      (w) =>
        ethUtil.bufferToHex(w.getAddress()).toLowerCase() !==
        address.toLowerCase(),
    );
  }

  /**
   * @private
   */
  _getWalletForAccount(account, opts = {}) {
    const address = sigUtil.normalize(account);
    let wallet = this._wallets.find(
      (w) => ethUtil.bufferToHex(w.getAddress()) === address,
    );
    if (!wallet) {
      throw new Error('Simple Keyring - Unable to find matching address.');
    }

    if (opts.withAppKeyOrigin) {
      const privKey = wallet.getPrivateKey();
      const appKeyOriginBuffer = Buffer.from(opts.withAppKeyOrigin, 'utf8');
      const appKeyBuffer = Buffer.concat([privKey, appKeyOriginBuffer]);
      const appKeyPrivKey = ethUtil.keccak(appKeyBuffer, 256);
      wallet = Wallet.fromPrivateKey(appKeyPrivKey);
    }

    return wallet;
  }
}

SimpleKeyring.type = type;
module.exports = SimpleKeyring;
