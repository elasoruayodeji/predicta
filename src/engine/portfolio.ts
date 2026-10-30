// ============================================================
// Portfolio Tracker Engine
// ============================================================
// Tracks holdings, transactions, and calculates performance
// ============================================================

export type TransactionType = 'buy' | 'sell' | 'dividend' | 'bonus' | 'rights';

export interface Transaction {
  id: string;
  symbol: string;
  type: TransactionType;
  date: string;
  quantity: number;
  price: number; // per share
  fees: number; // total fees (brokerage + stamp duty)
  notes?: string;
}

export interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  realizedPL: number;
  dividendIncome: number;
  weight: number; // portfolio weight %
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalUnrealizedPL: number;
  totalUnrealizedPLPercent: number;
  totalRealizedPL: number;
  totalDividendIncome: number;
  totalFees: number;
  totalReturn: number;
  totalReturnPercent: number;
  holdingsCount: number;
  topHolding: { symbol: string; weight: number } | null;
}

export interface PortfolioPerformance {
  // Time-weighted return
  twr: number;
  // Money-weighted return (simplified IRR)
  mwr: number;
  // Portfolio volatility
  volatility: number;
  // Max drawdown
  maxDrawdown: number;
  // Sharpe ratio (vs risk-free rate)
  sharpeRatio: number | null;
  // Beta vs benchmark
  beta: number | null;
}

/**
 * Calculate holdings from transaction history
 */
export function calculateHoldings(
  transactions: Transaction[],
  currentPrices: Map<string, number>
): Holding[] {
  // Group transactions by symbol
  const bySymbol = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const list = bySymbol.get(tx.symbol) || [];
    list.push(tx);
    bySymbol.set(tx.symbol, list);
  }

  const holdings: Holding[] = [];
  let totalPortfolioValue = 0;

  // First pass: calculate holdings
  for (const [symbol, txs] of bySymbol) {
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    
    let quantity = 0;
    let totalCost = 0;
    let realizedPL = 0;
    let dividendIncome = 0;
    let totalFees = 0;

    for (const tx of sorted) {
      totalFees += tx.fees;

      switch (tx.type) {
        case 'buy':
          totalCost += tx.quantity * tx.price + tx.fees;
          quantity += tx.quantity;
          break;

        case 'sell':
          const avgCost = quantity > 0 ? totalCost / quantity : 0;
          const sellProceeds = tx.quantity * tx.price - tx.fees;
          const sellCost = tx.quantity * avgCost;
          realizedPL += sellProceeds - sellCost;
          totalCost -= sellCost;
          quantity -= tx.quantity;
          break;

        case 'dividend':
          dividendIncome += tx.quantity * tx.price; // price = dividend per share
          break;

        case 'bonus':
          // Bonus shares increase quantity but don't change total cost
          quantity += tx.quantity;
          break;

        case 'rights':
          totalCost += tx.quantity * tx.price + tx.fees;
          quantity += tx.quantity;
          break;
      }
    }

    if (quantity <= 0) continue; // No active holding

    const currentPrice = currentPrices.get(symbol) || 0;
    const currentValue = quantity * currentPrice;
    const averageCost = quantity > 0 ? totalCost / quantity : 0;
    const unrealizedPL = currentValue - totalCost;
    const unrealizedPLPercent = totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0;

    totalPortfolioValue += currentValue;

    holdings.push({
      symbol,
      name: symbol, // Will be updated with actual name
      quantity,
      averageCost,
      totalCost,
      currentPrice,
      currentValue,
      unrealizedPL,
      unrealizedPLPercent,
      realizedPL,
      dividendIncome,
      weight: 0, // Calculated in second pass
    });
  }

  // Second pass: calculate weights
  for (const holding of holdings) {
    holding.weight = totalPortfolioValue > 0 
      ? (holding.currentValue / totalPortfolioValue) * 100 
      : 0;
  }

  return holdings.sort((a, b) => b.currentValue - a.currentValue);
}

/**
 * Calculate portfolio summary
 */
export function calculatePortfolioSummary(
  holdings: Holding[],
  transactions: Transaction[]
): PortfolioSummary {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalUnrealizedPL = holdings.reduce((sum, h) => sum + h.unrealizedPL, 0);
  const totalRealizedPL = holdings.reduce((sum, h) => sum + h.realizedPL, 0);
  const totalDividendIncome = holdings.reduce((sum, h) => sum + h.dividendIncome, 0);
  const totalFees = transactions.reduce((sum, t) => sum + t.fees, 0);

  const totalReturn = totalUnrealizedPL + totalRealizedPL + totalDividendIncome;
  const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
  const totalUnrealizedPLPercent = totalCost > 0 ? (totalUnrealizedPL / totalCost) * 100 : 0;

  const topHolding = holdings.length > 0 
    ? { symbol: holdings[0].symbol, weight: holdings[0].weight }
    : null;

  return {
    totalValue,
    totalCost,
    totalUnrealizedPL,
    totalUnrealizedPLPercent,
    totalRealizedPL,
    totalDividendIncome,
    totalFees,
    totalReturn,
    totalReturnPercent,
    holdingsCount: holdings.length,
    topHolding,
  };
}

/**
 * Calculate portfolio performance metrics
 * Requires historical portfolio values (daily snapshots)
 */
export function calculatePortfolioPerformance(
  portfolioValues: { date: string; value: number }[],
  benchmarkReturns?: number[]
): PortfolioPerformance {
  if (portfolioValues.length < 2) {
    return { twr: 0, mwr: 0, volatility: 0, maxDrawdown: 0, sharpeRatio: null, beta: null };
  }

  // Calculate daily returns
  const returns: number[] = [];
  for (let i = 1; i < portfolioValues.length; i++) {
    const prev = portfolioValues[i - 1].value;
    const curr = portfolioValues[i].value;
    if (prev > 0) {
      returns.push((curr / prev) - 1);
    }
  }

  if (returns.length === 0) {
    return { twr: 0, mwr: 0, volatility: 0, maxDrawdown: 0, sharpeRatio: null, beta: null };
  }

  // Time-weighted return
  const firstValue = portfolioValues[0].value;
  const lastValue = portfolioValues[portfolioValues.length - 1].value;
  const tradingDays = portfolioValues.length;
  const years = tradingDays / 252;
  const twr = years > 0 ? Math.pow(lastValue / firstValue, 1 / years) - 1 : 0;

  // Money-weighted return (simplified)
  const totalReturn = (lastValue / firstValue) - 1;
  const mwr = years > 0 ? Math.pow(1 + totalReturn, 1 / years) - 1 : 0;

  // Volatility (annualized)
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1);
  const volatility = Math.sqrt(variance) * Math.sqrt(252);

  // Max drawdown
  let peak = portfolioValues[0].value;
  let maxDrawdown = 0;
  for (const pv of portfolioValues) {
    if (pv.value > peak) peak = pv.value;
    const dd = (peak - pv.value) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Sharpe ratio (assuming 0 risk-free rate for simplicity)
  const sharpeRatio = volatility > 0 ? twr / volatility : null;

  // Beta (if benchmark provided)
  let beta: number | null = null;
  if (benchmarkReturns && benchmarkReturns.length === returns.length) {
    const benchMean = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length;
    const cov = returns.reduce((sum, r, i) => sum + (r - meanReturn) * (benchmarkReturns[i] - benchMean), 0) / returns.length;
    const benchVar = benchmarkReturns.reduce((sum, r) => sum + Math.pow(r - benchMean, 2), 0) / benchmarkReturns.length;
    beta = benchVar > 0 ? cov / benchVar : null;
  }

  return { twr, mwr, volatility, maxDrawdown, sharpeRatio, beta };
}

/**
 * Calculate sector concentration
 */
export function calculateSectorConcentration(
  holdings: Holding[],
  sectorMap: Map<string, string>
): { sector: string; value: number; weight: number }[] {
  const sectorValues = new Map<string, number>();
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);

  for (const holding of holdings) {
    const sector = sectorMap.get(holding.symbol) || 'Unknown';
    sectorValues.set(sector, (sectorValues.get(sector) || 0) + holding.currentValue);
  }

  return Array.from(sectorValues.entries())
    .map(([sector, value]) => ({
      sector,
      value,
      weight: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.weight - a.weight);
}

/**
 * Estimate portfolio liquidation time
 */
export function estimateLiquidationTime(
  holdings: Holding[],
  liquidityMetrics: Map<string, { medianDailyValue: number }>
): { symbol: string; days: number; value: number }[] {
  return holdings.map(holding => {
    const liquidity = liquidityMetrics.get(holding.symbol);
    const medianDailyValue = liquidity?.medianDailyValue || 0;
    
    // Assume we can trade 10% of median daily volume
    const tradeableDailyValue = medianDailyValue * 0.1;
    const days = tradeableDailyValue > 0 
      ? Math.ceil(holding.currentValue / tradeableDailyValue) 
      : Infinity;

    return {
      symbol: holding.symbol,
      days,
      value: holding.currentValue,
    };
  }).sort((a, b) => b.days - a.days);
}

/**
 * Import transactions from CSV
 */
export function parseTransactionCSV(content: string): { transactions: Transaction[]; errors: string[] } {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { transactions: [], errors: ['CSV must have header and at least one data row'] };
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const transactions: Transaction[] = [];
  const errors: string[] = [];

  // Find column indices
  const symbolIdx = headers.findIndex(h => h === 'symbol' || h === 'ticker');
  const typeIdx = headers.findIndex(h => h === 'type' || h === 'action');
  const dateIdx = headers.findIndex(h => h === 'date');
  const quantityIdx = headers.findIndex(h => h === 'quantity' || h === 'qty' || h === 'shares');
  const priceIdx = headers.findIndex(h => h === 'price');
  const feesIdx = headers.findIndex(h => h === 'fees' || h === 'commission' || h === 'fee');
  const notesIdx = headers.findIndex(h => h === 'notes' || h === 'note');

  if (symbolIdx === -1 || typeIdx === -1 || dateIdx === -1 || quantityIdx === -1 || priceIdx === -1) {
    return { transactions: [], errors: ['Missing required columns: symbol, type, date, quantity, price'] };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    
    try {
      const type = cols[typeIdx].toLowerCase() as TransactionType;
      if (!['buy', 'sell', 'dividend', 'bonus', 'rights'].includes(type)) {
        errors.push(`Row ${i + 1}: Invalid type "${cols[typeIdx]}"`);
        continue;
      }

      const quantity = parseFloat(cols[quantityIdx]);
      const price = parseFloat(cols[priceIdx]);
      
      if (isNaN(quantity) || isNaN(price)) {
        errors.push(`Row ${i + 1}: Invalid quantity or price`);
        continue;
      }

      transactions.push({
        id: `tx_${Date.now()}_${i}`,
        symbol: cols[symbolIdx].toUpperCase(),
        type,
        date: cols[dateIdx],
        quantity,
        price,
        fees: feesIdx >= 0 ? parseFloat(cols[feesIdx]) || 0 : 0,
        notes: notesIdx >= 0 ? cols[notesIdx] : undefined,
      });
    } catch {
      errors.push(`Row ${i + 1}: Parse error`);
    }
  }

  return { transactions, errors };
}

/**
 * Generate sample transaction CSV for testing
 */
export function generateSampleTransactionCSV(): string {
  return `Symbol,Type,Date,Quantity,Price,Fees,Notes
DANGCEM,BUY,2024-01-15,100,250.00,150.00,Initial position
DANGCEM,BUY,2024-03-20,50,260.00,100.00,Added to position
DANGCEM,DIVIDEND,2024-06-15,150,5.00,0.00,Interim dividend
GTCO,BUY,2024-02-10,500,35.50,175.00,Banking sector exposure
GTCO,SELL,2024-08-05,200,40.00,100.00,Partial profit taking
ZENITHBANK,BUY,2024-01-20,300,28.00,125.00,
ZENITHBANK,DIVIDEND,2024-07-10,300,5.00,0.00,Final dividend
MTNN,BUY,2024-04-01,200,140.00,150.00,Telecom sector`;
}
