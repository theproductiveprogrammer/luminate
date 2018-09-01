# Luminate

Luminate is a free, open-source, command-line wallet for people who want
to manage crypto on the [Stellar](https://www.stellar.org/) network.

![luminate](icon_400x400.png)

Stellar has [an excellent API](https://www.stellar.org/developers/reference/)
and [several excellent wallets](https://www.stellar.org/lumens/wallets/).
The goal of Luminate is to add to this ecosystem by providing a command line
wallet for users who do not want to install a full desktop application or trust a web service.

Because it is a command-line application, Luminate is simple, flexible, yet very
powerful. The code is a thin wrapper around [the Stellar
API](https://www.stellar.org/developers/reference/), which makes Luminate simple
and clean with a small code footprint. Luminate is easy to understand
at a glance and transparent enough to be easily customized and fully
trusted.

## QuickStart
Luminate is a [node](https://nodejs.org/) application. Make sure you
have node (and the [yarn](https://yarnpkg.com/) package manager)
installed then do the following:

1. Download [Luminate](https://github.com/theproductiveprogrammer/luminate) from Github
2. Run `yarn install`
3. Run `./luminate <command>`

## Available Commands
`Luminate` allows you to perform any stellar action from the command
line. For each action you provide a command with arguments similar to
other command-line programs you have used.

The available commands are:

```
    status  :   Show status of wallet accounts
    new     :   Create a new wallet account (Use the 'create' command to reflect this account on stellar)
    create  :   Create (and fund) an account on stellar
    add     :   Import an existing account to the wallet
    trust   :   Add/Revoke Trustline
    pay     :   Send payments
```

*TODO*: Advanced commands (multi-signature, offer management, set options)

### Command Details
1. The `status` Command

This command show the status of all the accounts in the wallet.

        status [-v] [#acc]

The status includes the current balances of the account on the stellar
network. Using the `-v` flag will show a verbose output with many
details including the secret key of the account (useful if you want to
migrate out of `luminate`).

If you specify the account (`#acc`) in the wallet, only the status of
that account will be fetched. (Refer the section **Specifying Accounts**
below for details on how to specify accounts).

2. The `new` Command

This command creates a new account in our wallet.

        new [-q]

The `-q` (quiet) flag suppresses most output. This newly created account
will be encrypted and safety stored in the wallet. Because Stellar
requires newly created accounts to be funded this account is not created
on the Stellar network by default. To reflect this into the Stellar
network use the `create` command (which follows).

3. The `create` Command

This command creates and funds an account on Stellar

        create [-q] <account|#> <funds> <#acc>

Here we use an existing account that has funds to create and fund our
new account on the stellar network. The 'creating' account as well as the
'created' account can be specified as detailed in the **Specifying
Accounts** section below.

This command can also be used to create and fund (in `XLM`) a
third-party's account (one which we do not manage in our wallet). In
such a case, simply specify the third party's account key (public) as
the first parameter.

Use the `-q` (quiet) flag to suppress most outputs and warnings.

*Example*

        ./luminate create latestAccount 25 existingAccount

4. The `add` Command

This command allows you to import an existing account into `luminate`.

        add [-v] <secret>

The `secret` is the 32-byte ed25519 seed. Use `-v` to get a more verbose
output.

*Example*

        ./luminate add -v SCNXL3IWO2R6NJ7CKVEYZG5XCNZYTPIQ3ZCRCG22WPKGYRCM6RETS3JY

5. The `trust` Command

Add or Revoke a
[Trustline](https://www.stellar.org/developers/guides/concepts/assets.html#trustlines)

        trust [-revoke] <#acc> <assetCode> <issuer>

*Example*

        ./luminate trust myacc1 CARS GASRAW5RT6GIC47O4XLMGDNEDTG6Y6DJ7QEHACOTZAWISQN6J5BRN5YX


6. The `pay` Command

Send payment to another account

        pay [-v] <dest> <#acc> <amount> <assetCode> [issuer]

This command sends `amount` of `assetCode` to the `dest` account. If
`assetCode` is ambigous you can specify the `issuer` to ensure the
correct asset is transferred (if `luminate` detects that there could be
any potential for confusion it will not make the payment until the
issuer is provided).

*Example*

        ./luminate GASRAW5RT6GIC47O4XLMGDNEDTG6Y6DJ7QEHACOTZAWISQN6J5BRN5YX myacc1 3.3 CARS


### Specifying Accounts
As you can have multiple accounts in your wallet, `luminate` gives you
two simple methods for selecting them:

1. Every account in the wallet has a name. Specifying this name will
   select the account.
2. Specifying the first few matching characters of the public key will
   also select the account

*Example*

        ./luminate status myacc1
        ./luminate status GASRAW5RT6GIC47O4XLMGDNEDTG6Y6DJ7QEHACOTZAWISQN6J5BRN5YX
        ./luminate status GASR

All the above select the same account in the wallet


## Connecting to the live network
By default `Luminate` now connects to the 'stellar *test* network' by
default. Please set the `HORIZON` parameter to `LIVE` in order to
connect to the live network.

```
$ HORIZON=LIVE node . account info GD....
```

## Security
`Luminate` stores and manages each of your wallet keys locally. All your
data is stored on your machine (you can specify the location or use the
default `stellar-keystore/`).

In order to store your keys securely `Luminate` will ask you for a
password when creating a new keypair. _This password is important and
should be kept safe_. If you loose the password, there is no way for you
to retrieve your keypair.

Please backup your keypairs safely. Because they are encrypted they are
safe to back up in your normal backup locations.

## Options and Customization
`Luminate` provides the following options you can customize.

- `DEBUG`
    If we set `DEBUG`, `Luminate` will dump more detail (including stack
    information in errors)

- `KEYSTORE_FOLDER`
    This is the location where `Luminate` stores all your wallet keys
    Defaults to `./stellar-keystore`

- `HORIZON`
    This is the stellar network to which the wallet connects.
    _*By default this connects to the TEST network*_ (NOT the LIVE
    network). In order to connect to the live network this needs to be
    set to 'LIVE'
    Defaults to ` https://horizon-testnet.stellar.org/` (TEST NETWORK)
    Can be set to `LIVE` (will connect to `https://horizon.stellar.org/`)
    or to a specific [Horizon Server](https://www.stellar.org/developers/horizon/reference/index.html)

These parameters can be set as environment variables on the command
line.

```
$ HORIZON=LIVE node . account info GD....
```


## How to Contribute to Luminate
Luminate is open to everyone and any help is greatly appreciated.  Feel
free to [raise issues](https://github.com/theproductiveprogrammer/luminate/issues),
[contribute features](https://github.com/theproductiveprogrammer/luminate/pulls),
[improve the documentation](https://github.com/theproductiveprogrammer/luminate/pulls),
or simply [add your suggestions](https://github.com/theproductiveprogrammer/luminate/issues).

### Pending Features

* Multi-Signature Support
* Offer Management
* Setting options
* Mapping Stellar Error Codes

