// ============================================================
// Corporate Actions Engine
// ============================================================
// Processes corporate actions and adjusts historical prices
// Supports: dividends, stock splits, bonus issues, rights issues
// ============================================================

import { PriceRecord } from '../types';

export type CorporateActionType = 
  | 'dividend'
  | 'stock_split'
  | 'bonus_issue'
  | 'rights_issue'
  | 'consolidation';

export interface CorporateAction {
  id: string;
  symbol: string;
  type: CorporateActionType;
  announcementDate: string;
  exDate: string; // Ex-dividend/ex-rights date
  recordDate?: string;
  paymentDate?: string;
  
  // Action-specific details
  details: DividendDetails | SplitDetails | BonusDetails | RightsDetails;
  
  // Metadata
  source: string;
  verified: boolean;
  createdAt: string;
}

export interface DividendDetails {
  type: 'interim' | 'final' | 'special';
  amountPerShare: number; // in NGN
  currency: string;
  withholdingTaxRate?: number; // percentage
}

export interface SplitDetails {
  splitRatio: number; // e.g., 2 for 2:1 split (each share becomes 2)
  oldShares: number;
  newShares: number;
}

export interface BonusDetails {
  bonusRatio: number; // e.g., 1 for 1:1 bonus (1 new share for each existing)
  newShares: number;
}

export interface RightsDetails {
  rightsRatio: number; // e.g., 1 for 1:2 rights (1 new share for every 2 existing)
  rightsPrice: number; // subscription price in NGN
  currency: string;
}

/**
 * Adjust historical prices for corporate actions
 * Works backwards from most recent to oldest
 */
export function adjustPricesForCorporateActions(
  prices: PriceRecord[],
  actions: CorporateAction[]
): PriceRecord[] {
  if (actions.length === 0) return prices;

  // Sort actions by ex-date (most recent first)
  const sortedActions = [...actions].sort((a, b) => 
    new Date(b.exDate).getTime() - new Date(a.exDate).getTime()
  );

  let adjustedPrices = [...prices];

  // Apply each corporate action
  for (const action of sortedActions) {
    adjustedPrices = applyCorporateAction(adjustedPrices, action);
  }

  return adjustedPrices;
}

/**
 * Apply a single corporate action to price history
 */
function applyCorporateAction(prices: PriceRecord[], action: CorporateAction): PriceRecord[] {
  const exDate = action.exDate;
  const exDateIndex = prices.findIndex(p => p.date === exDate);

  if (exDateIndex === -1) {
    // Ex-date not found in price history - skip this action
    return prices;
  }

  switch (action.type) {
    case 'dividend':
      return adjustForDividend(prices, exDateIndex, action.details as DividendDetails);
    
    case 'stock_split':
      return adjustForSplit(prices, exDateIndex, action.details as SplitDetails);
    
    case 'bonus_issue':
      return adjustForBonus(prices, exDateIndex, action.details as BonusDetails);
    
    case 'rights_issue':
      return adjustForRights(prices, exDateIndex, action.details as RightsDetails);
    
    default:
      return prices;
  }
}

/**
 * Adjust prices for dividend
 * Reduces historical prices by dividend amount (ex-date and before)
 */
function adjustForDividend(
  prices: PriceRecord[],
  exDateIndex: number,
  details: DividendDetails
): PriceRecord[] {
  const dividend = details.amountPerShare;
  
  return prices.map((price, index) => {
    if (index < exDateIndex) {
      // Before ex-date: reduce price by dividend
      const adjustment = dividend;
      return {
        ...price,
        open: Math.max(0.01, price.open - adjustment),
        high: Math.max(0.01, price.high - adjustment),
        low: Math.max(0.01, price.low - adjustment),
        close: Math.max(0.01, price.close - adjustment),
        adjustedClose: price.adjustedClose 
          ? Math.max(0.01, price.adjustedClose - adjustment)
          : Math.max(0.01, price.close - adjustment),
      };
    }
    return price;
  });
}

/**
 * Adjust prices for stock split
 * Divides historical prices by split ratio
 */
function adjustForSplit(
  prices: PriceRecord[],
  exDateIndex: number,
  details: SplitDetails
): PriceRecord[] {
  const ratio = details.newShares / details.oldShares;
  
  return prices.map((price, index) => {
    if (index < exDateIndex) {
      // Before ex-date: divide price by split ratio
      return {
        ...price,
        open: price.open / ratio,
        high: price.high / ratio,
        low: price.low / ratio,
        close: price.close / ratio,
        adjustedClose: price.adjustedClose 
          ? price.adjustedClose / ratio
          : price.close / ratio,
      };
    }
    return price;
  });
}

/**
 * Adjust prices for bonus issue
 * Similar to split but no cash changes hands
 */
function adjustForBonus(
  prices: PriceRecord[],
  exDateIndex: number,
  details: BonusDetails
): PriceRecord[] {
  // Bonus ratio: if 1:1, each share becomes 2, so divide by 2
  const adjustmentFactor = 1 + details.bonusRatio;
  
  return prices.map((price, index) => {
    if (index < exDateIndex) {
      return {
        ...price,
        open: price.open / adjustmentFactor,
        high: price.high / adjustmentFactor,
        low: price.low / adjustmentFactor,
        close: price.close / adjustmentFactor,
        adjustedClose: price.adjustedClose 
          ? price.adjustedClose / adjustmentFactor
          : price.close / adjustmentFactor,
      };
    }
    return price;
  });
}

/**
 * Adjust prices for rights issue
 * Complex adjustment based on theoretical ex-rights price
 */
function adjustForRights(
  prices: PriceRecord[],
  exDateIndex: number,
  details: RightsDetails
): PriceRecord[] {
  // Theoretical ex-rights price (TERP) calculation
  // TERP = (Cum-rights price * oldShares + rightsPrice * newShares) / (oldShares + newShares)
  // For adjustment, we use the ratio: TERP / Cum-rights price
  
  const cumRightsPrice = prices[exDateIndex].close;
  const oldShares = details.rightsRatio; // e.g., 2 for 1:2 rights
  const newShares = 1; // Rights ratio is per new share
  const rightsPrice = details.rightsPrice;
  
  const terp = (cumRightsPrice * oldShares + rightsPrice * newShares) / (oldShares + newShares);
  const adjustmentFactor = terp / cumRightsPrice;
  
  return prices.map((price, index) => {
    if (index < exDateIndex) {
      return {
        ...price,
        open: price.open * adjustmentFactor,
        high: price.high * adjustmentFactor,
        low: price.low * adjustmentFactor,
        close: price.close * adjustmentFactor,
        adjustedClose: price.adjustedClose 
          ? price.adjustedClose * adjustmentFactor
          : price.close * adjustmentFactor,
      };
    }
    return price;
  });
}

/**
 * Calculate dividend yield from corporate actions
 */
export function calculateDividendYield(
  actions: CorporateAction[],
  currentPrice: number,
  period: 'trailing12m' | 'latest' = 'trailing12m'
): number {
  if (currentPrice <= 0) return 0;

  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const dividends = actions
    .filter(a => a.type === 'dividend')
    .filter(a => {
      const exDate = new Date(a.exDate);
      if (period === 'trailing12m') {
        return exDate >= oneYearAgo && exDate <= now;
      } else {
        // Latest dividend only
        return exDate <= now;
      }
    })
    .sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime());

  if (dividends.length === 0) return 0;

  if (period === 'latest') {
    const latestDiv = dividends[0].details as DividendDetails;
    return (latestDiv.amountPerShare / currentPrice) * 100;
  }

  // Trailing 12 months
  const totalDividends = dividends.reduce((sum, action) => {
    const details = action.details as DividendDetails;
    return sum + details.amountPerShare;
  }, 0);

  return (totalDividends / currentPrice) * 100;
}

/**
 * Get dividend history for a stock
 */
export function getDividendHistory(actions: CorporateAction[]): {
  date: string;
  type: 'interim' | 'final' | 'special';
  amount: number;
  currency: string;
  yield: number;
}[] {
  return actions
    .filter(a => a.type === 'dividend')
    .sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime())
    .map(action => {
      const details = action.details as DividendDetails;
      return {
        date: action.exDate,
        type: details.type,
        amount: details.amountPerShare,
        currency: details.currency,
        yield: 0, // Will be calculated when current price is available
      };
    });
}

/**
 * Validate corporate action data
 */
export function validateCorporateAction(action: CorporateAction): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!action.symbol) errors.push('Missing symbol');
  if (!action.type) errors.push('Missing action type');
  if (!action.exDate) errors.push('Missing ex-date');
  if (!action.announcementDate) errors.push('Missing announcement date');

  // Validate dates
  if (action.exDate && action.announcementDate) {
    const exDate = new Date(action.exDate);
    const announcementDate = new Date(action.announcementDate);
    if (exDate < announcementDate) {
      errors.push('Ex-date cannot be before announcement date');
    }
  }

  // Validate type-specific details
  if (action.type === 'dividend') {
    const details = action.details as DividendDetails;
    if (!details.amountPerShare || details.amountPerShare <= 0) {
      errors.push('Dividend amount must be positive');
    }
    if (!details.currency) {
      errors.push('Missing dividend currency');
    }
  } else if (action.type === 'stock_split') {
    const details = action.details as SplitDetails;
    if (!details.oldShares || details.oldShares <= 0) {
      errors.push('Old shares must be positive');
    }
    if (!details.newShares || details.newShares <= 0) {
      errors.push('New shares must be positive');
    }
    if (details.oldShares === details.newShares) {
      errors.push('Split ratio must change share count');
    }
  } else if (action.type === 'bonus_issue') {
    const details = action.details as BonusDetails;
    if (!details.bonusRatio || details.bonusRatio <= 0) {
      errors.push('Bonus ratio must be positive');
    }
  } else if (action.type === 'rights_issue') {
    const details = action.details as RightsDetails;
    if (!details.rightsRatio || details.rightsRatio <= 0) {
      errors.push('Rights ratio must be positive');
    }
    if (!details.rightsPrice || details.rightsPrice <= 0) {
      errors.push('Rights price must be positive');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create a sample corporate action (for testing)
 */
export function createSampleCorporateAction(
  symbol: string,
  type: CorporateActionType,
  exDate: string
): CorporateAction {
  const baseAction: CorporateAction = {
    id: `ca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    symbol,
    type,
    announcementDate: new Date(new Date(exDate).getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0],
    exDate,
    source: 'Sample Data',
    verified: false,
    createdAt: new Date().toISOString(),
    details: {} as any,
  };

  switch (type) {
    case 'dividend':
      baseAction.details = {
        type: 'final',
        amountPerShare: 0.50,
        currency: 'NGN',
      } as DividendDetails;
      break;
    
    case 'stock_split':
      baseAction.details = {
        splitRatio: 2,
        oldShares: 1,
        newShares: 2,
      } as SplitDetails;
      break;
    
    case 'bonus_issue':
      baseAction.details = {
        bonusRatio: 1,
        newShares: 1,
      } as BonusDetails;
      break;
    
    case 'rights_issue':
      baseAction.details = {
        rightsRatio: 2,
        rightsPrice: 10.00,
        currency: 'NGN',
      } as RightsDetails;
      break;
  }

  return baseAction;
}
