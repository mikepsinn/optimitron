# AGENTS.md — @optimitron/treasury-iab

## Scope

Incentive Alignment Bonds — Phase 2 lobbying campaign. IABVault, IABSplitter, PublicGoodsPool, AlignmentScoreOracle, and PoliticalIncentiveAllocator.

## Key Contracts

- `IABVault.sol` — Bond purchases fund lobbying campaign
- `IABSplitter.sol` — 80/10/10 revenue split (trials/investors/superpacs)
- `PublicGoodsPool.sol` — Receives the 80% public goods allocation
- `AlignmentScoreOracle.sol` — On-chain politician alignment scores
- `PoliticalIncentiveAllocator.sol` — Routes funds based on alignment

## Dependencies

- `@optimitron/treasury-shared` — shared interfaces and mocks

## Rules

- **Solidity 0.8.24** with OpenZeppelin 5.1
- **IABs are NOT prizes.** Real investment risk, no Aave yield backstop, no refund.
- **Do NOT put IAB logic on the prize page.**

## Off-Limits

- `packages/treasury-prize/*` — different mechanism
- `packages/treasury-wish/*` — different mechanism
- `packages/web/*`
