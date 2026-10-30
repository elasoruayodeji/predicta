// ============================================================
// Valuation Workbench Engine
// ============================================================
// DCF, DDM, and Multiples-based valuation models
// ============================================================

export interface DCFInputs {
  // Current financials
  currentRevenue: number;
  currentFCF: number; // Free cash flow
  
  // Growth assumptions
  revenueGrowthRate: number; // % (e.g., 10 for 10%)
  fcfMargin: number; // % (FCF as % of revenue)
  
  // Projection period
  projectionYears: number;
  
  // Terminal value
  terminalGrowthRate: number; // % (perpetual growth)
  
  // Discount rate
  wacc: number; // % (weighted average cost of capital)
  
  // Shares
  sharesOutstanding: number;
  
  // Current price (for comparison)
  currentPrice: number;
}

export interface DCFResult {
  // Projections
  projectedRevenues: { year: number; revenue: number; fcf: number }[];
  
  // Valuation
  terminalValue: number;
  pvOfProjections: number;
  pvOfTerminalValue: number;
  enterpriseValue: number;
  equityValue: number;
  intrinsicValuePerShare: number;
  
  // Comparison
  currentPrice: number;
  upside: number; // %
  verdict: 'undervalued' | 'fairly_valued' | 'overvalued';
  
  // Sensitivity
  sensitivityTable: {
    wacc: number[];
    terminalGrowth: number[];
    values: number[][]; // intrinsic value per share
  };
}

export interface DDMInputs {
  currentDividend: number; // per share
  dividendGrowthRate: number; // %
  requiredReturn: number; // %
  currentPrice: number;
}

export interface DDMResult {
  intrinsicValue: number;
  currentPrice: number;
  upside: number;
  verdict: 'undervalued' | 'fairly_valued' | 'overvalued';
  dividendYield: number;
  payoutSustainability: 'high' | 'moderate' | 'low';
}

export interface MultiplesInputs {
  // Company metrics
  eps: number; // Earnings per share
  bookValuePerShare: number;
  revenuePerShare: number;
  
  // Peer multiples
  peerPE: number;
  peerPB: number;
  peerPS: number;
  
  // Current price
  currentPrice: number;
  
  // Company's own multiples
  companyPE: number;
  companyPB: number;
  companyPS: number;
}

export interface MultiplesResult {
  // Valuations
  peValuation: number;
  pbValuation: number;
  psValuation: number;
  averageValuation: number;
  
  // Current
  currentPrice: number;
  upside: number;
  verdict: 'undervalued' | 'fairly_valued' | 'overvalued';
  
  // Individual multiples comparison
  peDiscount: number; // % discount/premium to peers
  pbDiscount: number;
  psDiscount: number;
}

/**
 * Discounted Cash Flow (DCF) Valuation
 */
export function calculateDCF(inputs: DCFInputs): DCFResult {
  const {
    currentRevenue,
    currentFCF,
    revenueGrowthRate,
    fcfMargin,
    projectionYears,
    terminalGrowthRate,
    wacc,
    sharesOutstanding,
    currentPrice,
  } = inputs;

  // Project revenues and FCF
  const projectedRevenues: { year: number; revenue: number; fcf: number }[] = [];
  let revenue = currentRevenue;
  
  for (let year = 1; year <= projectionYears; year++) {
    revenue *= (1 + revenueGrowthRate / 100);
    const fcf = revenue * (fcfMargin / 100);
    projectedRevenues.push({ year, revenue, fcf });
  }

  // Calculate present value of projections
  let pvOfProjections = 0;
  for (let i = 0; i < projectedRevenues.length; i++) {
    const fcf = projectedRevenues[i].fcf;
    const discountFactor = Math.pow(1 + wacc / 100, i + 1);
    pvOfProjections += fcf / discountFactor;
  }

  // Calculate terminal value (Gordon Growth Model)
  const lastFCF = projectedRevenues[projectedRevenues.length - 1].fcf;
  const terminalValue = (lastFCF * (1 + terminalGrowthRate / 100)) / ((wacc / 100) - (terminalGrowthRate / 100));
  
  // Present value of terminal value
  const pvOfTerminalValue = terminalValue / Math.pow(1 + wacc / 100, projectionYears);

  // Enterprise value
  const enterpriseValue = pvOfProjections + pvOfTerminalValue;

  // Equity value (assuming no debt for simplicity)
  const equityValue = enterpriseValue;

  // Per share value
  const intrinsicValuePerShare = equityValue / sharesOutstanding;

  // Upside
  const upside = ((intrinsicValuePerShare / currentPrice) - 1) * 100;

  // Verdict
  let verdict: 'undervalued' | 'fairly_valued' | 'overvalued';
  if (upside > 20) verdict = 'undervalued';
  else if (upside < -20) verdict = 'overvalued';
  else verdict = 'fairly_valued';

  // Sensitivity table
  const waccRange = [wacc - 2, wacc - 1, wacc, wacc + 1, wacc + 2];
  const tgRange = [terminalGrowthRate - 1, terminalGrowthRate, terminalGrowthRate + 1];
  const sensitivityValues: number[][] = [];

  for (const tg of tgRange) {
    const row: number[] = [];
    for (const w of waccRange) {
      if (w <= tg) {
        row.push(0); // Invalid (WACC must be > terminal growth)
        continue;
      }
      
      let pv = 0;
      for (let i = 0; i < projectedRevenues.length; i++) {
        const fcf = projectedRevenues[i].fcf;
        const df = Math.pow(1 + w / 100, i + 1);
        pv += fcf / df;
      }
      
      const tv = (lastFCF * (1 + tg / 100)) / ((w / 100) - (tg / 100));
      const pvTV = tv / Math.pow(1 + w / 100, projectionYears);
      const ev = pv + pvTV;
      const ivps = ev / sharesOutstanding;
      
      row.push(ivps);
    }
    sensitivityValues.push(row);
  }

  return {
    projectedRevenues,
    terminalValue,
    pvOfProjections,
    pvOfTerminalValue,
    enterpriseValue,
    equityValue,
    intrinsicValuePerShare,
    currentPrice,
    upside,
    verdict,
    sensitivityTable: {
      wacc: waccRange,
      terminalGrowth: tgRange,
      values: sensitivityValues,
    },
  };
}

/**
 * Dividend Discount Model (DDM) - Gordon Growth Model
 */
export function calculateDDM(inputs: DDMInputs): DDMResult {
  const { currentDividend, dividendGrowthRate, requiredReturn, currentPrice } = inputs;

  // Gordon Growth Model: P = D1 / (r - g)
  const nextDividend = currentDividend * (1 + dividendGrowthRate / 100);
  const intrinsicValue = nextDividend / ((requiredReturn / 100) - (dividendGrowthRate / 100));

  // Upside
  const upside = ((intrinsicValue / currentPrice) - 1) * 100;

  // Verdict
  let verdict: 'undervalued' | 'fairly_valued' | 'overvalued';
  if (upside > 20) verdict = 'undervalued';
  else if (upside < -20) verdict = 'overvalued';
  else verdict = 'fairly_valued';

  // Dividend yield
  const dividendYield = (currentDividend / currentPrice) * 100;

  // Payout sustainability (simplified)
  let payoutSustainability: 'high' | 'moderate' | 'low';
  if (dividendGrowthRate >= requiredReturn) {
    payoutSustainability = 'low'; // Unsustainable growth
  } else if (dividendGrowthRate >= requiredReturn * 0.7) {
    payoutSustainability = 'moderate';
  } else {
    payoutSustainability = 'high';
  }

  return {
    intrinsicValue,
    currentPrice,
    upside,
    verdict,
    dividendYield,
    payoutSustainability,
  };
}

/**
 * Multiples-Based Valuation
 */
export function calculateMultiples(inputs: MultiplesInputs): MultiplesResult {
  const {
    eps,
    bookValuePerShare,
    revenuePerShare,
    peerPE,
    peerPB,
    peerPS,
    currentPrice,
    companyPE,
    companyPB,
    companyPS,
  } = inputs;

  // Peer-based valuations
  const peValuation = eps * peerPE;
  const pbValuation = bookValuePerShare * peerPB;
  const psValuation = revenuePerShare * peerPS;

  // Average valuation
  const averageValuation = (peValuation + pbValuation + psValuation) / 3;

  // Upside
  const upside = ((averageValuation / currentPrice) - 1) * 100;

  // Verdict
  let verdict: 'undervalued' | 'fairly_valued' | 'overvalued';
  if (upside > 20) verdict = 'undervalued';
  else if (upside < -20) verdict = 'overvalued';
  else verdict = 'fairly_valued';

  // Discounts/premiums to peers
  const peDiscount = ((companyPE / peerPE) - 1) * 100;
  const pbDiscount = ((companyPB / peerPB) - 1) * 100;
  const psDiscount = ((companyPS / peerPS) - 1) * 100;

  return {
    peValuation,
    pbValuation,
    psValuation,
    averageValuation,
    currentPrice,
    upside,
    verdict,
    peDiscount,
    pbDiscount,
    psDiscount,
  };
}

/**
 * Scenario Analysis (Bull/Base/Bear)
 */
export interface ScenarioInputs {
  baseInputs: DCFInputs;
  bullAdjustments: {
    revenueGrowthRate: number; // adjustment in percentage points
    fcfMargin: number; // adjustment in percentage points
    wacc: number; // adjustment in percentage points
  };
  bearAdjustments: {
    revenueGrowthRate: number;
    fcfMargin: number;
    wacc: number;
  };
}

export interface ScenarioResult {
  bull: DCFResult;
  base: DCFResult;
  bear: DCFResult;
  probabilityWeighted: number; // 25% bull, 50% base, 25% bear
}

export function calculateScenarios(inputs: ScenarioInputs): ScenarioResult {
  const { baseInputs, bullAdjustments, bearAdjustments } = inputs;

  // Base case
  const base = calculateDCF(baseInputs);

  // Bull case
  const bullInputs: DCFInputs = {
    ...baseInputs,
    revenueGrowthRate: baseInputs.revenueGrowthRate + bullAdjustments.revenueGrowthRate,
    fcfMargin: baseInputs.fcfMargin + bullAdjustments.fcfMargin,
    wacc: baseInputs.wacc + bullAdjustments.wacc,
  };
  const bull = calculateDCF(bullInputs);

  // Bear case
  const bearInputs: DCFInputs = {
    ...baseInputs,
    revenueGrowthRate: baseInputs.revenueGrowthRate + bearAdjustments.revenueGrowthRate,
    fcfMargin: baseInputs.fcfMargin + bearAdjustments.fcfMargin,
    wacc: baseInputs.wacc + bearAdjustments.wacc,
  };
  const bear = calculateDCF(bearInputs);

  // Probability-weighted value (25% bull, 50% base, 25% bear)
  const probabilityWeighted = 
    (bull.intrinsicValuePerShare * 0.25) +
    (base.intrinsicValuePerShare * 0.50) +
    (bear.intrinsicValuePerShare * 0.25);

  return { bull, base, bear, probabilityWeighted };
}
