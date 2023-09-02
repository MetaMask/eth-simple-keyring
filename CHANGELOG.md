# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [5.1.0]
### Uncategorized
- Bump word-wrap from 1.2.3 to 1.2.4 ([#147](https://github.com/MetaMask/eth-simple-keyring/pull/147))
- Bump semver from 6.3.0 to 6.3.1 ([#146](https://github.com/MetaMask/eth-simple-keyring/pull/146))
- Bump @metamask/eth-sig-util from 5.0.3 to 5.1.0 ([#144](https://github.com/MetaMask/eth-simple-keyring/pull/144))
- Bump @metamask/eth-sig-util from 5.0.2 to 5.0.3 ([#143](https://github.com/MetaMask/eth-simple-keyring/pull/143))
- Bump @metamask/utils from 5.0.0 to 5.0.1 ([#141](https://github.com/MetaMask/eth-simple-keyring/pull/141))
- Typescript migration + standardization ([#140](https://github.com/MetaMask/eth-simple-keyring/pull/140))
- Bump http-cache-semantics from 4.1.0 to 4.1.1 ([#137](https://github.com/MetaMask/eth-simple-keyring/pull/137))
- Delete `.yarnrc` file ([#136](https://github.com/MetaMask/eth-simple-keyring/pull/136))
- fix build-lint-test typo ([#134](https://github.com/MetaMask/eth-simple-keyring/pull/134))
- Bump json5 from 1.0.1 to 1.0.2 ([#133](https://github.com/MetaMask/eth-simple-keyring/pull/133))
- Bump qs from 6.5.2 to 6.5.3 ([#128](https://github.com/MetaMask/eth-simple-keyring/pull/128))

## [5.0.0]
### Changed
- **BREAKING:** Makes version-specific `signTypedData` methods private ([#84](https://github.com/MetaMask/eth-simple-keyring/pull/84))
    - Consumers should use the generic `signTypedData` method and pass the version they'd like as a property in the options argument.
- **BREAKING:** Makes the `wallets` property private ([#87](https://github.com/MetaMask/eth-simple-keyring/pull/87))
    - Consumers should not use this property as it is intended for internal use only.
- **BREAKING:** Makes `getPrivateKeyFor` a private method ([#83](https://github.com/MetaMask/eth-simple-keyring/pull/83))
    - Consumers who wish to get the private key for a given account should use the `exportAccount` method.
- **BREAKING:** Set the minimum Node.js version to 12 ([#68](https://github.com/MetaMask/eth-simple-keyring/pull/68))
- Always return rejected Promise upon failure ([#85](https://github.com/MetaMask/eth-simple-keyring/pull/85))

### Removed
- **BREAKING:** Remove redundant `newGethSignMessage` method ([#72](https://github.com/MetaMask/eth-simple-keyring/pull/72))
    - Consumers can use `signPersonalMessage` method as a replacement for `newGethSignMessage`. 

[Unreleased]: https://github.com/MetaMask/eth-simple-keyring/compare/v5.1.0...HEAD
[5.1.0]: https://github.com/MetaMask/eth-simple-keyring/compare/v5.0.0...v5.1.0
[5.0.0]: https://github.com/MetaMask/eth-simple-keyring/releases/tag/v5.0.0
