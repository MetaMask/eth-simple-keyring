# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [6.0.2]
### Uncategorized
- Bump `@metamask/utils` from `^8.1.0` to `^9.0.0` ([#177](https://github.com/MetaMask/eth-simple-keyring/pull/177))
- Bump tar from 6.1.13 to 6.2.1 ([#173](https://github.com/MetaMask/eth-simple-keyring/pull/173))
- chore(devdeps): @lavamoat/allow-scripts@^3.0.0->^3.0.4 ([#175](https://github.com/MetaMask/eth-simple-keyring/pull/175))
- ci: update security code scanner file ([#172](https://github.com/MetaMask/eth-simple-keyring/pull/172))
- chore: update CODEOWNERS ([#171](https://github.com/MetaMask/eth-simple-keyring/pull/171))
- Enabling security code scanner ([#170](https://github.com/MetaMask/eth-simple-keyring/pull/170))
- Bump ip from 2.0.0 to 2.0.1 ([#169](https://github.com/MetaMask/eth-simple-keyring/pull/169))

## [6.0.1]
### Fixed
- Treat `undefined` and `null` as empty array in deserialize function ([#163](https://github.com/MetaMask/eth-simple-keyring/pull/163))

## [6.0.0]
### Changed
- **BREAKING**: Increase minimum Node.js version to 16 ([#152](https://github.com/MetaMask/eth-simple-keyring/pull/152))
- **BREAKING**: Bump @metamask/eth-sig-util from ^6.0.1 to ^7.0.0 ([#156](https://github.com/MetaMask/eth-simple-keyring/pull/156))
- Bump @metamask/utils from ^5.0.0 to ^8.1.0 ([#153](https://github.com/MetaMask/eth-simple-keyring/pull/153))
- Bump ethereum-cryptography from ^1.2.0 to ^2.1.2 ([#153](https://github.com/MetaMask/eth-simple-keyring/pull/153))

## [5.1.1]
### Fixed
- Treat `undefined` and `null` as empty array in deserialize function ([#166](https://github.com/MetaMask/eth-simple-keyring/pull/166))

## [5.1.0]
### Changed
- Export TypeScript interfaces ([#140](https://github.com/MetaMask/eth-simple-keyring/pull/140))
- Update all dependencies ([#140](https://github.com/MetaMask/eth-simple-keyring/pull/140)) ([#149](https://github.com/MetaMask/eth-simple-keyring/pull/149))

### Fixed
- Add `validateMessage` option to `signMessage` to configure if runtime-validation should be done that input string is hex (default: `true`) ([#148](https://github.com/MetaMask/eth-simple-keyring/pull/148))

## [5.0.0]
### Changed
- **BREAKING:** Makes version-specific `signTypedData` methods private ([#84](https://github.com/MetaMask/eth-simple-keyring/pull/84))
    - Consumers should use the generic `signTypedData` method and pass the version they'd like as a property in the options argument.
- **BREAKING:** Makes the `wallets` property private ([#87](https://github.com/MetaMask/eth-simple-keyring/pull/87))
    - Consumers should not use this property as it is intended for internal use only.
- **BREAKING:** Makes `getPrivateKeyFor` a private method ([#83](https://github.com/MetaMask/eth-simple-keyring/pull/83))
    - Consumers who wish to get the private key for a given account should use the `exportAccount` method.
- **BREAKING:** Set the minimum Node.js version to 14 ([#68](https://github.com/MetaMask/eth-simple-keyring/pull/68)) ([#109](https://github.com/MetaMask/eth-simple-keyring/pull/109))
- Always return rejected Promise upon failure ([#85](https://github.com/MetaMask/eth-simple-keyring/pull/85))

### Removed
- **BREAKING:** Remove redundant `newGethSignMessage` method ([#72](https://github.com/MetaMask/eth-simple-keyring/pull/72))
    - Consumers can use `signPersonalMessage` method as a replacement for `newGethSignMessage`.

[Unreleased]: https://github.com/MetaMask/eth-simple-keyring/compare/v6.0.2...HEAD
[6.0.2]: https://github.com/MetaMask/eth-simple-keyring/compare/v6.0.1...v6.0.2
[6.0.1]: https://github.com/MetaMask/eth-simple-keyring/compare/v6.0.0...v6.0.1
[6.0.0]: https://github.com/MetaMask/eth-simple-keyring/compare/v5.1.1...v6.0.0
[5.1.1]: https://github.com/MetaMask/eth-simple-keyring/compare/v5.1.0...v5.1.1
[5.1.0]: https://github.com/MetaMask/eth-simple-keyring/compare/v5.0.0...v5.1.0
[5.0.0]: https://github.com/MetaMask/eth-simple-keyring/releases/tag/v5.0.0
