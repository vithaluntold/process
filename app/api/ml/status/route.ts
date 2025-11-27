/**
 * ML Services Status API
 * Reports available algorithms and service health
 */

import { NextRequest, NextResponse } from 'next/server';
import getCurrentUser from '@/lib/auth';
import { getMLClient } from '@/lib/ml-client';

const TYPESCRIPT_ALGORITHMS = {
  anomaly_detection: [
    {
      id: 'zscore',
      name: 'Z-Score Analysis',
      description: 'Statistical method detecting values beyond threshold standard deviations',
      parameters: ['threshold (default: 3)'],
    },
    {
      id: 'modified_zscore',
      name: 'Modified Z-Score (Robust)',
      description: 'MAD-based robust z-score detection resistant to outliers',
      parameters: ['threshold (default: 3.5)'],
    },
    {
      id: 'iqr',
      name: 'IQR Detection',
      description: 'Interquartile range method for outlier detection',
      parameters: ['multiplier (default: 1.5)'],
    },
    {
      id: 'isolation_score',
      name: 'Isolation Score',
      description: 'Tree-based anomaly detection using random isolation',
      parameters: ['contamination (0.01-0.5)'],
    },
  ],
  forecasting: [
    {
      id: 'simple_exponential_smoothing',
      name: 'Simple Exponential Smoothing',
      description: 'Basic exponential smoothing for stationary data',
      parameters: ['horizon', 'alpha (0.1-0.9)'],
    },
    {
      id: 'holt_winters',
      name: 'Holt-Winters',
      description: 'Double exponential smoothing for trend-aware forecasting',
      parameters: ['horizon', 'alpha (0.1-0.9)', 'beta (0.1-0.5)'],
    },
    {
      id: 'linear_regression',
      name: 'Linear Regression',
      description: 'Simple trend projection using least squares fit',
      parameters: ['horizon'],
    },
    {
      id: 'moving_average',
      name: 'Moving Average',
      description: 'Rolling average for stable short-term predictions',
      parameters: ['horizon', 'window_size (default: 7)'],
    },
  ],
  simulation: [
    {
      id: 'monte_carlo',
      name: 'Monte Carlo Simulation',
      description: 'Probabilistic simulation with configurable iterations',
      parameters: ['num_simulations', 'base_cycle_time', 'variance'],
    },
  ],
};

const PYTHON_ALGORITHMS = {
  anomaly_detection: [
    { id: 'lstm_autoencoder', name: 'LSTM Autoencoder', description: 'Deep learning sequence anomaly detection' },
    { id: 'vae', name: 'Variational Autoencoder', description: 'Probabilistic anomaly scoring' },
    { id: 'dbscan_clustering', name: 'DBSCAN Clustering', description: 'Density-based spatial clustering' },
    { id: 'one_class_svm', name: 'One-Class SVM', description: 'Support vector novelty detection' },
  ],
  forecasting: [
    { id: 'prophet', name: 'Facebook Prophet', description: 'Additive model with seasonality' },
    { id: 'arima', name: 'ARIMA/SARIMA', description: 'Autoregressive integrated moving average' },
    { id: 'lstm', name: 'LSTM Networks', description: 'Long short-term memory for sequence prediction' },
    { id: 'xgboost', name: 'XGBoost', description: 'Gradient boosted regression trees' },
  ],
  simulation: [
    { id: 'rl_ppo', name: 'PPO Optimization', description: 'Reinforcement learning process optimization' },
    { id: 'td3', name: 'TD3 Agent', description: 'Twin delayed deep deterministic policy gradient' },
    { id: 'bayesian_opt', name: 'Bayesian Optimization', description: 'Probabilistic parameter tuning' },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mlClient = getMLClient();
    let pythonApiAvailable = false;
    let pythonHealth = null;

    try {
      pythonApiAvailable = await mlClient.isAvailable();
      if (pythonApiAvailable) {
        pythonHealth = await mlClient.healthCheck();
      }
    } catch {
      pythonApiAvailable = false;
    }

    return NextResponse.json({
      success: true,
      status: {
        typescript_ml: {
          available: true,
          description: 'Built-in TypeScript ML algorithms (always available)',
        },
        python_ml: {
          available: pythonApiAvailable,
          description: pythonApiAvailable 
            ? 'Python FastAPI ML service connected' 
            : 'Python ML service not connected (using TypeScript fallbacks)',
          health: pythonHealth,
        },
      },
      algorithms: {
        available_now: TYPESCRIPT_ALGORITHMS,
        requires_python: pythonApiAvailable ? PYTHON_ALGORITHMS : {
          anomaly_detection: PYTHON_ALGORITHMS.anomaly_detection.map(a => ({ ...a, status: 'requires_ml_api' })),
          forecasting: PYTHON_ALGORITHMS.forecasting.map(a => ({ ...a, status: 'requires_ml_api' })),
          simulation: PYTHON_ALGORITHMS.simulation.map(a => ({ ...a, status: 'requires_ml_api' })),
        },
      },
      usage: {
        anomaly_detection: {
          endpoint: '/api/ml/anomaly-detection',
          method: 'POST',
          body: {
            processId: 'number (required)',
            algorithm: 'string (zscore|modified_zscore|iqr|isolation_score)',
            contamination: 'number (0.01-0.5, default: 0.05)',
          },
        },
        forecasting: {
          endpoint: '/api/ml/forecast',
          method: 'POST',
          body: {
            processId: 'number (required)',
            horizon: 'number (days, default: 30)',
            algorithm: 'string (simple_exponential_smoothing|holt_winters|linear_regression|moving_average)',
          },
        },
        simulation: {
          endpoint: '/api/ml/simulation',
          method: 'POST',
          body: {
            processId: 'number (required)',
            numSimulations: 'number (default: 1000)',
            algorithm: 'string (monte_carlo)',
            parameters: 'object (optional overrides)',
          },
        },
      },
    });
  } catch (error) {
    console.error('ML status error:', error);
    return NextResponse.json(
      { error: 'Failed to get ML status' },
      { status: 500 }
    );
  }
}
