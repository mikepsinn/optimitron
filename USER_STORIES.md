# User Stories & Revenue Strategy

## User Personas (ordered by revenue potential)

### 1. 🏛️ Political Campaigns & SuperPACs — **$$$$$**
**The IAB Play** — Incentive Alignment Bonds

**Stories:**
- "As a campaign manager, I want to know which policy positions maximize voter alignment so I can win elections"
- "As a SuperPAC, I want to fund candidates who are genuinely aligned with citizens' preferences, not just popular"
- "As a donor, I want proof that my money goes to candidates who will actually vote for what people want"

**Features needed:**
- [ ] Citizen preference aggregation (Wishocracy — ✅ DONE)
- [ ] Politician voting record analysis (Congress.gov fetcher — ✅ DONE)
- [ ] Alignment scoring (politician vs citizen preferences — ✅ DONE)
- [ ] Campaign recommendation engine ("run on these 5 policies")
- [ ] Donor dashboard ("your aligned candidates")
- [ ] IAB smart contracts (Phase 4)

**Revenue:** Campaign consulting, alignment data licensing, IAB bond fees
**Timeline:** Medium — need citizen preference data first (chicken-and-egg)

---

### 2. 🔬 Policy Researchers & Think Tanks — **$$$$**
**The Data Play**

**Stories:**
- "As a researcher, I want cross-country policy comparisons with real outcome data"
- "As a think tank, I want evidence-based policy recommendations for a specific jurisdiction"
- "As a government advisor, I want to know the optimal budget allocation backed by data"

**Features needed:**
- [ ] International comparison dashboards (✅ DONE — 71 countries, 4 domains)
- [ ] Custom jurisdiction analysis (run OBG/OPG for any city/state/country)
- [ ] API access for programmatic queries
- [ ] PDF report generation
- [ ] Custom dataset uploads

**Revenue:** API subscriptions ($99-999/mo), custom reports ($5K-50K), consulting
**Timeline:** Short — data and analysis already built, just need API + paywall

---

### 3. 🗳️ Citizens & Voters — **$ (but builds the moat)**
**The Preference Play** — most important for long-term value

**Stories:**
- "As a voter, I want to see how my tax dollars are currently spent vs how they should be spent"
- "As a citizen, I want to compare politicians by how well they represent my preferences"
- "As a taxpayer, I want to vote on budget priorities and see what the optimal allocation would be"
- "As a concerned citizen, I want to see what policies other countries use that work better"

**Features needed:**
- [ ] Budget visualization (✅ DONE)
- [ ] Policy rankings (✅ DONE)
- [ ] International comparisons (✅ DONE)
- [ ] **Pairwise comparison UI** — "Which matters more: Education or Defense?" (Wishocracy)
- [ ] **Personal alignment report** — "Here are the politicians most aligned with YOUR preferences"
- [ ] **Share/embed** — viral social media sharing of results

**Revenue:** Free tier + donations, Gitcoin quadratic funding, "premium" detailed reports
**Timeline:** Short — most features done, need pairwise UI and sharing

---

### 4. 📰 Journalists & Media — **$$ (exposure)**
**The Story Play**

**Stories:**
- "As a journalist, I want data-driven stories about government spending efficiency"
- "As a data reporter, I want embeddable charts comparing countries"

**Features needed:**
- [ ] Embeddable widgets / iframes
- [ ] Shareable chart URLs (og:image for social media previews)
- [ ] Data download (CSV/JSON)

**Revenue:** Attribution drives traffic → more users → more preference data
**Timeline:** Medium

---

### 5. 💊 Health Optimizers — **$$$ (subscription)**
**The Personal Optimization Play**

**Stories:**
- "As a health tracker, I want to know which supplements actually work for me"
- "As a patient, I want to find my optimal dosage based on my own data"
- "As a biohacker, I want causal inference on my Apple Health data"

**Features needed:**
- [ ] Health data import (Apple Health, Fitbit, etc. — ✅ DONE)
- [ ] Personal analysis pipeline (✅ DONE)
- [ ] Report generation (✅ DONE)
- [ ] User accounts + data storage
- [ ] Chrome extension (✅ DONE — basic)

**Revenue:** Freemium ($0/mo basic, $9.99/mo pro, $29.99/mo power)
**Timeline:** Long — needs accounts, data upload, privacy infrastructure

---

## Priority Matrix

| Feature | Revenue Impact | Build Effort | Data Available | Priority |
|---------|---------------|--------------|----------------|----------|
| Pairwise comparison UI | 🔴 Critical (enables #1 and #3) | Medium | N/A | **P0** |
| Politician alignment page | 🔴 Critical (#1 and #3) | Medium | Congress.gov ✅ | **P0** |
| Share/embed results | 🟡 High (viral growth) | Low | N/A | **P0** |
| API with auth + rate limiting | 🟡 High (#2 revenue) | Medium | All data ✅ | **P1** |
| Campaign recommendation engine | 🔴 Critical (#1 money) | High | Partial | **P1** |
| PDF report generation | 🟡 High (#2 revenue) | Low | Reports ✅ | **P1** |
| User accounts + health upload | 🟢 Medium (#5) | High | Importers ✅ | **P2** |
| IAB smart contracts | 🔴 Critical (#1 endgame) | Very High | Needs prefs | **P3** |

## Fastest Path to Revenue

### Month 1: Free + Viral
1. Ship website with budget/policy/comparison dashboards (✅ nearly done)
2. Add pairwise comparison UI → collect citizen preferences
3. Add politician alignment page → "Is YOUR representative aligned with YOU?"
4. Social sharing → viral distribution → preference data flywheel

### Month 2: Research Revenue
5. API access for researchers/think tanks ($99-999/mo)
6. Custom jurisdiction analysis ("Run this for my city")
7. PDF report generation for consulting clients

### Month 3: Campaign Revenue
8. Campaign alignment dashboard → "Run on THESE policies"
9. Donor matching → "Fund THIS candidate who matches YOUR preferences"
10. IAB mechanism design → crypto treasury

### Month 4+: Health Revenue
11. User accounts + health data upload
12. Personal optimization reports
13. Premium subscription tiers
