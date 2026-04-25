# AGENTS.md — @optimitron/treasury-shared

## Scope

Shared interfaces and mocks for all treasury contract packages.

## Key Exports

- `contracts/interfaces/IAavePool.sol` — Aave V3 pool interface
- `contracts/interfaces/IAlignmentScoreOracle.sol` — Alignment oracle interface
- `contracts/interfaces/IVoteToken.sol` — Vote token interface
- `contracts/mocks/MockAavePool.sol` — Test mock
- `contracts/mocks/MockERC20.sol` — Test mock

## Rules

- **Interface changes affect all treasury packages.** Keep callers in `treasury-prize`, `treasury-iab`, and `treasury-wish` compatible when modifying shared exports.
- **Mocks are for testing only.** Never deploy mocks.
