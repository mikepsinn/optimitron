# AGENTS.md — @optimitron/treasury-prize

## Scope

Earth Optimization Prize — Phase 1 referendum campaign. VoteToken and VoterPrizeTreasury contracts.

## Key Contracts

- `VoteToken.sol` — ERC-20 token minted 1:1 per verified voter recruited
- `VoterPrizeTreasury.sol` — USDC deposits → Aave V3 yield → prize distribution on success, principal+yield return on failure

## Dependencies

- `@optimitron/treasury-shared` — interfaces (IAavePool, IVoteToken) and mocks

## Rules

- **Solidity 0.8.24** with OpenZeppelin 5.1
- **Hardhat for testing.** Run `npx hardhat test` before any contract change.
- **Do NOT conflate with IABs.** Prize has Aave yield backstop. IABs do not. Different economics.
- **Do NOT conflate with $WISH.** Different contract family entirely.

## Off-Limits

- `packages/treasury-iab/*` — separate financial mechanism
- `packages/treasury-wish/*` — separate monetary system
- `apps/optimitron/*` — UI integration lives in the web package
