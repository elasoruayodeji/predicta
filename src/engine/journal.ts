// ============================================================
// Investment Journal Engine
// ============================================================
// Track investment decisions, theses, and outcomes
// ============================================================

export interface JournalEntry {
  id: string;
  symbol: string;
  date: string;
  type: 'buy' | 'sell' | 'thesis' | 'review' | 'lesson';
  
  // For buy/sell
  action?: {
    quantity: number;
    price: number;
    thesis: string;
    targetPrice?: number;
    stopLoss?: number;
    timeHorizon?: 'short' | 'medium' | 'long';
    riskLevel?: 'low' | 'medium' | 'high';
  };
  
  // For thesis/review/lesson
  content?: string;
  
  // Outcome tracking
  outcome?: {
    actualReturn?: number;
    expectedReturn?: number;
    accuracy?: 'accurate' | 'partially_accurate' | 'inaccurate';
    lessons?: string;
    reviewedAt?: string;
  };
  
  // Metadata
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalStats {
  totalEntries: number;
  buyDecisions: number;
  sellDecisions: number;
  thesisEntries: number;
  reviewedDecisions: number;
  accuracyRate: number; // % of accurate predictions
  averageReturn: number; // average return on tracked decisions
  bestDecision: { symbol: string; return: number } | null;
  worstDecision: { symbol: string; return: number } | null;
}

/**
 * Create a new journal entry
 */
export function createJournalEntry(
  symbol: string,
  type: JournalEntry['type'],
  content?: string,
  action?: JournalEntry['action']
): JournalEntry {
  const now = new Date().toISOString();
  
  return {
    id: `journal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    symbol,
    date: now.split('T')[0],
    type,
    action,
    content,
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update journal entry with outcome
 */
export function updateJournalOutcome(
  entry: JournalEntry,
  outcome: JournalEntry['outcome']
): JournalEntry {
  return {
    ...entry,
    outcome,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate journal statistics
 */
export function calculateJournalStats(entries: JournalEntry[]): JournalStats {
  const buyDecisions = entries.filter(e => e.type === 'buy' && e.action);
  const sellDecisions = entries.filter(e => e.type === 'sell' && e.action);
  const thesisEntries = entries.filter(e => e.type === 'thesis');
  const reviewedDecisions = entries.filter(e => e.outcome?.reviewedAt);
  
  // Calculate accuracy
  const accurateDecisions = reviewedDecisions.filter(e => e.outcome?.accuracy === 'accurate');
  const accuracyRate = reviewedDecisions.length > 0
    ? (accurateDecisions.length / reviewedDecisions.length) * 100
    : 0;
  
  // Calculate average return
  const returns = reviewedDecisions
    .filter(e => e.outcome?.actualReturn !== undefined)
    .map(e => e.outcome!.actualReturn!);
  
  const averageReturn = returns.length > 0
    ? returns.reduce((sum, r) => sum + r, 0) / returns.length
    : 0;
  
  // Best and worst decisions
  const decisionsWithReturns = reviewedDecisions
    .filter(e => e.outcome?.actualReturn !== undefined)
    .map(e => ({ symbol: e.symbol, return: e.outcome!.actualReturn! }));
  
  const bestDecision = decisionsWithReturns.length > 0
    ? decisionsWithReturns.reduce((best, curr) => curr.return > best.return ? curr : best)
    : null;
  
  const worstDecision = decisionsWithReturns.length > 0
    ? decisionsWithReturns.reduce((worst, curr) => curr.return < worst.return ? curr : worst)
    : null;
  
  return {
    totalEntries: entries.length,
    buyDecisions: buyDecisions.length,
    sellDecisions: sellDecisions.length,
    thesisEntries: thesisEntries.length,
    reviewedDecisions: reviewedDecisions.length,
    accuracyRate,
    averageReturn,
    bestDecision,
    worstDecision,
  };
}

/**
 * Filter journal entries
 */
export function filterJournalEntries(
  entries: JournalEntry[],
  filters: {
    symbol?: string;
    type?: JournalEntry['type'];
    tags?: string[];
    startDate?: string;
    endDate?: string;
    hasOutcome?: boolean;
  }
): JournalEntry[] {
  return entries.filter(entry => {
    if (filters.symbol && entry.symbol !== filters.symbol) return false;
    if (filters.type && entry.type !== filters.type) return false;
    if (filters.tags && filters.tags.length > 0) {
      const hasAllTags = filters.tags.every(tag => entry.tags.includes(tag));
      if (!hasAllTags) return false;
    }
    if (filters.startDate && entry.date < filters.startDate) return false;
    if (filters.endDate && entry.date > filters.endDate) return false;
    if (filters.hasOutcome !== undefined) {
      const hasOutcome = !!entry.outcome?.reviewedAt;
      if (hasOutcome !== filters.hasOutcome) return false;
    }
    return true;
  });
}

/**
 * Sort journal entries
 */
export function sortJournalEntries(
  entries: JournalEntry[],
  sortBy: 'date' | 'symbol' | 'type' | 'return' = 'date',
  order: 'asc' | 'desc' = 'desc'
): JournalEntry[] {
  return [...entries].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = a.date.localeCompare(b.date);
        break;
      case 'symbol':
        comparison = a.symbol.localeCompare(b.symbol);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'return':
        const aReturn = a.outcome?.actualReturn || 0;
        const bReturn = b.outcome?.actualReturn || 0;
        comparison = aReturn - bReturn;
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Export journal to CSV
 */
export function exportJournalToCSV(entries: JournalEntry[]): string {
  const headers = [
    'Date',
    'Symbol',
    'Type',
    'Quantity',
    'Price',
    'Thesis',
    'Target Price',
    'Stop Loss',
    'Time Horizon',
    'Risk Level',
    'Actual Return %',
    'Expected Return %',
    'Accuracy',
    'Lessons',
    'Tags',
  ];
  
  const rows = entries.map(entry => {
    const action = entry.action || ({} as NonNullable<JournalEntry['action']>);
    const outcome = entry.outcome || ({} as NonNullable<JournalEntry['outcome']>);
    
    return [
      entry.date,
      entry.symbol,
      entry.type,
      action.quantity || '',
      action.price || '',
      action.thesis || entry.content || '',
      action.targetPrice || '',
      action.stopLoss || '',
      action.timeHorizon || '',
      action.riskLevel || '',
      outcome.actualReturn !== undefined ? outcome.actualReturn.toFixed(2) : '',
      outcome.expectedReturn !== undefined ? outcome.expectedReturn.toFixed(2) : '',
      outcome.accuracy || '',
      outcome.lessons || '',
      entry.tags.join('; '),
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Import journal from CSV
 */
export function importJournalFromCSV(content: string): { entries: JournalEntry[]; errors: string[] } {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { entries: [], errors: ['CSV must have header and at least one data row'] };
  }
  
  const entries: JournalEntry[] = [];
  const errors: string[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    
    try {
      const actionData = cols[3] ? {
        quantity: parseFloat(cols[3]) || 0,
        price: parseFloat(cols[4]) || 0,
        thesis: cols[5] || '',
        targetPrice: cols[6] ? parseFloat(cols[6]) : undefined,
        stopLoss: cols[7] ? parseFloat(cols[7]) : undefined,
        timeHorizon: cols[8] as 'short' | 'medium' | 'long' | undefined,
        riskLevel: cols[9] as 'low' | 'medium' | 'high' | undefined,
      } : undefined;
      
      const entry: JournalEntry = {
        id: `journal_${Date.now()}_${i}`,
        symbol: cols[1] || '',
        date: cols[0] || new Date().toISOString().split('T')[0],
        type: (cols[2] as JournalEntry['type']) || 'thesis',
        action: actionData,
        content: cols[5],
        outcome: cols[10] ? {
          actualReturn: parseFloat(cols[10]) || undefined,
          expectedReturn: cols[11] ? parseFloat(cols[11]) : undefined,
          accuracy: cols[12] as any,
          lessons: cols[13],
          reviewedAt: new Date().toISOString(),
        } : undefined,
        tags: cols[14] ? cols[14].split(';').map(t => t.trim()) : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      entries.push(entry);
    } catch {
      errors.push(`Row ${i + 1}: Parse error`);
    }
  }
  
  return { entries, errors };
}
