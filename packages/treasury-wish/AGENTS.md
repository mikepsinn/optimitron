# AGENTS.md — @optimitron/treasury-wish

## Scope

$WISH token monetary system — WishToken, WishocraticTreasury, UBIDistributor. Replaces welfare + IRS with programmable UBI and 0.5% transaction tax.

## Key Contracts

- `WishToken.sol` — Programmable currency with 0.5% transaction tax
- `WishocraticTreasury.sol` — Tax revenue allocation via Wishocracy (RAPPA)
- `UBIDistributor.sol` — Universal basic income distribution

## Dependencies

- `@optimitron/treasury-shared` — shared interfaces and mocks

## Rules

- **Solidity 0.8.24** with OpenZeppelin 5.1
- **Independent from Prize and IABs.** Different contract family.
- **Algorithmic 0% inflation.** Captured productivity gains prevent inflationary theft.

## Off-Limits

- `packages/treasury-prize/*`, `packages/treasury-iab/*`
- `apps/optimitron/*`
