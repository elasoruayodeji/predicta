// ============================================================
// Valuation Workbench Component
// ============================================================
import React, { useState } from 'react';
import { calculateDCF, calculateDDM, calculateMultiples, DCFInputs, DDMInputs, MultiplesInputs } from '../../engine/valuation';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { Button, MetricCard } from '../common';
import { Calculator, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

interface ValuationWorkbenchProps {
  symbol?: string;
  currentPrice?: number;
}

export function ValuationWorkbench({ symbol, currentPrice = 0 }: ValuationWorkbenchProps) {
  const [activeModel, setActiveModel] = useState<'dcf' | 'ddm' | 'multiples'>('dcf');
  
  // DCF inputs
  const [dcfInputs, setDcfInputs] = useState<DCFInputs>({
    currentRevenue: 1000000000,
    currentFCF: 100000000,
    revenueGrowthRate: 10,
    fcfMargin: 10,
    projectionYears: 5,
    terminalGrowthRate: 3,
    wacc: 12,
    sharesOutstanding: 1000000000,
    currentPrice: currentPrice || 100,
  });
  
  // DDM inputs
  const [ddmInputs, setDdmInputs] = useState<DDMInputs>({
    currentDividend: 5,
    dividendGrowthRate: 5,
    requiredReturn: 12,
    currentPrice: currentPrice || 100,
  });
  
  // Multiples inputs
  const [multiplesInputs, setMultiplesInputs] = useState<MultiplesInputs>({
    eps: 10,
    bookValuePerShare: 50,
    revenuePerShare: 100,
    peerPE: 15,
    peerPB: 2,
    peerPS: 1.5,
    currentPrice: currentPrice || 100,
    companyPE: 10,
    companyPB: 2,
    companyPS: 1,
  });

  // Calculate valuations
  const dcfResult = calculateDCF(dcfInputs);
  const ddmResult = calculateDDM(ddmInputs);
  const multiplesResult = calculateMultiples(multiplesInputs);

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'undervalued': return 'text-[var(--color-positive)] bg-[var(--color-positive-dim)]';
      case 'overvalued': return 'text-[var(--color-negative)] bg-[var(--color-negative-dim)]';
      default: return 'text-[var(--color-warning)] bg-[var(--color-warning-dim)]';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Model Selection */}
      <div className="flex gap-2">
        <Button
          variant={activeModel === 'dcf' ? 'primary' : 'secondary'}
          onClick={() => setActiveModel('dcf')}
        >
          <Calculator size={16} />
          DCF Valuation
        </Button>
        <Button
          variant={activeModel === 'ddm' ? 'primary' : 'secondary'}
          onClick={() => setActiveModel('ddm')}
        >
          <DollarSign size={16} />
          Dividend Discount
        </Button>
        <Button
          variant={activeModel === 'multiples' ? 'primary' : 'secondary'}
          onClick={() => setActiveModel('multiples')}
        >
          <BarChart3 size={16} />
          Multiples
        </Button>
      </div>

      {/* DCF Model */}
      {activeModel === 'dcf' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">DCF Inputs</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Current Revenue (₦)</label>
                <input
                  type="number"
                  value={dcfInputs.currentRevenue}
                  onChange={e => setDcfInputs({ ...dcfInputs, currentRevenue: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Current Free Cash Flow (₦)</label>
                <input
                  type="number"
                  value={dcfInputs.currentFCF}
                  onChange={e => setDcfInputs({ ...dcfInputs, currentFCF: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Revenue Growth Rate (%)</label>
                <input
                  type="number"
                  value={dcfInputs.revenueGrowthRate}
                  onChange={e => setDcfInputs({ ...dcfInputs, revenueGrowthRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">FCF Margin (%)</label>
                <input
                  type="number"
                  value={dcfInputs.fcfMargin}
                  onChange={e => setDcfInputs({ ...dcfInputs, fcfMargin: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Projection Years</label>
                <input
                  type="number"
                  value={dcfInputs.projectionYears}
                  onChange={e => setDcfInputs({ ...dcfInputs, projectionYears: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Terminal Growth Rate (%)</label>
                <input
                  type="number"
                  value={dcfInputs.terminalGrowthRate}
                  onChange={e => setDcfInputs({ ...dcfInputs, terminalGrowthRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">WACC (%)</label>
                <input
                  type="number"
                  value={dcfInputs.wacc}
                  onChange={e => setDcfInputs({ ...dcfInputs, wacc: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Shares Outstanding</label>
                <input
                  type="number"
                  value={dcfInputs.sharesOutstanding}
                  onChange={e => setDcfInputs({ ...dcfInputs, sharesOutstanding: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Valuation Result</h3>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  label="Intrinsic Value"
                  value={formatPrice(dcfResult.intrinsicValuePerShare, 'NGN')}
                  icon={<TrendingUp size={18} className="text-[var(--color-accent-blue)]" />}
                />
                <MetricCard
                  label="Current Price"
                  value={formatPrice(dcfResult.currentPrice, 'NGN')}
                />
                <MetricCard
                  label="Upside/Downside"
                  value={formatPercent(dcfResult.upside / 100)}
                  variant={dcfResult.upside >= 0 ? 'positive' : 'negative'}
                />
                <div className={`p-4 rounded-xl border ${getVerdictColor(dcfResult.verdict)}`}>
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">Verdict</p>
                  <p className="text-lg font-bold capitalize">{dcfResult.verdict.replace('_', ' ')}</p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Breakdown</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">PV of Projections:</span>
                  <span className="font-mono">{formatPrice(dcfResult.pvOfProjections, 'NGN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">PV of Terminal Value:</span>
                  <span className="font-mono">{formatPrice(dcfResult.pvOfTerminalValue, 'NGN')}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--color-border-primary)] pt-2">
                  <span className="text-[var(--color-text-primary)] font-semibold">Enterprise Value:</span>
                  <span className="font-mono font-semibold">{formatPrice(dcfResult.enterpriseValue, 'NGN')}</span>
                </div>
              </div>
            </div>

            {/* Sensitivity Table */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Sensitivity Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-[var(--color-text-muted)]">WACC \ TGR</th>
                      {dcfResult.sensitivityTable.terminalGrowth.map(tg => (
                        <th key={tg} className="p-2 text-right text-[var(--color-text-muted)]">{tg}%</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dcfResult.sensitivityTable.values.map((row, i) => (
                      <tr key={i}>
                        <td className="p-2 text-[var(--color-text-muted)]">{dcfResult.sensitivityTable.wacc[i]}%</td>
                        {row.map((value, j) => (
                          <td key={j} className="p-2 text-right font-mono">
                            {value > 0 ? formatPrice(value, 'NGN') : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DDM Model */}
      {activeModel === 'ddm' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">DDM Inputs</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Current Dividend per Share (₦)</label>
                <input
                  type="number"
                  value={ddmInputs.currentDividend}
                  onChange={e => setDdmInputs({ ...ddmInputs, currentDividend: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Dividend Growth Rate (%)</label>
                <input
                  type="number"
                  value={ddmInputs.dividendGrowthRate}
                  onChange={e => setDdmInputs({ ...ddmInputs, dividendGrowthRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Required Return (%)</label>
                <input
                  type="number"
                  value={ddmInputs.requiredReturn}
                  onChange={e => setDdmInputs({ ...ddmInputs, requiredReturn: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Current Price (₦)</label>
                <input
                  type="number"
                  value={ddmInputs.currentPrice}
                  onChange={e => setDdmInputs({ ...ddmInputs, currentPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Valuation Result</h3>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  label="Intrinsic Value"
                  value={formatPrice(ddmResult.intrinsicValue, 'NGN')}
                  icon={<DollarSign size={18} className="text-[var(--color-accent-blue)]" />}
                />
                <MetricCard
                  label="Current Price"
                  value={formatPrice(ddmResult.currentPrice, 'NGN')}
                />
                <MetricCard
                  label="Upside/Downside"
                  value={formatPercent(ddmResult.upside / 100)}
                  variant={ddmResult.upside >= 0 ? 'positive' : 'negative'}
                />
                <MetricCard
                  label="Dividend Yield"
                  value={formatPercent(ddmResult.dividendYield / 100)}
                  variant="positive"
                />
              </div>
              <div className={`mt-4 p-4 rounded-xl border ${getVerdictColor(ddmResult.verdict)}`}>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">Verdict</p>
                <p className="text-lg font-bold capitalize">{ddmResult.verdict.replace('_', ' ')}</p>
                <p className="text-xs mt-2">Payout Sustainability: <span className="font-semibold">{ddmResult.payoutSustainability}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multiples Model */}
      {activeModel === 'multiples' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Multiples Inputs</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">EPS (₦)</label>
                <input
                  type="number"
                  value={multiplesInputs.eps}
                  onChange={e => setMultiplesInputs({ ...multiplesInputs, eps: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Book Value per Share (₦)</label>
                <input
                  type="number"
                  value={multiplesInputs.bookValuePerShare}
                  onChange={e => setMultiplesInputs({ ...multiplesInputs, bookValuePerShare: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Revenue per Share (₦)</label>
                <input
                  type="number"
                  value={multiplesInputs.revenuePerShare}
                  onChange={e => setMultiplesInputs({ ...multiplesInputs, revenuePerShare: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
              <div className="border-t border-[var(--color-border-primary)] pt-3">
                <p className="text-xs text-[var(--color-text-muted)] mb-2">Peer Multiples</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">P/E</label>
                    <input
                      type="number"
                      value={multiplesInputs.peerPE}
                      onChange={e => setMultiplesInputs({ ...multiplesInputs, peerPE: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">P/B</label>
                    <input
                      type="number"
                      value={multiplesInputs.peerPB}
                      onChange={e => setMultiplesInputs({ ...multiplesInputs, peerPB: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">P/S</label>
                    <input
                      type="number"
                      value={multiplesInputs.peerPS}
                      onChange={e => setMultiplesInputs({ ...multiplesInputs, peerPS: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Valuation Result</h3>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  label="P/E Valuation"
                  value={formatPrice(multiplesResult.peValuation, 'NGN')}
                />
                <MetricCard
                  label="P/B Valuation"
                  value={formatPrice(multiplesResult.pbValuation, 'NGN')}
                />
                <MetricCard
                  label="P/S Valuation"
                  value={formatPrice(multiplesResult.psValuation, 'NGN')}
                />
                <MetricCard
                  label="Average Valuation"
                  value={formatPrice(multiplesResult.averageValuation, 'NGN')}
                  icon={<TrendingUp size={18} className="text-[var(--color-accent-blue)]" />}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <MetricCard
                  label="Current Price"
                  value={formatPrice(multiplesResult.currentPrice, 'NGN')}
                />
                <MetricCard
                  label="Upside/Downside"
                  value={formatPercent(multiplesResult.upside / 100)}
                  variant={multiplesResult.upside >= 0 ? 'positive' : 'negative'}
                />
              </div>
              <div className={`mt-4 p-4 rounded-xl border ${getVerdictColor(multiplesResult.verdict)}`}>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">Verdict</p>
                <p className="text-lg font-bold capitalize">{multiplesResult.verdict.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Discount/Premium to Peers</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--color-text-muted)]">P/E Multiple</span>
                  <span className={`text-sm font-mono ${multiplesResult.peDiscount >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
                    {multiplesResult.peDiscount >= 0 ? '+' : ''}{multiplesResult.peDiscount.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--color-text-muted)]">P/B Multiple</span>
                  <span className={`text-sm font-mono ${multiplesResult.pbDiscount >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
                    {multiplesResult.pbDiscount >= 0 ? '+' : ''}{multiplesResult.pbDiscount.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--color-text-muted)]">P/S Multiple</span>
                  <span className={`text-sm font-mono ${multiplesResult.psDiscount >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
                    {multiplesResult.psDiscount >= 0 ? '+' : ''}{multiplesResult.psDiscount.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
