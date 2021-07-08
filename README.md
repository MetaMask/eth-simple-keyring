# Simple Keyring [![CircleCI](https://circleci.com/gh/MetaMask/eth-simple-keyring.svg?style=svg)](https://circleci.com/gh/MetaMask/eth-simple-keyring)

A simple JS class wrapped around [ethereumjs-wallet](https://github.com/ethereumjs/ethereumjs-wallet) designed to expose an interface common to many different signing strategies to be used in a `KeyringController`; such as the one used in [MetaMask](https://metamask.io/)

## The Keyring Class Protocol

One of the goals of this class is to allow developers to easily add new signing strategies to MetaMask. We call these signing strategies Keyrings, because they can manage multiple keys.

### Keyring.type

A class property that returns a unique string describing the Keyring.
This is the only class property or method, the remaining methods are instance methods.

### constructor( options )

As a Javascript class, your Keyring object will be used to instantiate new Keyring instances using the new keyword.  For example:

```
const keyring = new YourKeyringClass(options);
```

The constructor currently receives an options object that will be defined by your keyring-building UI, once the user has gone through the steps required for you to fully instantiate a new keyring.  For example, choosing a pattern for a vanity account, or entering a seed phrase.

We haven't defined the protocol for this account-generating UI yet, so for now please ensure your Keyring behaves nicely when not passed any options object.

## Keyring Instance Methods

All below instance methods must return Promises to allow asynchronous resolution.

### serialize()

In this method, you must return any JSON-serializable JavaScript object that you like. It will be encoded to a string, encrypted with the user's password, and stored to disk. This is the same object you will receive in the deserialize() method, so it should capture all the information you need to restore the Keyring's state.

### deserialize( object )

As discussed above, the deserialize() method will be passed the JavaScript object that you returned when the serialize() method was called.

### addAccounts( n = 1 )

The addAccounts(n) method is used to inform your keyring that the user wishes to create a new account. You should perform whatever internal steps are needed so that a call to serialize() will persist the new account, and then return an array of the new account addresses.

The method may be called with or without an argument, specifying the number of accounts to create. You should generally default to 1 per call.

### getAccounts()

When this method is called, you must return an array of hex-string addresses for the accounts that your Keyring is able to sign for.

### signTransaction(address, transaction)

This method will receive a hex-prefixed, all-lowercase address string for the account you should sign the incoming transaction with.

For your convenience, the transaction is an instance of ethereumjs-tx, (https://github.com/ethereumjs/ethereumjs-tx) so signing can be as simple as:

```
transaction.sign(privateKey)
```

You must return a valid signed ethereumjs-tx (https://github.com/ethereumjs/ethereumjs-tx) object when complete, it can be the same transaction you received.

### signMessage(address, data)

The `eth_sign` method will receive the incoming data, already hashed, and must sign that hash, and then return the raw signed hash.

### getEncryptionPublicKey(address)

This provides the public key for encryption function.

### decryptMessage(address, data)

The `eth_decryptMessage` method will receive the incoming data in array format that returns `encrypt` function in `eth-sig-util` and must decrypt message, and then return the raw message.

### exportAccount(address)

Exports the specified account as a private key hex string.

### removeAccount(address)

removes the specified account from the list of accounts.

## Contributing

### Setup

- Install [Node.js](https://nodejs.org) version 12
  - If you are using [nvm](https://github.com/creationix/nvm#installation) (recommended) running `nvm use` will automatically choose the right node version for you.
- Install [Yarn v1](https://yarnpkg.com/en/docs/install)
- Run `yarn setup` to install dependencies and run any requried post-install scripts
  - **Warning:** Do not use the `yarn` / `yarn install` command directly. Use `yarn setup` instead. The normal install command will skip required post-install scripts, leaving your development environment in an invalid state.

### Testing and Linting

Run `yarn test` to run the tests.

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and fix any automatically fixable issues.

### Release & Publishing

The project follows the same release process as the other libraries in the MetaMask organization:

1. Create a release branch
   - For a typical release, this would be based on `main`
   - To update an older maintained major version, base the release branch on the major version branch (e.g. `1.x`)
2. Update the changelog
3. Update version in package.json file (e.g. `yarn version --minor --no-git-tag-version`)
4. Create a pull request targeting the base branch (e.g. `main` or `1.x`)
5. Code review and QA
6. Once approved, the PR is squashed & merged
7. The commit on the base branch is tagged
8. The tag can be published as needed
