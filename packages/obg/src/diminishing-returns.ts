/**
 * Diminishing Returns Modeling for Optimal Spending Levels
 * 
 * Estimates the "knee" of the spending-outcome curve where
 * marginal returns equal opportunity cost.
 * 
 * @see https://obg.warondisease.org/#sec-diminishing-returns
 */

export interface SpendingOutcomePoint {
  spending: number;      // Spending level (USD)
  outcome: number;       // Outcome metric value
  jurisdiction: string;  // Country/state code
  year: number;
}

export interface DiminishingReturnsModel {
  type: 'log' | 'saturation';
  alpha: number;      // Intercept
  beta: number;       // Coefficient
  gamma?: number;     // Half-saturation constant (for saturation model)
  r2: number;         // Model fit
  n: number;          // Number of observations
}

export interface OSLEstimationResult {
  oslUsd: number;
  oslPerCapita?: number;
  confidenceInterval: [number, number];
  model: DiminishingReturnsModel;
  marginalReturnAtOSL: number;
}

/**
 * Fit a log-linear diminishing returns model
 * Outcome = α + β × log(Spending) + ε
 */
export function fitLogModel(
  data: SpendingOutcomePoint[]
): DiminishingReturnsModel {
  const n = data.length;

  // Filter out non-positive spending (can't take log of 0 or negative)
  const validData = data.filter(d => d.spending > 0);
  if (validData.length < 2) {
    return { alpha: 0, beta: 0, rSquared: 0, predict: () => 0 };
  }
  
  // Transform spending to log
  const logSpending = validData.map(d => Math.log(d.spending));
  const outcomes = validData.map(d => d.outcome);
  const validN = validData.length;
  
  // Check for constant inputs (all same spending or all same outcome)
  const uniqueLog = new Set(logSpending.map(v => v.toFixed(10)));
  if (uniqueLog.size < 2) {
    const meanOutcome = outcomes.reduce((a, b) => a + b, 0) / validN;
    return { alpha: meanOutcome, beta: 0, rSquared: 0, predict: () => meanOutcome };
  }
  
  // Simple OLS
  const meanLogS = logSpending.reduce((a, b) => a + b, 0) / validN;
  const meanY = outcomes.reduce((a, b) => a + b, 0) / validN;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    const ls = logSpending[i]!;
    const oi = outcomes[i]!;
    numerator += (ls - meanLogS) * (oi - meanY);
    denominator += (ls - meanLogS) ** 2;
  }
  
  const beta = numerator / denominator;
  const alpha = meanY - beta * meanLogS;
  
  // Calculate R²
  const predictions = logSpending.map(ls => alpha + beta * ls);
  const ssRes = outcomes.reduce((sum, y, i) => sum + (y - predictions[i]!) ** 2, 0);
  const ssTot = outcomes.reduce((sum, y) => sum + (y - meanY) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  
  return { type: 'log', alpha, beta, r2, n };
}

/**
 * Fit a saturation (Michaelis-Menten style) model
 * Outcome = α + β × (Spending / (Spending + γ))
 */
export function fitSaturationModel(
  data: SpendingOutcomePoint[],
  initialGamma?: number
): DiminishingReturnsModel {
  // Use median spending as initial gamma estimate
  const sortedSpending = [...data.map(d => d.spending)].sort((a, b) => a - b);
  const gamma = initialGamma ?? sortedSpending[Math.floor(sortedSpending.length / 2)]!;
  
  const n = data.length;
  const outcomes = data.map(d => d.outcome);
  
  // Transform: x_i = S_i / (S_i + γ)
  const transformed = data.map(d => d.spending / (d.spending + gamma));
  
  // OLS on transformed data
  const meanX = transformed.reduce((a, b) => a + b, 0) / n;
  const meanY = outcomes.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    const ti = transformed[i]!;
    const oi = outcomes[i]!;
    numerator += (ti - meanX) * (oi - meanY);
    denominator += (ti - meanX) ** 2;
  }
  
  const beta = numerator / denominator;
  const alpha = meanY - beta * meanX;
  
  // Calculate R²
  const predictions = transformed.map(x => alpha + beta * x);
  const ssRes = outcomes.reduce((sum, y, i) => sum + (y - predictions[i]!) ** 2, 0);
  const ssTot = outcomes.reduce((sum, y) => sum + (y - meanY) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  
  return { type: 'saturation', alpha, beta, gamma, r2, n };
}

/**
 * Calculate marginal return at a given spending level
 * For log model: dOutcome/dSpending = β/Spending
 * For saturation: dOutcome/dSpending = β×γ/(S+γ)²
 */
export function marginalReturn(
  spending: number,
  model: DiminishingReturnsModel
): number {
  if (model.type === 'log') {
    return model.beta / spending;
  } else {
    const gamma = model.gamma!;
    return (model.beta * gamma) / (spending + gamma) ** 2;
  }
}

/**
 * Find Optimal Spending Level where marginal return = opportunity cost
 */
export function findOSL(
  model: DiminishingReturnsModel,
  opportunityCost: number = 0.03 // Default 3% discount rate
): number {
  if (model.type === 'log') {
    // β/S = r → S = β/r
    return model.beta / opportunityCost;
  } else {
    // β×γ/(S+γ)² = r → solve quadratic
    const gamma = model.gamma!;
    const a = opportunityCost;
    const b = 2 * opportunityCost * gamma;
    const c = opportunityCost * gamma ** 2 - model.beta * gamma;
    
    // Quadratic formula, take positive root
    const discriminant = b ** 2 - 4 * a * c;
    if (discriminant < 0) {
      // No real solution, return high spending (flat returns)
      return model.gamma! * 10;
    }
    return (-b + Math.sqrt(discriminant)) / (2 * a);
  }
}

/**
 * Estimate OSL with confidence interval via bootstrap
 */
export function estimateOSL(
  data: SpendingOutcomePoint[],
  opportunityCost: number = 0.03,
  bootstrapSamples: number = 1000
): OSLEstimationResult {
  // Fit both models, use better fit
  const logModel = fitLogModel(data);
  const satModel = fitSaturationModel(data);
  const model = logModel.r2 > satModel.r2 ? logModel : satModel;
  
  const oslUsd = findOSL(model, opportunityCost);
  const marginalReturnAtOSL = marginalReturn(oslUsd, model);
  
  // Bootstrap for CI
  const bootstrapOSLs: number[] = [];
  for (let i = 0; i < bootstrapSamples; i++) {
    const sample = Array.from({ length: data.length }, () => 
      data[Math.floor(Math.random() * data.length)]!
    );
    const bootModel = model.type === 'log' ? fitLogModel(sample) : fitSaturationModel(sample);
    bootstrapOSLs.push(findOSL(bootModel, opportunityCost));
  }
  
  bootstrapOSLs.sort((a, b) => a - b);
  const ciLow = bootstrapOSLs[Math.floor(bootstrapSamples * 0.025)] ?? oslUsd;
  const ciHigh = bootstrapOSLs[Math.floor(bootstrapSamples * 0.975)] ?? oslUsd;
  
  return {
    oslUsd,
    confidenceInterval: [ciLow, ciHigh],
    model,
    marginalReturnAtOSL,
  };
}
