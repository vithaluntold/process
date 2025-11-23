"""
XGBoost Time Series Forecasting
Gradient boosting for feature-rich prediction
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple


class XGBoostForecaster:
    """XGBoost for time series forecasting"""
    
    def __init__(self, lag_features: List[int] = [1, 2, 3, 7, 14, 30]):
        """
        Initialize XGBoost Forecaster
        
        Args:
            lag_features: Lag periods for feature engineering
        """
        self.lag_features = lag_features
        self.model = None
        self.is_trained = False
        
    def create_lag_features(self, time_series: np.ndarray) -> pd.DataFrame:
        """Create lagged features for XGBoost"""
        df = pd.DataFrame({'value': time_series})
        
        # Create lag features
        for lag in self.lag_features:
            df[f'lag_{lag}'] = df['value'].shift(lag)
        
        # Rolling statistics
        df['rolling_mean_7'] = df['value'].rolling(window=7, min_periods=1).mean()
        df['rolling_std_7'] = df['value'].rolling(window=7, min_periods=1).std().fillna(0)
        df['rolling_mean_30'] = df['value'].rolling(window=30, min_periods=1).mean()
        
        # Time-based features
        df['index'] = np.arange(len(df))
        
        # Drop NaN rows
        df = df.dropna()
        
        return df
    
    def train(self, time_series: np.ndarray) -> Dict[str, Any]:
        """
        Train XGBoost model
        
        Args:
            time_series: Historical time series data
            
        Returns:
            Training results
        """
        try:
            import xgboost as xgb
            from sklearn.model_selection import train_test_split
            
            # Create features
            df = self.create_lag_features(time_series)
            
            if len(df) < 10:
                raise ValueError("Insufficient data after feature engineering")
            
            # Prepare X and y
            X = df.drop('value', axis=1).values
            y = df['value'].values
            
            # Split
            X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, shuffle=False)
            
            # Train XGBoost
            self.model = xgb.XGBRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                objective='reg:squarederror',
                random_state=42
            )
            
            self.model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                verbose=False
            )
            
            self.is_trained = True
            
            # Calculate validation metrics
            val_predictions = self.model.predict(X_val)
            mse = np.mean((val_predictions - y_val) ** 2)
            mae = np.mean(np.abs(val_predictions - y_val))
            
            return {
                'successful': True,
                'mse': float(mse),
                'mae': float(mae),
                'features_used': list(df.columns.drop('value'))
            }
        except ImportError:
            raise ImportError("XGBoost not available")
        except Exception as e:
            return {
                'successful': False,
                'error': str(e)
            }
    
    def forecast(self, recent_data: np.ndarray, horizon: int = 30) -> Dict[str, Any]:
        """
        Generate forecast
        
        Args:
            recent_data: Recent time series data
            horizon: Forecast horizon
            
        Returns:
            Forecast results
        """
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        # Iterative forecasting
        forecasts = []
        extended_series = recent_data.copy().tolist()
        
        for _ in range(horizon):
            # Create features from extended series
            df = self.create_lag_features(np.array(extended_series))
            
            if len(df) == 0:
                break
            
            # Get last row features
            X_next = df.drop('value', axis=1).iloc[-1:].values
            
            # Predict next value
            next_value = self.model.predict(X_next)[0]
            forecasts.append(float(next_value))
            extended_series.append(next_value)
        
        # Simple confidence intervals (±2 std of recent data)
        std = np.std(recent_data)
        forecasts_arr = np.array(forecasts)
        
        return {
            'forecast': forecasts,
            'horizon': len(forecasts),
            'confidence_intervals': {
                '95%': {
                    'lower': (forecasts_arr - 2 * std).tolist(),
                    'upper': (forecasts_arr + 2 * std).tolist()
                }
            },
            'model_type': 'XGBoost'
        }


def forecast_with_xgboost(
    historical_data: List[float],
    metric_name: str = 'resource_utilization',
    horizon: int = 30
) -> Dict[str, Any]:
    """
    Forecast using XGBoost
    
    Args:
        historical_data: Historical metric values
        metric_name: Name of metric
        horizon: Forecast horizon
        
    Returns:
        Forecast results
    """
    time_series = np.array(historical_data)
    
    # Create forecaster
    forecaster = XGBoostForecaster()
    
    # Train
    training_result = forecaster.train(time_series)
    
    if not training_result.get('successful', False):
        return {
            'algorithm': 'XGBoost',
            'metric': metric_name,
            'error': training_result.get('error', 'Training failed'),
            'forecast': None
        }
    
    # Forecast
    forecast_result = forecaster.forecast(time_series, horizon)
    
    return {
        'algorithm': 'XGBoost',
        'metric': metric_name,
        'training': training_result,
        'forecast': forecast_result['forecast'],
        'confidence_intervals': forecast_result['confidence_intervals'],
        'horizon': horizon
    }
