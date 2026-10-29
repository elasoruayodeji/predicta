// ============================================================
// Walk-Forward Backtesting Engine
// ============================================================
import { PriceRecord, BacktestResult, BacktestFold, ModelMetrics, ModelType } from '../types';
import { buildFeatures, standardizeFeatures } from './features';
import { createModel, calculateMetrics } from './models';

export interface WalkForwardConfig {
  modelId: ModelType;
  horizon: number;
  trainingWindowDays: number;
  testWindowDays: number;
  stepSize: number;
}

/**
 * Walk-forward backtesting: simulates how the model would have performed
 * if it had been deployed in the past. Uses expanding or rolling windows.
 * CRITICAL: No future data leaks into training.
 */
export function walkForwardBacktest(
  prices: PriceRecord[],
  config: WalkForwardConfig
): BacktestResult {
  const { modelId, horizon, trainingWindowDays, stepSize } = config;
  const folds: BacktestFold[] = [];
  const allPredictions: number[] = [];
  const allActuals: number[] = [];
  const allBaselinePredictions: number[] = [];
  const testDates: string[] = [];

  // Minimum data needed
  const minTrainingData = Math.max(trainingWindowDays, 100);
  if (prices.length < minTrainingData + horizon + 10) {
    return {
      modelId,
      modelName: modelId,
      folds: [],
      aggregateMetrics: { mae: 0, rmse: 0, directionalAccuracy: 0, baselineImprovement: 0, predictionIntervalCoverage: 0, trainingTimeMs: 0 },
      evaluationWindow: { start: '', end: '' },
      trainingWindowDays,
    };
  }

  let foldIndex = 0;
  // Start testing from after minimum training period
  let testStart = minTrainingData;

  while (testStart + horizon < prices.length) {
    const trainingEnd = testStart;
    const trainingStart = Math.max(0, trainingEnd - trainingWindowDays);
    const testEnd = Math.min(testStart + stepSize, prices.length - horizon);

    if (testEnd <= testStart) break;

    const trainingPrices = prices.slice(trainingStart, trainingEnd);
    const testPrices = prices.slice(testStart, testEnd + horizon);

    if (trainingPrices.length < 50) {
      testStart += stepSize;
      continue;
    }

    // Build features for training data
    const trainMatrix = buildFeatures(trainingPrices, horizon);
    if (trainMatrix.features.length < 30) {
      testStart += stepSize;
      continue;
    }

    // Standardize using training data only
    const { train: stdTrain } = standardizeFeatures(trainMatrix.features);

    // Train model
    const model = createModel(modelId, stdTrain, trainMatrix.targets);
    const baselineModel = createModel('historical_average', stdTrain, trainMatrix.targets);

    // Build features for test period
    const testMatrix = buildFeatures(testPrices, horizon);
    if (testMatrix.features.length === 0) {
      testStart += stepSize;
      continue;
    }

    // Standardize test features using training statistics
    const { test: stdTest } = standardizeFeatures(trainMatrix.features, testMatrix.features);

    // Generate predictions
    if (stdTest) {
      for (let i = 0; i < stdTest.length; i++) {
        const pred = model.predict(stdTest[i]);
        const baselinePred = baselineModel.predict(stdTest[i]);
        allPredictions.push(pred);
        allActuals.push(testMatrix.targets[i]);
        allBaselinePredictions.push(baselinePred);
        if (i < testMatrix.dates.length) {
          testDates.push(testMatrix.dates[i]);
        }
      }
    }

    // Record fold metrics
    const foldPreds = stdTest ? stdTest.map(f => model.predict(f)) : [];
    const foldActuals = testMatrix.targets;
    const foldBaseline = stdTest ? stdTest.map(f => baselineModel.predict(f)) : [];
    const foldMetrics = calculateMetrics(foldPreds, foldActuals, foldBaseline);

    // Use actual test dates from the feature matrix (not the raw price dates)
    const actualTestStart = testMatrix.dates.length > 0 ? testMatrix.dates[0] : testPrices[0].date;
    const actualTestEnd = testMatrix.dates.length > 0 ? testMatrix.dates[testMatrix.dates.length - 1] : testPrices[testPrices.length - 1].date;

    folds.push({
      foldIndex,
      trainingStart: trainingPrices[0].date,
      trainingEnd: trainingPrices[trainingPrices.length - 1].date,
      testStart: actualTestStart,
      testEnd: actualTestEnd,
      metrics: foldMetrics,
    });

    foldIndex++;
    testStart += stepSize;

    // Limit folds for performance
    if (foldIndex >= 12) break;
  }

  // Aggregate metrics
  const aggregateMetrics = calculateMetrics(allPredictions, allActuals, allBaselinePredictions);

  const evaluationWindow = {
    start: folds.length > 0 ? folds[0].testStart : '',
    end: folds.length > 0 ? folds[folds.length - 1].testEnd : '',
  };

  return {
    modelId,
    modelName: modelId,
    folds,
    aggregateMetrics,
    evaluationWindow,
    trainingWindowDays,
  };
}

/**
 * Compare multiple models using the same walk-forward evaluation
 */
export function compareModels(
  prices: PriceRecord[],
  modelIds: ModelType[],
  horizon: number,
  trainingWindowDays: number = 504 // ~2 years
): { results: BacktestResult[]; testDates: string[] } {
  const results: BacktestResult[] = [];
  let allTestDates: string[] = [];

  for (const modelId of modelIds) {
    const result = walkForwardBacktest(prices, {
      modelId,
      horizon,
      trainingWindowDays,
      testWindowDays: 60,
      stepSize: Math.max(5, Math.floor(horizon / 2)),
    });
    results.push(result);
    if (result.folds.length > 0 && allTestDates.length === 0) {
      allTestDates = result.folds.map(f => f.testStart);
    }
  }

  return { results, testDates: allTestDates };
}
