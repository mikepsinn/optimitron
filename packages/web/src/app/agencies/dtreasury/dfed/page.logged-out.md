# /agencies/dtreasury/dfed

## Metadata

- Page title: Algorithmic Reserve | International Campaign to End War and Disease
- Meta description: Twelve people in a room deciding how much your money is worth. On my planet, we call that a hostage situation.
- Canonical: https://warondisease.org/agencies/dtreasury/dfed
- Open Graph title: Algorithmic Reserve
- Open Graph description: Twelve people in a room deciding how much your money is worth. On my planet, we call that a hostage situation.
- Open Graph image: https://warondisease.org/api/og/route?path=%2Fagencies%2Fdtreasury%2Fdfed
- Twitter title: Algorithmic Reserve
- Twitter description: Twelve people in a room deciding how much your money is worth. On my planet, we call that a hostage situation.

## Visible Page Copy

- DEPRECATED
- ALGORITHMIC RESERVE
## FEDERAL RESERVE SYSTEM
- “0% inflation anchored to productivity — new money via UBI, not banks”
- — WISHONIA, PLANETARY SYSTEMS ENGINEER
### REPORT CARD
- 🏦
- The dollar has lost 97% of its purchasing power since the Fed was created. The economy grew faster without it (3.8% vs 2.7%). Canada had zero bank failures during the Great Depression without a central bank. The Fed's balance sheet went from $900B to $8.9T — printing money that went to the top 1%.
- “Your species created an institution to manage your money. In 111 years it has destroyed ninety-seven percent of your currency's value, bailed out the banks that crashed the economy, printed four point six trillion dollars during a pandemic that mostly went to the already wealthy, and presided over the largest wealth transfer in human history. On my planet, we would call that embezzlement. Here you call it monetary policy.”
- — WISHONIA
### WHAT THEY OPTIMIZE FOR
- Deliberately devalues every paycheck by 2%/year. They call this 'price stability.' Your grandparents call it 'why a house costs 40x what it used to.'
- New money goes to banks first. They lend it out before prices adjust. By the time it reaches you, the purchasing power is already gone.
- 111 years, zero audits. The Fed's primary achievement is making everyone too busy to question why 12 people control the money supply.
- The only monetary policy metric that matters: can a normal person buy more stuff this year than last year?
- Fixed supply anchored to productivity growth. Your money buys more over time, not less.
- Productivity gains distributed as UBI, not funnelled through banks to asset holders first.
### SPENDING VS OUTCOMES
##### 🏦 FEDERAL RESERVE SYSTEM
- Promote maximum employment, stable prices, and moderate long-term interest rates
- Fed Operating Expenses + Interest on Reserves (USD)
- 💵 Dollar Purchasing Power (1913 = $1.00)
- 🖨️ Fed Balance Sheet (trillions USD)
- 2008 [$700B TARP + $16.1T in Fed emergency lending (GAO audit). Citigroup gets $45B, pays $5.33B in exec bonuses. 10M families lose homes. Zero bankers jailed. ↗](https://www.gao.gov/products/gao-11-696)
- 2020 [COVID: $4.6T created in 2 years. Top 1% gains $4T in net worth. Bottom 50% gets $1,200 stimulus checks. ↗](https://fred.stlouisfed.org/series/WALCL)
- 2022 [Inflation hits 9.1% — highest since 1981. Grocery prices up 25% in 3 years. ↗](https://www.bls.gov/cpi/)
### WHAT THEY COST YOU
- Unelected humans controlling money for 330 million people
- Staff across 12 regional Federal Reserve Banks
- Operating expenses of the Federal Reserve System
- Purchasing power lost since the Fed was created in 1913
- [← BACK TO DTREASURY](/agencies/dtreasury)
### THE ALTERNATIVE: FIXED SUPPLY, ZERO INFLATION
- $WISH has a fixed supply set once at deployment. No minting. No central bank. No algorithm deciding how much to print. Your central banks created $13 trillion since 2020. $WISH creates exactly zero, ever.
- Productivity gains manifest as gentle deflation — same money, more goods, everyone's purchasing power rises. The total supply is set once in the constructor and enforced by the contract. No entity can create more. This is not monetary policy. This is the absence of monetary policy. Which, based on your track record, is a significant upgrade.
### THE PATTERN (2,000 YEARS, SAME BUG)
- Your species has run this exact experiment at least four times. Each time: a government gains the ability to create money, uses it to fund wars, the currency collapses, and the population suffers. Then you do it again.
#### Silver content in denarius reduced from 95% to 5%
- 1,000% price increases. Empire fragments. Diocletian blames merchants.
#### National Assembly prints assignats backed by seized church land
- 13,000% hyperinflation in five years. Revolution eats its children. Napoleon shows up.
#### Reichsbank prints marks to pay war reparations
- 29,500% monthly inflation. Life savings buy a loaf of bread. Scapegoating begins.
#### Federal Reserve created. Dollar immediately used to fund WWI without popular consent.
- Dollar loses 96% of value. 310 million deaths war and conflict deaths since 1900. $170 trillion in cumulative military spending.
### WHAT HAPPENED IN 1971
- Nixon severed the dollar from gold. Before that, the money printer had a constraint. After that, it didn't.
#### BEFORE 1971 (GOLD-ANCHORED)
#### AFTER 1971 (FIAT CURRENCY)
- Median wages measured in gold equivalent have lost 93% of their value since 1971. Your species doubled its workforce and household income rose ten percentage points. You added an entire second job and got almost nothing.
### THE CANTILLON EFFECT
- When new money is created, it doesn't appear evenly. It enters through banks and government contractors. By the time it reaches you, prices have already risen.
- You got higher grocery prices.
### WHAT REPLACES THEM
- 12 unelected humans → 1 constructor parameter
- SOLIDITY 0.8.24
- DEPLOYED ON BASE SEPOLIA
- ```text
// WishToken.sol — the entire monetary policy
constructor(
    address _treasury,
    uint256 _initialSupply,  // Fixed. Forever. No meetings.
    uint256 _taxRateBps      // 0.5% — replaces the entire IRS
) ERC20("Wish", "WISH") Ownable(msg.sender) {
    maxSupply = _initialSupply;  // Set once. Can never increase.
    _mint(msg.sender, _initialSupply);
}

// That's it. No board meetings. No interest rate decisions.
// No quantitative easing. No money printer. Just math.
```
- The total supply of $WISH is set once at deployment and enforced by the contract. No entity can create more. Productivity gains manifest as gentle deflation — your money buys more over time, not less.
### THE SAVINGS
- Since 1913, the dollar has lost 96 cents of every dollar. Under fixed supply, that theft is mathematically impossible.
- “Your central bank has one job: manage the money supply. In 111 years they've managed to destroy 96% of it. On my planet we'd call that a bug report, not a mandate.”
### SEE THE OPTIMIZED VERSION
- Every Earth agency has a replacement that runs on code instead of bureaucracy. Fund the campaign. See the full system. Set your priorities.
- [FUND THE REFERENDUM](/prize)
- [OPTIMIZED GOVERNANCE](/agencies)
- [SET YOUR PRIORITIES](/agencies/dcongress/wishocracy)
