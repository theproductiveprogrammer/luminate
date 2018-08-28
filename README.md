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

```
1. Download [Luminate](https://github.com/theproductiveprogrammer/luminate) from Github
2. Run `yarn install`
3. Run `./luminate <command>`
    where `command` can be:
            keypair new : Create a new keypair for wallet
            keypair list: List all managed keypairs in wallet

            -h|--help|help: Show help
```

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


