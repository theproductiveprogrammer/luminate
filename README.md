# Luminate

Luminate is a command-line wallet for [Stellar](https://www.stellar.org/).

![luminate](luminate.png)

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
2. `yarn install`
3. `node . <command>`
    where `command` can be:
            keypair new : Create a new keypair for wallet
            keypair list: List all managed keypairs in wallet

            -h|--help|help: Show help
```



## How to Contribute to Luminate
Luminate is open to everyone and any help is greatly appreciated.  Feel
free to [raise issues](https://github.com/theproductiveprogrammer/luminate/issues),
[contribute features](https://github.com/theproductiveprogrammer/luminate/pulls),
[improve the documentation](https://github.com/theproductiveprogrammer/luminate/pulls),
or simply [add your suggestions](https://github.com/theproductiveprogrammer/luminate/issues).


