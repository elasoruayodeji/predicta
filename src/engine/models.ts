// ============================================================
// Forecasting Models
// ============================================================
import { ModelType, ModelDefinition, ModelMetrics, PriceRecord } from '../types';
import { buildFeatures, standardizeFeatures, buildSinglePointFeatures } from './features';

export const MODEL_DEFINITIONS: ModelDefinition[] = [
  {
    id: 'persistence',
    name: 'Naive Persistence',
    description: 'Assumes next return equals zero (price stays the same). The simplest possible baseline.',
    category: 'baseline',
    supportedHorizons: [1, 5, 20, 60],
    minDataPoints: 10,
  },
  {
    id: 'historical_average',
    name: 'Historical Average Return',
    description: 'Predicts the mean historical return over the training window.',
    category: 'baseline',
    supportedHorizons: [1, 5, 20, 60],
    minDataPoints: 20,
  },
  {
    id: 'linear_regression',
    name: 'Linear Regression',
    description: 'Ordinary least squares regression on engineered features.',
    category: 'statistical',
    supportedHorizons: [1, 5, 20, 60],
    minDataPoints: 100,
  },
  {
    id: 'ridge_regression',
    name: 'Ridge Regression',
    description: 'L2-regularized linear regression to reduce overfitting.',
    category: 'statistical',
    supportedHorizons: [1, 5, 20, 60],
    minDataPoints: 100,
  },
  {
    id: 'gradient_boosting',
    name: 'Gradient Boosting (Simplified)',
    description: 'Ensemble of decision stumps for non-linear patterns.',
    category: 'machine_learning',
    supportedHorizons: [1, 5, 20, 60],
    minDataPoints: 200,
  },
];

// ============================================================
// Model Implementations
// ============================================================

/** Naive persistence: predict zero return */
export function persistenceModel(_trainFeatures: number[][], trainTargets: number[]): { predict: (features: number[]) => number } {
  return {
    predict: () => 0,
  };
}

/** Historical average return */
export function historicalAverageModel(_trainFeatures: number[][], trainTargets: number[]): { predict: (features: number[]) => number } {
  const mean = trainTargets.length > 0
    ? trainTargets.reduce((a, b) => a + b, 0) / trainTargets.length
    : 0;
  return {
    predict: () => mean,
  };
}

/** Ordinary least squares linear regression */
export function linearRegressionModel(trainFeatures: number[][], trainTargets: number[]): { predict: (features: number[]) => number; weights: number[] } {
  // X^T X w = X^T y
  const n = trainFeatures.length;
  const p = trainFeatures[0]?.length ?? 0;

  if (n === 0 || p === 0) {
    return { predict: () => 0, weights: new Array(p).fill(0) };
  }

  // Add bias term
  const X = trainFeatures.map(row => [...row, 1]);
  const XtX: number[][] = Array.from({ length: p + 1 }, () => new Array(p + 1).fill(0));
  const Xty: number[] = new Array(p + 1).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= p; j++) {
      Xty[j] += X[i][j] * trainTargets[i];
      for (let k = 0; k <= p; k++) {
        XtX[j][k] += X[i][j] * X[i][k];
      }
    }
  }

  // Add small regularization for numerical stability
  for (let j = 0; j <= p; j++) {
    XtX[j][j] += 1e-6;
  }

  // Solve using Gaussian elimination
  const weights = solveLinearSystem(XtX, Xty);

  return {
    predict: (features: number[]) => {
      const x = [...features, 1];
      let result = 0;
      for (let j = 0; j < x.length; j++) {
        result += x[j] * (weights[j] || 0);
      }
      return result;
    },
    weights,
  };
}

/** Ridge regression (L2 regularization) */
export function ridgeRegressionModel(trainFeatures: number[][], trainTargets: number[], alpha: number = 1.0): { predict: (features: number[]) => number } {
  const n = trainFeatures.length;
  const p = trainFeatures[0]?.length ?? 0;

  if (n === 0 || p === 0) {
    return { predict: () => 0 };
  }

  const X = trainFeatures.map(row => [...row, 1]);
  const XtX: number[][] = Array.from({ length: p + 1 }, () => new Array(p + 1).fill(0));
  const Xty: number[] = new Array(p + 1).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= p; j++) {
      Xty[j] += X[i][j] * trainTargets[i];
      for (let k = 0; k <= p; k++) {
        XtX[j][k] += X[i][j] * X[i][k];
      }
    }
  }

  // L2 regularization (don't regularize bias)
  for (let j = 0; j < p; j++) {
    XtX[j][j] += alpha;
  }
  XtX[p][p] += 1e-6; // Small regularization for bias numerical stability

  const weights = solveLinearSystem(XtX, Xty);

  return {
    predict: (features: number[]) => {
      const x = [...features, 1];
      let result = 0;
      for (let j = 0; j < x.length; j++) {
        result += x[j] * (weights[j] || 0);
      }
      return result;
    },
  };
}

/** Simplified gradient boosting using decision stumps */
export function gradientBoostingModel(trainFeatures: number[][], trainTargets: number[], nEstimators: number = 50, learningRate: number = 0.1): { predict: (features: number[]) => number } {
  const n = trainFeatures.length;
  const p = trainFeatures[0]?.length ?? 0;

  if (n === 0 || p === 0) {
    return { predict: () => 0 };
  }

  // Initialize with mean
  const mean = trainTargets.reduce((a, b) => a + b, 0) / n;
  let residuals = trainTargets.map(t => t - mean);
  
  interface Stump {
    featureIdx: number;
    threshold: number;
    leftValue: number;
    rightValue: number;
  }

  const stumps: Stump[] = [];

  for (let iter = 0; iter < nEstimators; iter++) {
    // Find best stump (single split)
    let bestStump: Stump | null = null;
    let bestReduction = 0;

    for (let f = 0; f < p; f++) {
      const values = trainFeatures.map(row => row[f]);
      const sorted = [...new Set(values)].sort((a, b) => a - b);
      
      // Try a subset of thresholds for efficiency
      const step = Math.max(1, Math.floor(sorted.length / 10));
      for (let t = 0; t < sorted.length; t += step) {
        const threshold = sorted[t];
        const leftResiduals: number[] = [];
        const rightResiduals: number[] = [];

        for (let i = 0; i < n; i++) {
          if (trainFeatures[i][f] <= threshold) {
            leftResiduals.push(residuals[i]);
          } else {
            rightResiduals.push(residuals[i]);
          }
        }

        if (leftResiduals.length === 0 || rightResiduals.length === 0) continue;

        const leftMean = leftResiduals.reduce((a, b) => a + b, 0) / leftResiduals.length;
        const rightMean = rightResiduals.reduce((a, b) => a + b, 0) / rightResiduals.length;

        const reduction = leftResiduals.length * leftMean * leftMean + rightResiduals.length * rightMean * rightMean;

        if (reduction > bestReduction) {
          bestReduction = reduction;
          bestStump = {
            featureIdx: f,
            threshold,
            leftValue: leftMean,
            rightValue: rightMean,
          };
        }
      }
    }

    if (!bestStump) break;

    stumps.push(bestStump);

    // Update residuals
    for (let i = 0; i < n; i++) {
      const prediction = trainFeatures[i][bestStump.featureIdx] <= bestStump.threshold
        ? bestStump.leftValue
        : bestStump.rightValue;
      residuals[i] -= learningRate * prediction;
    }
  }

  return {
    predict: (features: number[]) => {
      let result = mean;
      for (const stump of stumps) {
        const prediction = features[stump.featureIdx] <= stump.threshold
          ? stump.leftValue
          : stump.rightValue;
        result += learningRate * prediction;
      }
      return result;
    },
  };
}

// ============================================================
// Model Factory
// ============================================================

export function createModel(
  modelId: ModelType,
  trainFeatures: number[][],
  trainTargets: number[]
): { predict: (features: number[]) => number } {
  switch (modelId) {
    case 'persistence':
      return persistenceModel(trainFeatures, trainTargets);
    case 'historical_average':
      return historicalAverageModel(trainFeatures, trainTargets);
    case 'linear_regression':
      return linearRegressionModel(trainFeatures, trainTargets);
    case 'ridge_regression':
      return ridgeRegressionModel(trainFeatures, trainTargets);
    case 'gradient_boosting':
      return gradientBoostingModel(trainFeatures, trainTargets);
    default:
      throw new Error(`Unknown model: ${modelId}`);
  }
}

// ============================================================
// Evaluation Metrics
// ============================================================

export function calculateMetrics(
  predictions: number[],
  actuals: number[],
  baselinePredictions?: number[]
): ModelMetrics {
  const n = predictions.length;
  if (n === 0) {
    return { mae: 0, rmse: 0, directionalAccuracy: 0, baselineImprovement: 0, predictionIntervalCoverage: 0, trainingTimeMs: 0 };
  }

  // MAE
  const mae = predictions.reduce((sum, p, i) => sum + Math.abs(p - actuals[i]), 0) / n;

  // RMSE
  const rmse = Math.sqrt(predictions.reduce((sum, p, i) => sum + Math.pow(p - actuals[i], 2), 0) / n);

  // Directional accuracy
  let correctDirection = 0;
  for (let i = 0; i < n; i++) {
    const predDir = predictions[i] >= 0 ? 1 : -1;
    const actualDir = actuals[i] >= 0 ? 1 : -1;
    if (predDir === actualDir) correctDirection++;
  }
  const directionalAccuracy = correctDirection / n;

  // Baseline improvement
  let baselineImprovement = 0;
  if (baselinePredictions && baselinePredictions.length === n) {
    const baselineMAE = baselinePredictions.reduce((sum, p, i) => sum + Math.abs(p - actuals[i]), 0) / n;
    baselineImprovement = baselineMAE > 0 ? ((baselineMAE - mae) / baselineMAE) * 100 : 0;
  }

  // Prediction interval coverage (using ±2 std of residuals)
  const residuals = predictions.map((p, i) => actuals[i] - p);
  const residualStd = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / n);
  const interval = 1.96 * residualStd;
  let covered = 0;
  for (let i = 0; i < n; i++) {
    if (Math.abs(actuals[i] - predictions[i]) <= interval) covered++;
  }
  const predictionIntervalCoverage = (covered / n) * 100;

  return { mae, rmse, directionalAccuracy, baselineImprovement, predictionIntervalCoverage, trainingTimeMs: 0 };
}

// ============================================================
// Utility: Solve linear system via Gaussian elimination
// ============================================================

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  // Augmented matrix
  const M = A.map((row, i) => [...row, b[i]]);

  // Forward elimination
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > maxVal) {
        maxVal = Math.abs(M[row][col]);
        maxRow = row;
      }
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];

    if (Math.abs(M[col][col]) < 1e-12) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let j = col; j <= n; j++) {
        M[row][j] -= factor * M[col][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(M[i][i]) < 1e-12) {
      x[i] = 0;
      continue;
    }
    x[i] = M[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= M[i][j] * x[j];
    }
    x[i] /= M[i][i];
  }

  return x;
}

// ============================================================
// Forecast generation for a single model on latest data
// ============================================================

export function generateForecast(
  modelId: ModelType,
  prices: PriceRecord[],
  horizon: number,
  trainingEndIndex?: number
): { prediction: number; metrics: ModelMetrics; trainingTimeMs: number } {
  const start = performance.now();
  const endIndex = trainingEndIndex ?? prices.length - horizon;
  const trainingPrices = prices.slice(0, endIndex);

  if (trainingPrices.length < 50) {
    return {
      prediction: 0,
      metrics: { mae: 0, rmse: 0, directionalAccuracy: 0, baselineImprovement: 0, predictionIntervalCoverage: 0, trainingTimeMs: 0 },
      trainingTimeMs: 0,
    };
  }

  // Build features for training
  const matrix = buildFeatures(trainingPrices, horizon);
  if (matrix.features.length < 30) {
    return {
      prediction: 0,
      metrics: { mae: 0, rmse: 0, directionalAccuracy: 0, baselineImprovement: 0, predictionIntervalCoverage: 0, trainingTimeMs: 0 },
      trainingTimeMs: 0,
    };
  }

  // Split into train/validation (last 20% for validation)
  const splitIdx = Math.floor(matrix.features.length * 0.8);
  const trainFeatures = matrix.features.slice(0, splitIdx);
  const trainTargets = matrix.targets.slice(0, splitIdx);
  const valFeatures = matrix.features.slice(splitIdx);
  const valTargets = matrix.targets.slice(splitIdx);

  // Standardize
  const { train: stdTrain, test: stdVal } = standardizeFeatures(trainFeatures, valFeatures);

  // Train model
  const model = createModel(modelId, stdTrain, trainTargets);

  // Evaluate on validation set
  const valPredictions = stdVal ? stdVal.map(f => model.predict(f)) : [];
  const baselineModel = createModel('historical_average', stdTrain, trainTargets);
  const baselinePredictions = stdVal ? stdVal.map(f => baselineModel.predict(f)) : [];

  const metrics = calculateMetrics(valPredictions, valTargets, baselinePredictions);

  // Generate forecast for the LATEST available data point.
  // buildFeatures excludes the last `horizon` points (no targets available),
  // so we build a feature row for the last point using buildSinglePointFeatures.
  let forecastPrediction = 0;
  const lastFeatures = buildSinglePointFeatures(prices, prices.length - 1);
  
  if (lastFeatures) {
    const { test: stdLast } = standardizeFeatures(trainFeatures, [lastFeatures]);
    if (stdLast && stdLast.length > 0) {
      forecastPrediction = model.predict(stdLast[0]);
    }
  }

  const trainingTimeMs = performance.now() - start;
  metrics.trainingTimeMs = trainingTimeMs;

  return { prediction: forecastPrediction, metrics, trainingTimeMs };
}
