# IAB Implementation Gap Analysis

## What Was Already Here

| Contract | Status | Implements |
|---|---|---|
| `WishToken.sol` | ✅ Complete | ERC-20 with transaction tax → AlignmentTreasury |
| `AlignmentTreasury.sol` | ✅ Complete | Layer 2 (politician alignment scores + UBI) |
| `PrizePool.sol` | ⚠️ Partial | Prize escrow, wishocratic allocation, disputes |

## What Was Missing

### 1. `VictoryBond.sol` — THE CORE IAB INSTRUMENT ❌ → ✅ Now added

The entire investor-facing instrument was absent. The IAB paper describes bondholders
who buy bonds, earn returns from treaty revenue, and therefore lobby for adoption.
Without this contract, the IAB mechanism has no financial instrument for investors.

**Added in this PR:**
- `buyBond()` — investors deposit USDC, earn idle yield (T-bills) while waiting
- `receiveRevenue()` — treaty revenue flows in, splits 60/30/10 (holders/alignment/layer3)
- `claimRevenueShare()` — pro-rata revenue share for bondholders
- `claimIdleYield()` — T-bill-equivalent yield while funds sit idle
- `claimAssuranceRefund()` — full principal + yield if threshold never met by deadline
- `activateGlobalFailureRefund()` — oracle-callable if zero gains at T+15
- `claimGlobalFailureRefund()` — principal + 15 years yield if global failure clause fires
- `disburseLayer3Reserve()` — post-office career program funding (off-chain disbursement)

### 2. `PrizePool.sol` — Three gaps vs. the paper

#### Gap A: Binary threshold trigger vs. proportional release ⚠️
**Current:** Both health AND income metrics must hit thresholds simultaneously → pool unlocks all at once.  
**Paper says:** Treasury releases *proportionally* as terminal metrics improve. Each basis point of improvement in each metric unlocks a proportional fraction of the pool.  
**Fix needed:** Replace binary `updateMetrics()` unlock with proportional release curve. E.g., health pool releases linearly as `currentHealthMetric / healthMaxMetric`, income pool similarly.

#### Gap B: No yield-bearing escrow ❌
**Current:** WISH tokens sit inert in the contract.  
**Paper says:** All contributions earn yield (T-bills/ERC-4626) while held.  
**Fix needed:** Integrate an ERC-4626 yield vault. On deposit, push to vault. On distribution/refund, withdraw from vault (principal + yield).

#### Gap C: No 15-year global failure refund ❌
**Current:** No refund mechanism after threshold is met.  
**Paper says:** If Optimitron verifies zero cumulative gains in both terminal metrics at T+15, full principal + accrued yield returned.  
**Fix needed:** Add `deploymentTimestamp`, `verifiedGainsRecorded` flag, `activateGlobalFailureRefund()`, `claimGlobalFailureRefund()`. Same pattern as VictoryBond above.

#### Gap D: One-time distribute() vs. outcome perpetuity ⚠️
**Current:** `distribute()` is a one-time function that sets status to `Distributed`.  
**Paper says:** Outcome perpetuity — implementers earn a *continuing* revenue share as long as they keep producing results. One-time payout removes the incentive to continue.  
**Fix needed:** Replace one-shot distribute with a recurring claim model: each verified metric update releases a proportional tranche; implementers claim their share via `claimPerpetuityShard()` that can be called repeatedly as new tranches are released.

### 3. AlignmentTreasury — One gap

#### Gap: No connection to VictoryBond revenue intake ❌
**Current:** Treasury receives $WISH from transaction tax and distributes to politicians. There's no path for treaty-generated revenue to flow into VictoryBond.  
**Fix needed:** Add `sendTreatyRevenueToVictoryBond(uint256 amount)` function on AlignmentTreasury that calls `VictoryBond.receiveRevenue()`. This closes the loop: treaty success → $WISH flows into AlignmentTreasury → portion forwarded to VictoryBond → bondholder returns rise → more lobbying.

## The Self-Completing Loop (from prize paper)

With all gaps closed, the on-chain loop looks like this:

```
PrizePool.updateMetrics()         // Optimitron reports dHealthy_med + gIncome_med gains
  → proportional treasury release  // funds flow to verified implementers
  → AlignmentTreasury.receiveTreatyRevenue()  // portion of implementation revenue
  → VictoryBond.receiveRevenue()   // 30% forwarded to alignment + 60% to bondholders
  → bondholder returns rise         // $WISH earnings increase for existing bondholders
  → more investors buy VictoryBond  // rational selfish response to higher returns
  → more lobbying for treaty        // bondholder self-interest drives political pressure
  → more treaty adoption            // more jurisdictions sign
  → more metric gains               // PrizePool.updateMetrics() called again
  → cycle repeats, self-amplifying
```

No actor in this loop needs to be altruistic. Each step is the utility-maximizing
choice for the actor at that step.

## Priority Order for Implementation

1. **VictoryBond.sol** — ✅ Done in this PR (core IAB instrument)
2. **PrizePool: 15-year refund + yield vault** — Gaps C+B (closes "no lose" property for prize contributors)
3. **AlignmentTreasury → VictoryBond connection** — Gap 3 (closes the self-completing loop on-chain)
4. **PrizePool: proportional release** — Gap A (closer to paper spec; lower priority than refund)
5. **PrizePool: outcome perpetuity** — Gap D (important for long-term incentives; can ship after v1)

## What Does NOT Need To Be On-Chain

- **Layer 3 post-office careers** — matching politicians to consulting contracts is
  inherently off-chain. VictoryBond reserves the 10% allocation; disbursement is
  governance-controlled via the `disburseLayer3Reserve()` owner function.
- **Wishocratic pairwise comparison** — computation happens off-chain; only the
  aggregated allocation weights are posted on-chain. Already correctly implemented.
- **Optimitron causal inference** — the oracle itself is off-chain; only its
  signed output is submitted to `PrizePool.updateMetrics()`.
