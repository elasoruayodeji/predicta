// ============================================================
// Forecast Orchestration Engine
// ============================================================
import { PriceRecord, ForecastResult, ForecastHorizon, ModelType, ModelComparison } from '../types';
import { generateForecast, MODEL_DEFINITIONS, calculateMetrics } from './models';
import { walkForwardBacktest, compareModels } from './evaluation';

export function runForecast(
  prices: PriceRecord[],
  horizon: ForecastHorizon,
  modelId: ModelType,
  trainingWindowDays?: number
): ForecastResult {
  const modelDef = MODEL_DEFINITIONS.find(m => m.id === modelId);
  if (!modelDef) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  if (!modelDef.supportedHorizons.includes(horizon)) {
    throw new Error(`Model ${modelId} does not support horizon ${horizon}`);
  }

  const effectivePrices = trainingWindowDays
    ? prices.slice(-trainingWindowDays)
    : prices;

  if (effectivePrices.length < modelDef.minDataPoints) {
    return {
      modelId,
      modelName: modelDef.name,
      horizon,
      forecastDate: new Date().toISOString().split('T')[0],
      lastObservedPrice: effectivePrices[effectivePrices.length - 1]?.close ?? 0,
      lastObservedDate: effectivePrices[effectivePrices.length - 1]?.date ?? '',
      estimatedReturn: 0,
      estimatedPrice: effectivePrices[effectivePrices.length - 1]?.close ?? 0,
      lowerBound: 0,
      upperBound: 0,
      confidenceLevel: 0.95,
      metrics: { mae: 0, rmse: 0, directionalAccuracy: 0, baselineImprovement: 0, predictionIntervalCoverage: 0, trainingTimeMs: 0 },
      status: 'insufficient_data',
      warnings: [`Insufficient data: ${effectivePrices.length} records available, ${modelDef.minDataPoints} required`],
      trainedAt: new Date().toISOString(),
      trainingPeriod: {
        start: effectivePrices[0]?.date ?? '',
        end: effectivePrices[effectivePrices.length - 1]?.date ?? '',
      },
    };
  }

  const result = generateForecast(modelId, effectivePrices, horizon);
  const lastPrice = effectivePrices[effectivePrices.length - 1].adjustedClose ?? effectivePrices[effectivePrices.length - 1].close;
  const estimatedPrice = lastPrice * (1 + result.prediction);

  // Calculate uncertainty bounds based on historical residual std
  const residualStd = result.metrics.rmse;
  const zScore = 1.96; // 95% confidence
  const lowerBound = lastPrice * (1 + result.prediction - zScore * residualStd);
  const upperBound = lastPrice * (1 + result.prediction + zScore * residualStd);

  // Determine status
  let status: ForecastResult['status'] = 'valid';
  const warnings: string[] = [];

  if (result.metrics.directionalAccuracy < 0.52) {
    warnings.push('Directional accuracy below 52% — model may not reliably predict direction');
  }
  if (result.metrics.baselineImprovement < 0) {
    warnings.push('Model underperforms historical average baseline on validation data');
    status = 'experimental';
  }
  if (effectivePrices.length < 252) {
    warnings.push('Less than one year of data — forecasts are highly uncertain');
    status = 'experimental';
  }
  if (horizon >= 20) {
    warnings.push('Longer forecast horizons carry substantially more uncertainty');
  }
  if (horizon >= 60) {
    warnings.push('60-session forecasts are highly uncertain and should not be used for trading decisions');
  }

  return {
    modelId,
    modelName: modelDef.name,
    horizon,
    forecastDate: new Date().toISOString().split('T')[0],
    lastObservedPrice: lastPrice,
    lastObservedDate: effectivePrices[effectivePrices.length - 1].date,
    estimatedReturn: result.prediction,
    estimatedPrice,
    lowerBound: Math.max(0, lowerBound),
    upperBound,
    confidenceLevel: 0.95,
    metrics: result.metrics,
    status,
    warnings,
    trainedAt: new Date().toISOString(),
    trainingPeriod: {
      start: effectivePrices[0].date,
      end: effectivePrices[effectivePrices.length - 1].date,
    },
  };
}

export function runModelComparison(
  prices: PriceRecord[],
  horizon: ForecastHorizon,
  trainingWindowDays: number = 504
): ModelComparison {
  const modelIds: ModelType[] = ['persistence', 'historical_average', 'linear_regression', 'ridge_regression', 'gradient_boosting'];
  
  const { results, testDates } = compareModels(prices, modelIds, horizon, trainingWindowDays);

  const models = results.map(r => {
    const def = MODEL_DEFINITIONS.find(m => m.id === r.modelId);
    let status: 'valid' | 'experimental' | 'insufficient_data' | 'failed_validation' = 'valid';
    
    if (r.folds.length === 0) {
      status = 'insufficient_data';
    } else if (r.aggregateMetrics.directionalAccuracy < 0.52) {
      status = 'experimental';
    }

    return {
      modelId: r.modelId,
      modelName: def?.name ?? r.modelId,
      metrics: r.aggregateMetrics,
      status,
    };
  });

  return {
    models,
    evaluationPeriod: results.length > 0 && results[0].folds.length > 0
      ? { start: results[0].folds[0].testStart, end: results[0].folds[results[0].folds.length - 1].testEnd }
      : { start: '', end: '' },
    baselineModelId: 'historical_average',
    testDates,
  };
}
