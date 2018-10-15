'use strict'

module.exports = showHelp

/*      outcome/
 * Show help message
 */
function showHelp(cfg, args, op) {
    op.out(op.chalk`
            {bold.red *Luminate*}
    {underline.gray Command-line wallet for Stellar}

{bold USAGE:}

{red Luminate} can manage all your {blue Stellar} accounts for you. It
stores all your accounts in a local folder called the "{bold wallet}".
These accounts are strongly encrypted so they can be safely stored and
backed up.

    {red If you forget your password your accounts CANNOT be used anymore!
    Ensure you choose a good password and make {bold sure} you remember it.}


Create your first wallet account:

    {red ./luminate} {green create} {bold myFirstAccount}

{red Luminate} create a new account, name it "{bold myFirstAccount}" and ask
you for a password to encrypt this account. You can use different
passwords for each account but it is generally more convienient to use
the same password for all accounts (just because it's easier to remember).

Now, the way {blue Stellar} works, this account is not yet active (or available)
on the network. In order to activate this account you will need to transfer some
funds into it using an already active account and you're ready to go.


Once you have an active account, you can activate another accounts using:

    {red ./luminate} {green.bold activate} {bold --from} activeAccount {bold --amt} 2 inactiveAccount


After adding a few accounts to your wallet, you can list all of them:

    {red ./luminate} {green.bold list}


You can check the status of your account on Stellar using:

    {red ./luminate} {green status} myFirstAccount

You can check the status of ANY account on Stellar using:

    {red ./luminate} {green status} GD6E56QMLH4IYFMWDIRRGRVUEWS2ZHEKHO7Y2OTGWD6VSEQGP4BSJXPV


You can import an existing account so that it can be managed by {red Luminate} by using
the {magenta.bold SECRET Key}:

    {red ./luminate} {green import} {blue myNewAccount} SC5ZWTUBE277Q73NRK47ZHHWKYAOCP4RKKA5SNAOJCKBXOLXLI2DE74Q


You can export your account out of luminate by exposing the {magenta.bold SECRET Key}:

    {red ./luminate} {green export} GD6E56QMLH4IYFMWDIRRGRVUEWS2ZHEKHO7Y2OTGWD6VSEQGP4BSJXPV


You can make payments from {red Luminate}:

    {red ./luminate} {green pay} {bold --from} myFirstAccount {bold --amt} XLM:12.345 --to GBHEJM54VIBM6GPC5FZTD7A4O5VZCZAUOYSEIQUXKWJMHL3QMUOJHKHR



{bold ADVANCED FUNCTIONS}

You can list all assets on the {blue Stellar} network:

    {red ./luminate} {green list-assets}


You can set up a trustline on for a particular asset:

    {red ./luminate} {green set-trustline} {bold --for} myFirstAccount {bold --assetcode} EVER {bold --issuer} GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE [TODO]


You can also revoke a trustline:
    {red ./luminate} {green revoke-trustline} {bold --for} myFirstAccount {bold --assetcode} EVER {bold --issuer} GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE [TODO]


{bold ENVIRONMENT VARS:}
The following environmental variables control the behaviour of {red Luminate}.
They can also be set in a file called "{bold .env}".

    {magenta LM__AS_SCRIPT}         :   Script friendly output
                              {gray (easier to extract and parse)}
    {magenta LM__NO_COLOR}          :   Output plain text
                              {gray (no color or format)}
    {magenta LM__WALLET_PASSWORD}   :   Password for wallet account used
                              {gray (only valid in scripts: "LM__AS_SCRIPT" must be set)}
    {magenta LM__WALLET_FOLDER}     :   Path to wallet folder
                              {gray (defaults to {bold.black .wallet/})}
    {magenta LM__HORIZON}           :   Horizon server to use
                              {gray (defaults to "{bold.black LIVE}". Can be set to "{bold.black TEST}")}



{bold HELP:}
Running {red Luminate} without any command or any of the following:

    {red ./luminate} {green help}
    {red ./luminate} {green --help}
    {red ./luminate} {green -h}

Will bring up this help screen.

You can find the current {red Luminate} version using:

    {red ./luminate} {green version}

Refer to the README/Manual for more details.

`)
}

