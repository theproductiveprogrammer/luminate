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

You can also simply check if an account is active (valid) using:

    {red ./luminate} {green is-account-active} myFirstAccount

And you can also check if the transactions against an account using:

    {red ./luminate} {green txns} myFirstAccount




You can import an existing account so that it can be managed by {red Luminate} by using
the {magenta.bold SECRET Key}:

    {red ./luminate} {green import} {blue myNewAccount} SC5ZWTUBE277Q73NRK47ZHHWKYAOCP4RKKA5SNAOJCKBXOLXLI2DE74Q


You can export your account out of luminate by exposing the {magenta.bold SECRET Key}:

    {red ./luminate} {green export} GD6E56QMLH4IYFMWDIRRGRVUEWS2ZHEKHO7Y2OTGWD6VSEQGP4BSJXPV


You can make payments from {red Luminate}:

    {red ./luminate} {green pay} {bold --from} myFirstAccount {bold --amt} XLM:12.345 --to GBHEJM54VIBM6GPC5FZTD7A4O5VZCZAUOYSEIQUXKWJMHL3QMUOJHKHR



{bold ASSET MANAGEMENT FUNCTIONS}

You can list all assets on the {blue Stellar} network:

    {red ./luminate} {green list-assets}


You can also set or clear the auth flags assets you manage:

    {red ./luminate} {green set-flags} {bold --for} myFirstAccount {bold --flags} AuthRequired,AuthRevokable,AuthImmutable
    {red ./luminate} {green clear-flag}s {bold --for} myFirstAccount {bold --flags} AuthRequired,AuthRevokable,AuthImmutable


You can set up a trustline on for a particular asset:

    {red ./luminate} {green set-trustline} {bold --for} myFirstAccount {bold --assetcode} EVER {bold --issuer} GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE


You can also revoke a trustline:

    {red ./luminate} {green revoke-trustline} {bold --for} myFirstAccount {bold --assetcode} EVER {bold --issuer} GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE


And you can check if a trustline is set:

    {red ./luminate} {green is-trustline-set} {bold --for} myFirstAccount {bold --assetcode} EVER {bold --issuer} GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE


You can allow/remove trust for a trustline holding your assets:

    {red ./luminate} {green allow-trust} {bold --for} myAssetIssuingAccount {bold --assetcode} EVER {bold --to} GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE
    {red ./luminate} {green remove-trust} {bold --for} myAssetIssuingAccount {bold --assetcode} EVER {bold --to} GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE


The allow/remove trust for a trustline also supports batch mode operation using the {bold --to-batch} parameter which takes a file with a list of accounts, one per row as an argument.

    {red ./luminate} {green allow-trust} {bold --for} myAssetIssuingAccount {bold --assetcode} EVER {bold --to-batch} accounts-to-allow.txt
    {red ./luminate} {green remove-trust} {bold --for} myAssetIssuingAccount {bold --assetcode} EVER {bold --to-batch} accounts-to-freeze.txt

The file with accounts used with {bold --to-batch} may use {bold #} at the start of the row to ignore that row when processing the file. 

{bold SETTING SIGNATORIES AND A SOURCE ACCOUNT}

{blue Stellar} allows an account to have multiple signatories. To do this use:

    {red ./luminate} {green add-signer} {bold --for} myFirstAccount {bold --weight} 1 GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE


Of course, you can remove a signatory from your account as well:

    {red ./luminate} {green remove-signer} {bold --for} myFirstAccount GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE


This means that the additional signer can can submit transactions for the other
accounts as well. This means you can submit transactions for accounts that are
different from the current wallet account.

To do this simply specify the {bold.red --source} flag and the transaction will be
submitted against the given source account.

(For now you can only add other accounts as {gray signers})

For example:

    {red ./luminate} {green activate} {bold --from} activeAccount {bold --amt} 2 inactiveAccount {bold.red --source} GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE

will activate the new account but use funds from {gray GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE} instead of the {bold activeAccount}.

    {red ./luminate} {green pay} {bold --from} myFirstAccount {bold --amt} XLM:12.345 --to GBHEJM54VIBM6GPC5FZTD7A4O5VZCZAUOYSEIQUXKWJMHL3QMUOJHKHR {bold.red --source} GD6E56QMLH4IYFMWDIRRGRVUEWS2ZHEKHO7Y2OTGWD6VSEQGP4BSJXPV

Herea again {bold myFirstAccount} is making a payment but the funds will be taken from the source account {gray GD6E56QMLH4IYFMWDIRRGRVUEWS2ZHEKHO7Y2OTGWD6VSEQGP4BSJXPV}.


In the same manner the {bold.red --source} flag can be set for these other operations:

    {red ./luminate} {green set-flags} ...
    {red ./luminate} {green clear-flags} ...
    {red ./luminate} {green set-trustline} ...
    {red ./luminate} {green revoke-trustline} ...
    {red ./luminate} {green allow-trust} ...
    {red ./luminate} {green remove-trust} ...
    {red ./luminate} {green set-weights} ...
    {red ./luminate} {green set-master-weight} ...


You can set the weights for the different operations as follows:

    {red ./luminate} {green set-weights} {bold --for} account {bold --low} lowThreshold {bold --medium} mediumThreshold {bold --high} highThreshold

And you can set the master weight for the current account using:

    {red ./luminate} {green set-master-weight} {bold --for} account {bold --weight} masterKeyWeight

{bold MEMO Support:}
Transactions like {green activate}, {green pay}, and operations like {green trustline}, {green flags}, {green signing}, and {green weights} also support adding a {bold memo}:

    {red ./luminate} ... {green --memo} 'My Memo'

for example

    {red ./luminate} {green.bold activate} {bold --from} activeAccount {bold --amt} 2 {bold --memo} 'Activating now' inactiveAccount


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
    {magenta LM__TIMEOUT}           :   Timeout to use
                              {gray (defaults to {bold.black 30})}
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

