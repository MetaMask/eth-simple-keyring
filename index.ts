import { EventEmitter } from 'events';
import {
  isValidPrivate,
  stripHexPrefix,
  privateToPublic,
  bufferToHex,
  publicToAddress,
  ecsign,
  arrToBufArr,
  toBuffer,
} from '@ethereumjs/util';
import randomBytes from 'randombytes';
import { keccak256 } from 'ethereum-cryptography/keccak';

const type = 'Simple Key Pair';
import {
  concatSig,
  decrypt,
  getEncryptionPublicKey,
  normalize,
  personalSign,
  signTypedData,
  SignTypedDataVersion,
} from '@metamask/eth-sig-util';

function generateKey(): Buffer {
  const privateKey = randomBytes(32);
  // I don't think this is possible, but this validation was here previously,
  // so it has been preserved just in case.
  // istanbul ignore next
  if (!isValidPrivate(privateKey)) {
    throw new Error(
      'Private key does not satisfy the curve requirements (ie. it is invalid)',
    );
  }
  return privateKey;
}

export default class SimpleKeyring extends EventEmitter {
  private _wallets: { privateKey: Buffer; publicKey: Buffer }[];
  type: string;

  constructor(opts: [] | undefined) {
    super();
    this.type = type;
    this._wallets = [];
    this.deserialize(opts);
  }

  async serialize() {
    return this._wallets.map((a) => a.privateKey.toString('hex'));
  }

  async deserialize(privateKeys = []) {
    this._wallets = privateKeys.map((hexPrivateKey) => {
      const strippedHexPrivateKey = stripHexPrefix(hexPrivateKey);
      const privateKey = Buffer.from(strippedHexPrivateKey, 'hex');
      const publicKey = privateToPublic(privateKey);
      return { privateKey, publicKey };
    });
  }

  async addAccounts(n = 1) {
    const newWallets = [];
    for (let i = 0; i < n; i++) {
      const privateKey = generateKey();
      const publicKey = privateToPublic(privateKey);
      newWallets.push({ privateKey, publicKey });
    }
    this._wallets = this._wallets.concat(newWallets);
    const hexWallets = newWallets.map(({ publicKey }) =>
      bufferToHex(publicToAddress(publicKey)),
    );
    return hexWallets;
  }

  async getAccounts() {
    return this._wallets.map(({ publicKey }) =>
      bufferToHex(publicToAddress(publicKey)),
    );
  }

  // tx is an instance of the ethereumjs-transaction class.
  async signTransaction(
    address: any,
    tx: { sign: (arg0: any) => any },
    opts = { withAppKeyOrigin: '' },
  ) {
    const privKey = this._getPrivateKeyFor(address, opts);
    const signedTx = tx.sign(privKey);
    // Newer versions of Ethereumjs-tx are immutable and return a new tx object
    return signedTx === undefined ? tx : signedTx;
  }

  // For eth_sign, we need to sign arbitrary data:
  async signMessage(
    address: any,
    data: string,
    opts = { withAppKeyOrigin: '' },
  ) {
    const message = stripHexPrefix(data);
    const privKey = this._getPrivateKeyFor(address, opts);
    const msgSig = ecsign(Buffer.from(message, 'hex'), privKey);
    const rawMsgSig = concatSig(toBuffer(msgSig.v), msgSig.r, msgSig.s);
    return rawMsgSig;
  }

  // For personal_sign, we need to prefix the message:
  async signPersonalMessage(
    address: any,
    msgHex: any,
    opts = { withAppKeyOrigin: '' },
  ) {
    const privKey = this._getPrivateKeyFor(address, opts);
    // const privateKey = Buffer.from(privKey, 'hex');
    const sig = personalSign({ privateKey: privKey, data: msgHex });
    return sig;
  }

  // For eth_decryptMessage:
  async decryptMessage(withAccount: any, encryptedData: any) {
    const wallet = this._getWalletForAccount(withAccount, {
      withAppKeyOrigin: '',
    });
    const privateKey = wallet.privateKey.toString();
    const sig = decrypt({ privateKey, encryptedData });
    return sig;
  }

  // personal_signTypedData, signs data along with the schema
  async signTypedData(
    withAccount: any,
    typedData: any,
    opts = { version: SignTypedDataVersion.V1 },
  ) {
    // Treat invalid versions as "V1"
    const version = Object.keys(SignTypedDataVersion).includes(opts.version)
      ? opts.version
      : SignTypedDataVersion.V1;

    const privateKey = this._getPrivateKeyFor(withAccount);
    return signTypedData({ privateKey, data: typedData, version });
  }

  // get public key for nacl
  async getEncryptionPublicKey(
    withAccount: any,
    opts = { withAppKeyOrigin: '' },
  ) {
    const privKey = this._getPrivateKeyFor(withAccount, opts);
    const publicKey = getEncryptionPublicKey(privKey.toString());
    return publicKey;
  }

  _getPrivateKeyFor(address: any, opts = { withAppKeyOrigin: '' }) {
    if (!address) {
      throw new Error('Must specify address.');
    }
    const wallet = this._getWalletForAccount(address, opts);
    return wallet.privateKey;
  }

  // returns an address specific to an app
  async getAppKeyAddress(address: any, origin: any) {
    if (!origin || typeof origin !== 'string') {
      throw new Error(`'origin' must be a non-empty string`);
    }
    const wallet = this._getWalletForAccount(address, {
      withAppKeyOrigin: origin,
    });
    const appKeyAddress = normalize(
      publicToAddress(wallet.publicKey).toString('hex'),
    );
    return appKeyAddress;
  }

  // exportAccount should return a hex-encoded private key:
  async exportAccount(address: any, opts = { withAppKeyOrigin: '' }) {
    const wallet = this._getWalletForAccount(address, opts);
    return wallet.privateKey.toString('hex');
  }

  removeAccount(address: string) {
    if (
      !this._wallets
        .map(({ publicKey }) =>
          bufferToHex(publicToAddress(publicKey)).toLowerCase(),
        )
        .includes(address.toLowerCase())
    ) {
      throw new Error(`Address ${address} not found in this keyring`);
    }

    this._wallets = this._wallets.filter(
      ({ publicKey }) =>
        bufferToHex(publicToAddress(publicKey)).toLowerCase() !==
        address.toLowerCase(),
    );
  }

  /**
   * @private
   */
  _getWalletForAccount(
    account: string | number,
    opts: { withAppKeyOrigin: string },
  ) {
    const address = normalize(account);
    let wallet = this._wallets.find(
      ({ publicKey }) => bufferToHex(publicToAddress(publicKey)) === address,
    );
    if (!wallet) {
      throw new Error('Simple Keyring - Unable to find matching address.');
    }

    if (opts.withAppKeyOrigin) {
      const { privateKey } = wallet;
      const appKeyOriginBuffer = Buffer.from(opts.withAppKeyOrigin, 'utf8');
      const appKeyBuffer = Buffer.concat([privateKey, appKeyOriginBuffer]);
      const appKeyPrivateKey = arrToBufArr(keccak256(appKeyBuffer));
      const appKeyPublicKey = privateToPublic(appKeyPrivateKey);
      wallet = { privateKey: appKeyPrivateKey, publicKey: appKeyPublicKey };
    }

    return wallet;
  }
}
