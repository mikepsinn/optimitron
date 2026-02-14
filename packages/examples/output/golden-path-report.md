# 🏥 Optomitron — Golden Path Health Optimization Report

**Generated:** 2026-02-14
**Data Period:** 180 days of synthetic health tracking
**Pipeline:** Synthetic data → Temporal alignment → Bradford Hill → PIS → Optimal values

## Executive Summary

This report demonstrates the complete Optomitron causal analysis pipeline.
Synthetic health data with *known* causal relationships was generated and
analyzed to validate that the engine correctly recovers:

| Relationship | Expected | Found | Status |
|-------------|----------|-------|--------|
| Vitamin D → Mood | positive | r=0.434 (p=< 0.001) | ✅ Confirmed |
| Sleep → Mood | positive | r=0.429 (p=< 0.001) | ✅ Confirmed |
| Coffee → Sleep | negative | r=-0.246 (p=< 0.001) | ✅ Confirmed |
| Vitamin D → Sleep | positive | r=0.114 (p=0.1273) | 🟡 Weak signal |

## Key Findings

### ✅ Vitamin D → Mood

- **Effect:** 8.5% improvement in Overall Mood
- **Correlation:** r = 0.434 (p = < 0.001)
- **Evidence Grade:** D
- **PIS:** 5.4/100
- **Onset Delay:** 2 day(s)
- **Optimal Value:** 4391.4 IU

### ✅ Sleep → Mood

- **Effect:** 7.5% improvement in Overall Mood
- **Correlation:** r = 0.429 (p = < 0.001)
- **Evidence Grade:** F
- **PIS:** 4.9/100
- **Onset Delay:** 0 day(s)
- **Optimal Value:** 7.4 hours

### ✅ Coffee → Sleep

- **Effect:** 2.8% reduction in Sleep Duration
- **Correlation:** r = -0.246 (p = < 0.001)
- **Evidence Grade:** F
- **PIS:** 1.7/100
- **Onset Delay:** 0 day(s)
- **Optimal Value:** 2.3 cups

### ⚠️ Vitamin D → Sleep

- **Effect:** 1.1% improvement in Sleep Duration
- **Correlation:** r = 0.114 (p = 0.1273)
- **Evidence Grade:** F
- **PIS:** 0.3/100
- **Onset Delay:** 1 day(s)
- **Optimal Value:** 4283.5 IU

---

## Detailed Analysis Reports

# Analysis: Vitamin D Supplementation → Overall Mood

## Summary

A daily average of **4500 IU Vitamin D Supplementation** is associated with a **8.5% improvement** in Overall Mood.

## Key Findings

- **Optimal Daily Value:** 4500 IU (practical recommendation)
- **Outcome Change:** Overall Mood is 8.5% higher on treatment days vs baseline
- **Correlation:** r = 0.43 (moderate positive)
- **Evidence Grade:** D (Weak evidence)
- **Predictor Impact Score:** 5.4/100

## Causality Assessment

- Forward Pearson (predictor → outcome): 0.43
- Reverse Pearson (outcome → predictor): 0.08
- Causal Direction Score (forward − reverse): 0.36 (strong forward causation — predictor drives outcome)
- Bradford Hill Score: 5.0/9
- p-value: < 0.001

## Optimal Values

- High Vitamin D Supplementation days (avg 4747.71 IU): Overall Mood = 7.05 1-10
- Low Vitamin D Supplementation days (avg 2838.16 IU): Overall Mood = 6.50 1-10
- Practical recommendation: **Target: 4500 IU Vitamin D Supplementation daily**

## Data Quality

- Pairs analyzed: 178
- Date range: 2025-06-01 to 2025-11-28
- Evidence grade: D
- Data quality: PASS


---

# Analysis: Sleep Duration → Overall Mood

## Summary

A daily average of **8 hours Sleep Duration** is associated with a **7.5% improvement** in Overall Mood.

## Key Findings

- **Optimal Daily Value:** 8 hours (practical recommendation)
- **Outcome Change:** Overall Mood is 7.5% higher on treatment days vs baseline
- **Correlation:** r = 0.43 (moderate positive)
- **Evidence Grade:** F (Insufficient evidence)
- **Predictor Impact Score:** 4.9/100

## Causality Assessment

- Forward Pearson (predictor → outcome): 0.43
- Reverse Pearson (outcome → predictor): 0.09
- Causal Direction Score (forward − reverse): 0.34 (strong forward causation — predictor drives outcome)
- Bradford Hill Score: 5.1/9
- p-value: < 0.001

## Optimal Values

- High Sleep Duration days (avg 7.66 hours): Overall Mood = 7.10 1-10
- Low Sleep Duration days (avg 6.79 hours): Overall Mood = 6.60 1-10
- Practical recommendation: **Target: 8 hours Sleep Duration daily**

## Data Quality

- Pairs analyzed: 180
- Date range: 2025-06-01 to 2025-11-28
- Evidence grade: F
- Data quality: PASS


---

# Analysis: Coffee Intake → Sleep Duration

## Summary

A daily average of **3 cups Coffee Intake** is associated with a **2.8% worsening** in Sleep Duration.

## Key Findings

- **Optimal Daily Value:** 3 cups (practical recommendation)
- **Outcome Change:** Sleep Duration is 2.8% lower on treatment days vs baseline
- **Correlation:** r = -0.25 (weak negative)
- **Evidence Grade:** F (Insufficient evidence)
- **Predictor Impact Score:** 1.7/100

## Causality Assessment

- Forward Pearson (predictor → outcome): -0.25
- Reverse Pearson (outcome → predictor): -0.11
- Causal Direction Score (forward − reverse): -0.13 (weak forward causation)
- Bradford Hill Score: 4.7/9
- p-value: < 0.001

## Optimal Values

- High Coffee Intake days (avg 3.37 cups): Sleep Duration = 7.08 hours
- Low Coffee Intake days (avg 1.61 cups): Sleep Duration = 7.29 hours
- Practical recommendation: **Target: 3 cups Coffee Intake daily**

## Data Quality

- Pairs analyzed: 180
- Date range: 2025-06-01 to 2025-11-27
- Evidence grade: F
- Data quality: PASS


---

# Analysis: Vitamin D Supplementation → Sleep Duration

## Summary

A daily average of **4500 IU Vitamin D Supplementation** is associated with a **1.1% improvement** in Sleep Duration.

## Key Findings

- **Optimal Daily Value:** 4500 IU (practical recommendation)
- **Outcome Change:** Sleep Duration is 1.1% higher on treatment days vs baseline
- **Correlation:** r = 0.11 (very weak positive)
- **Evidence Grade:** F (Insufficient evidence)
- **Predictor Impact Score:** 0.3/100

## Causality Assessment

- Forward Pearson (predictor → outcome): 0.11
- Reverse Pearson (outcome → predictor): -0.07
- Causal Direction Score (forward − reverse): 0.19 (no clear directionality)
- Bradford Hill Score: 4.0/9
- p-value: 0.1273

## Optimal Values

- High Vitamin D Supplementation days (avg 5000.00 IU): Sleep Duration = 7.23 hours
- Low Vitamin D Supplementation days (avg 2697.37 IU): Sleep Duration = 7.15 hours
- Practical recommendation: **Target: 4500 IU Vitamin D Supplementation daily**

## Data Quality

- Pairs analyzed: 179
- Date range: 2025-06-01 to 2025-11-27
- Evidence grade: F
- Data quality: PASS


---

## Recommendations

- ⚠️ **Vitamin D → Mood:** Insufficient evidence — need more data points
- ⚠️ **Sleep → Mood:** Insufficient evidence — need more data points
- ⚠️ **Coffee → Sleep:** Insufficient evidence — need more data points
- ⚠️ **Vitamin D → Sleep:** Insufficient evidence — need more data points

## Data Quality Notes

| Relationship | Pairs | Quality | Predictor Variance | Outcome Variance |
|-------------|------:|:-------:|:------------------:|:----------------:|
| Vitamin D → Mood | 178 | ✅ PASS | ✅ (72 changes) | ✅ (169 changes) |
| Sleep → Mood | 180 | ✅ PASS | ✅ (170 changes) | ✅ (171 changes) |
| Coffee → Sleep | 180 | ✅ PASS | ✅ (176 changes) | ✅ (170 changes) |
| Vitamin D → Sleep | 179 | ✅ PASS | ✅ (76 changes) | ✅ (169 changes) |

## Methodology

This analysis uses the **Predictor Impact Score (PIS)** pipeline which combines:

1. **Temporal Alignment** — Aligns predictor and outcome series accounting for onset delay and duration of action
2. **Forward & Reverse Correlation** — Establishes directionality (predictor drives outcome, not vice versa)
3. **Bradford Hill Criteria** — Scores 9 epidemiological criteria for causation
4. **Baseline vs Follow-up** — Compares outcome when predictor is below vs above mean
5. **Optimal Value Analysis** — Identifies the predictor dose associated with best outcomes
6. **Evidence Grading** — Assigns A/B/C/D/F grade based on aggregate evidence strength

---

*Generated by `@optomitron/examples` golden path demo using `@optomitron/optimizer`.*