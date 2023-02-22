import SimpleKeyring from '.';

const keyring = new SimpleKeyring(undefined);

let accounts: any[] = [];

keyring
  .addAccounts(37)
  .then((newAddresses) => {
    accounts = newAddresses.map((address) => {
      return { address };
    });
    return keyring.serialize();
  })
  .then((privateKeys) => {
    privateKeys.forEach((privateKey: any, index: number) => {
      accounts[index].privateKey = privateKey;
    });
  })
  .then(() => {
    const jsonAccounts = JSON.stringify(accounts, null, 2);
    console.log(jsonAccounts);
  });
