# Tezos DEX(ter) CLI

## Setup

    npm run setup

- Replace the value for RPC_URL with the localhost URL or the node of your choice.
- Replace the ADDRESS value with the Tezos address you want to interact.
- Replace PRIVATE_KEY with the private key of your signer account. Keep in mind this key should be kept private.

## Balances

To check the token balances of your address, run:

    ts-node balances.ts

or

    ts-node balance.ts tz1...

if you want to overwrite the address from `.env`.

## Transfers

Make a transfer from XTZ to a Token and vice versa.
Allowed values are: `XTZ`, `USDtz`, `tzBTC`, `ETHtz`, `wXTZ`

Script arguments are:

    ts-node transfer.ts { from } { to } { amount } { address }

Convert 1 `XTZ` to `USDtz`, run:

    ts-node transfer.ts XTZ USDtz 1 tz1...

Convert 1 `XTZ` to `ETHtz`, run:

    ts-node transfer.ts XTZ ETHtz 1 tz1...

Convert 1 `USDtz` to `XTZ`, run:

    ts-node transfer.ts USDtz XTZ 1 tz1...

Convert 0.005 `ETHtz` to `XTZ`, run:

    ts-node transfer.ts ETHtz XTZ 1 tz1...
