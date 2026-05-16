# /agencies/dtreasury/dirs

## Metadata

- Page title: Automated Revenue Service | International Campaign to End War and Disease
- Meta description: Six lines of code. That's all it took.
- Canonical: https://warondisease.org/agencies/dtreasury/dirs
- Open Graph title: Automated Revenue Service
- Open Graph description: Six lines of code. That's all it took.
- Open Graph image: https://warondisease.org/api/og/route?path=%2Fagencies%2Fdtreasury%2Fdirs
- Twitter title: Automated Revenue Service
- Twitter description: Six lines of code. That's all it took.

## Visible Page Copy

- DEPRECATED
- AUTOMATED REVENUE SERVICE
## INTERNAL REVENUE SERVICE
- “Six lines of Solidity replace 74,000 pages of tax code”
- — WISHONIA, PLANETARY SYSTEMS ENGINEER
### REPORT CARD
- 💸
- Budget was effectively flat/cut for a decade while the tax gap doubled to $700B. Audit rate collapsed from 1.1% to 0.25%. The IRA funding in 2022 is slowly reversing the damage.
- “You defunded the one agency that generates revenue. The IRS collects four dollars for every one dollar you spend on it. You cut its budget and the tax gap doubled to seven hundred billion. On my planet, we would call this self-sabotage. Here you call it fiscal conservatism.”
- — WISHONIA
### WHAT THEY OPTIMIZE FOR
- 74,000 pages. Every loophole is a feature, not a bug — it's how donors get paid back.
- 6.1 billion hours/year of citizen time. An entire profession ('accountant') exists to decode rules you wrote for yourselves.
- 83,000 employees optimizing for catching mistakes in a system designed to produce them.
- 0.5% transaction tax collects the same revenue at ~0% administrative cost.
- No forms, no deadlines, no accountants. Tax happens automatically on every transfer.
- Can't lobby a smart contract. Can't offshore a protocol. The tax is unavoidable because it's the protocol.
### SPENDING VS OUTCOMES
##### 💸 INTERNAL REVENUE SERVICE
- Provide America's taxpayers top quality service by helping them understand and meet their tax responsibilities
- IRS Annual Budget (USD)
- 🕳️ Tax Gap (USD, billions)
- 🔎 Individual Audit Rate (%)
- 2013 [IRS targeting scandal — Congress retaliates by cutting budget 20% over next 5 years ↗](https://www.tigta.gov/reports/audit/inappropriate-criteria-were-used-identify-tax-exempt-applications-review)
- 2017 [Audit rate for millionaires drops to 1.4% — lower than for EITC recipients making <$25K ↗](https://www.irs.gov/statistics/soi-tax-stats-irs-data-book)
- 2022 [Inflation Reduction Act — $80B IRS funding approved ↗](https://www.congress.gov/bill/117th-congress/house-bill/5376)
- 2023 [$20B of IRA funding rescinded in debt ceiling deal — before agents are even hired ↗](https://www.congress.gov/bill/118th-congress/house-bill/3746)
### WHAT THEY COST YOU
- Full-time IRS staff interpreting the tax code
- Cost to run the IRS each year
- The Internal Revenue Code and associated regulations
- Hours Americans spend on tax compliance each year
- [← BACK TO DTREASURY](/agencies/dtreasury)
### HOW THE TRANSACTION TAX WORKS
- Every $WISH transaction has a 0.5% fee baked into the token itself. You spend money. The tax happens. Nobody files anything. Nobody audits anything. 74,000 pages of tax code, 83,000 IRS employees, and 6.1 billion hours of annual filing time — all replaced by six lines of code that a competent intern could read in four minutes.
- 01
#### YOU SPEND $WISH
- You buy things. You pay people. You live your life. The currency does the rest. On your planet, this step requires a tax attorney.
- 02
#### 0.5% IS DEDUCTED AUTOMATICALLY
- Every transfer runs through _update(). The tax is computed, split off, and sent to the treasury. No filing. No form. No accountant.
- 03
#### THE REST ARRIVES AT THE RECIPIENT
- 99.5% goes where you wanted it. The 0.5% funds the things you voted for in Wishocracy. Education, healthcare, infrastructure — whatever 8 billion people chose, not whatever 535 people's donors suggested.
- 04
#### NO EVASION POSSIBLE
- The tax is protocol-level. There are no offshore accounts, no shell companies, no loopholes. If the token moves, the tax happens. That's it.
### IRS VS 6 LINES OF SOLIDITY
- The entire IRS budget is $12.3 billion per year. A 0.5% automated transaction tax on a currency with sufficient volume generates the same revenue with zero administrative overhead. The math is not complicated. The politics, apparently, is.
#### CURRENT SYSTEM (IRS)
#### $WISH TRANSACTION TAX
- Americans spend 6.1 billion hours per year on tax compliance. That's roughly 3 million full-time jobs worth of human effort — filling out forms, gathering receipts, hiring accountants — to accomplish what six lines of code do automatically and without error.
### WHAT REPLACES THEM
- 74,000 pages of tax code → 6 lines of Solidity
- SOLIDITY 0.8.24
- DEPLOYED ON BASE SEPOLIA
- ```text
// WishToken._update() — replaces the entire IRS
function _update(address from, address to, uint256 value) internal override {
    // Skip tax on mints, burns, or exempt addresses
    if (from == address(0) || to == address(0) || taxExempt[from]) {
        super._update(from, to, value);
        return;
    }
    uint256 taxAmount = (value * taxRateBps) / 10_000;  // 0.5% of every transfer
    super._update(from, treasury, taxAmount);            // Tax → treasury (automatic)
    super._update(from, to, value - taxAmount);          // Rest → recipient
}
// No filing. No audits. No loopholes. No accountants. No evasion.
```
- Every transfer automatically deducts 0.5% and sends it to the treasury. No filing, no forms, no audits, no compliance departments, no offshore accounts. The tax is unavoidable because it's built into the protocol.
### THE SAVINGS
- $12.3B direct IRS budget + $200B+ in annual compliance costs eliminated. That's $640 per American per year just in paperwork savings.
- “83,000 people interpreting 74,000 pages to do what six lines of code does automatically. And you wonder where your taxes go.”
### SEE THE OPTIMIZED VERSION
- Every Earth agency has a replacement that runs on code instead of bureaucracy. Fund the campaign. See the full system. Set your priorities.
- [FUND THE REFERENDUM](/prize)
- [OPTIMIZED GOVERNANCE](/agencies)
- [SET YOUR PRIORITIES](/agencies/dcongress/wishocracy)
