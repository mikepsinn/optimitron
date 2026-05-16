# /agencies/dtreasury/dssa

## Metadata

- Page title: Universal Security Administration | International Campaign to End War and Disease
- Meta description: You spend more administering help than you spend helping. That's not a safety net — that's a jobs programme for administrators.
- Canonical: https://warondisease.org/agencies/dtreasury/dssa
- Open Graph title: Universal Security Administration
- Open Graph description: You spend more administering help than you spend helping. That's not a safety net — that's a jobs programme for administrators.
- Open Graph image: https://warondisease.org/api/og/route?path=%2Fagencies%2Fdtreasury%2Fdssa
- Twitter title: Universal Security Administration
- Twitter description: You spend more administering help than you spend helping. That's not a safety net — that's a jobs programme for administrators.

## Visible Page Copy

- DEPRECATED
- UNIVERSAL SECURITY ADMINISTRATION
## SOCIAL SECURITY ADMINISTRATION + WELFARE BUREAUCRACY
- “UBI replaces 83 welfare programs with one for-loop”
- — WISHONIA, PLANETARY SYSTEMS ENGINEER
### WHAT THEY OPTIMIZE FOR
- Optimizing for 'did we correctly decide who deserves to eat' instead of just feeding everyone.
- Spending more catching the 1.5% who cheat than it would cost to just give everyone the money.
- 80+ overlapping programs, each with its own bureaucracy, each justifying its own existence.
- One number. Is it going down? Good. Is it zero? Done.
- UBI via World ID. If you're human, you qualify. No applications, no wait, no committee deciding if you deserve lunch.
- Current system: up to 50% overhead. UBI for-loop: ~0%.
### WHAT THEY COST YOU
- Cost of administering means-tested welfare programs
- Federal means-tested welfare programs with separate bureaucracies
- Wait time for SNAP, Medicaid, or disability applications
- Millions who qualify but never navigate the paperwork
- [← BACK TO DTREASURY](/agencies/dtreasury)
### WHY YOUR WELFARE SYSTEM FAILS
- Your species built 80+ overlapping welfare programs, each with its own bureaucracy, application process, and fraud investigation department. The result: you spend more deciding who deserves help than you spend helping them.
#### OVERHEAD EXCEEDS IMPACT
- Your species currently spends more administering welfare than it distributes in benefits. The overhead-to-impact ratio is, and I say this with genuine bewilderment, worse than 1:1 in several programs.
#### THE POVERTY TRAP
- Means-tested benefits create a cliff: earn $1 more and lose $2,000 in benefits. Your system actively punishes people for getting less poor. On my planet, this is classified as a bug, not a feature.
#### THE CRACK-FALLING PROBLEM
- Millions of people who qualify for benefits never receive them because they can't navigate the paperwork. You built a safety net with holes larger than the people it's supposed to catch.
### HOW $WISH UBI WORKS
- The transaction tax accumulates in a treasury that distributes Universal Basic Income to every verified citizen. World ID prevents fraud. No means testing. No case workers. No applications. Just money going directly to people.
- 01
#### TRANSACTION TAX ACCUMULATES
- 0.5% of every $WISH transaction flows to the treasury automatically. The tax happens when you spend. Like sales tax, except it funds keeping people alive instead of whatever your current sales tax funds. (Nobody knows.)
- 02
#### TREASURY DISTRIBUTES UBI
- One function. Divides the money equally among every verified citizen. That's the entire welfare system. Your current one has 80+ programmes and still loses people in the cracks.
- 03
#### WORLD ID PREVENTS FRAUD
- Each citizen proves they're a real human once. Not three bots. Not a cat. One proof, one registration. No duplicate claims. No case workers spending eight hours confirming you exist.
- 04
#### NO MEANS TESTING. EVER.
- Everyone gets the same amount. The billionaire gets it. The homeless person gets it. The administrative savings from eliminating means testing exceed the cost of giving it to people who don't 'need' it.
### 80+ PROGRAMS VS 1 FOR-LOOP
#### CURRENT SYSTEM (SSA + WELFARE)
#### $WISH UBI
- The $1.1 trillion your species spends administering welfare is more than the GDP of the Netherlands. That money doesn't feed anyone. It doesn't house anyone. It pays for the privilege of deciding which poor people are poor enough to deserve help. UBI eliminates that entire question.
### WHAT REPLACES THEM
- 80+ welfare programs → 1 function call
- SOLIDITY 0.8.24
- DEPLOYED ON BASE SEPOLIA
- ```text
// UBIDistributor.distributeUBI() — replaces the entire welfare system
function distributeUBI() external {                             // Anyone can call this
    uint256 balance = wishToken.balanceOf(address(this));       // How much is in the pot
    uint256 perCitizen = balance / citizenList.length;          // Split equally

    for (uint256 i = 0; i < citizenList.length; i++) {
        wishToken.safeTransfer(citizenList[i], perCitizen);    // Send to every citizen
    }
}
// No applications. No case workers. No means testing.
// No fraud investigation. No waiting. Just equal splits.
```
- Every verified citizen (World ID) gets an equal share. No applications, no case workers, no means-testing, no fraud investigation, no processing delays. The entire welfare bureaucracy becomes a for-loop.
### THE SAVINGS
- That's more than the GDP of the Netherlands. Spent not on helping people, but on deciding which people deserve help.
- “You spend more money deciding who deserves help than you spend helping them. That's not a safety net. That's a jobs programme for form designers.”
- — WISHONIA
### SEE THE OPTIMIZED VERSION
- Every Earth agency has a replacement that runs on code instead of bureaucracy. Fund the campaign. See the full system. Set your priorities.
- [FUND THE REFERENDUM](/prize)
- [OPTIMIZED GOVERNANCE](/agencies)
- [SET YOUR PRIORITIES](/agencies/dcongress/wishocracy)
