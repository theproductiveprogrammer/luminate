# Luminate

Luminate is a free, open-source, embeddable, command-line wallet for
people who want to manage crypto on the [Stellar](https://www.stellar.org/) network.

![luminate](icon_400x400.png)

Stellar has [an excellent API](https://www.stellar.org/developers/reference/)
and [several excellent wallets](https://www.stellar.org/lumens/wallets/).
The goal of Luminate is to add to this ecosystem by providing an
embeddable wallet that any developer can use to manage Stellar wallets
in his own application and to provide a lightweight, powerful,
scriptable command-line wallet for users who who do not want to install
a full desktop application or trust a web service.

## QuickStart (Command-line Wallet)

Luminate is a [node](https://nodejs.org/) application. Make sure you
have node (and the [yarn](https://yarnpkg.com/) package manager)
installed then do the following:

1. Download [Luminate](https://github.com/theproductiveprogrammer/luminate) from Github
2. Run `yarn install`
3. Run `./luminate`

## QuickStart (Embedded Version)

Add [Luminate](https://github.com/theproductiveprogrammer/luminate) as a [Nodejs](https://nodejs.org)
dependency. For example, if you are using [yarn](https://yarnpkg.com/)

1. `yarn add theproductiveprogrammer/luminate`
2. Require `luminate` in your program:

        const luminate = require('luminate')

3. Use the wallet functionality:

        luminate.wallet.create(password, walletpath, accountname, cb)
        luminate.wallet.list(walletpath, cb)
        luminate.wallet.find(walletpath, accountnameOrpublickey, cb)
        luminate.wallet.load(password, walletpath, accountname, cb)
        luminate.wallet.importSecret(password, walletpath, accountname, secret, cb)

You can `create` a new account in the wallet, `list` all the accounts,
`find` an account (by name or public key), `load` an account (which
gives you access to the secret key), and `import` existing accounts if
you have access to their secret keys.

### Other Embedded functionality

`Luminate` also provides access to all it's other functionality so that
you can use it if you feel it is convenient. Specifically you can use
the `stellar` functionality and the `crypto` primitives used if you need
them.

        luminate.stellar. ...
        luminate.crypt. ...


## Detailed Command-line Usage

Luminate can manage all your Stellar accounts for you. It
stores all your accounts in a local folder called the "wallet".
These accounts are strongly encrypted so they can be safely stored and
backed up.

> If you forget your password your accounts CANNOT be used anymore!
> Ensure you choose a good password and make sure you remember it.


Create your first wallet account:

    ./luminate create myFirstAccount

Luminate create a new account, name it "myFirstAccount" and ask
you for a password to encrypt this account. You can use different
passwords for each account but it is generally more convienient to use
the same password for all accounts (just because it's easier to remember).

Now, the way Stellar works, this account is not yet active (or available)
on the network. In order to activate this account you will need to transfer some
funds into it using an already active account and you're ready to go.


Once you have an active account, you can activate another accounts using:

    ./luminate activate --from activeAccount --amt 2 inactiveAccount


After adding a few accounts to your wallet, you can list all of them:

    ./luminate list


You can check the status of your account on Stellar using:

    ./luminate status myFirstAccount

You can check the status of ANY account on Stellar using:

    ./luminate status GD6E56QMLH4IYFMWDIRRGRVUEWS2ZHEKHO7Y2OTGWD6VSEQGP4BSJXPV


You can import an existing account so that it can be managed by Luminate by using
the SECRET Key:

    ./luminate import myNewAccount SC5ZWTUBE277Q73NRK47ZHHWKYAOCP4RKKA5SNAOJCKBXOLXLI2DE74Q


You can export your account out of luminate by exposing the SECRET Key:

    ./luminate export GD6E56QMLH4IYFMWDIRRGRVUEWS2ZHEKHO7Y2OTGWD6VSEQGP4BSJXPV


You can make payments from Luminate:

    ./luminate pay --from myFirstAccount --amt XLM:12.345 --to GBHEJM54VIBM6GPC5FZTD7A4O5VZCZAUOYSEIQUXKWJMHL3QMUOJHKHR



### ADVANCED FUNCTIONS

You can list all assets on the Stellar network:

    ./luminate list-assets


You can also set or clear the auth flags assets you manage:

    ./luminate set-flags --for myFirstAccount --flags AuthRequired,AuthRevokable,AuthImmutable
    ./luminate clear-flags --for myFirstAccount --flags AuthRequired,AuthRevokable,AuthImmutable


You can set up a trustline on for a particular asset:

    ./luminate set-trustline --for myFirstAccount --assetcode EVER --issuer GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE


You can also revoke a trustline:

    ./luminate revoke-trustline --for myFirstAccount --assetcode EVER --issuer GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE


You can allow/remove trust for a trustline holding your assets:

    ./luminate allow-trust --for myFirstAccount --assetcode EVER --to GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE
    ./luminate remove-trust --for myFirstAccount --assetcode EVER --to GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE



### ENVIRONMENT VARS:
The following environmental variables control the behaviour of Luminate.
They can also be set in a file called ".env".

    LM__AS_SCRIPT         :   Script friendly output
                              (easier to extract and parse)
    LM__NO_COLOR          :   Output plain text
                              (no color or format)
    LM__WALLET_PASSWORD   :   Password for wallet account used
                              (only valid in scripts: "LM__AS_SCRIPT" must be set)
    LM__WALLET_FOLDER     :   Path to wallet folder
                              (defaults to .wallet/)
    LM__HORIZON           :   Horizon server to use
                              (defaults to "LIVE". Can be set to "TEST")



HELP:
Running Luminate without any command or any of the following:

    ./luminate help
    ./luminate --help
    ./luminate -h

Will bring up this help screen.

You can find the current Luminate version using:

    ./luminate version


## How to Contribute to Luminate
Luminate is open to everyone and any help is greatly appreciated.  Feel
free to [raise issues](https://github.com/theproductiveprogrammer/luminate/issues),
[contribute features](https://github.com/theproductiveprogrammer/luminate/pulls),
[improve the documentation](https://github.com/theproductiveprogrammer/luminate/pulls),
or simply [add your suggestions](https://github.com/theproductiveprogrammer/luminate/issues).


### Pending Features

* Multi-Signature Support
* Offer Management
* Mapping Stellar Error Codes
* Implement [Whisper](https://github.com/hmatejx/Interstellar-Whisper)
