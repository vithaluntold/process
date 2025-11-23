"""
Prophet Forecasting
Facebook's forecasting library for business time series
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timedelta


class ProphetForecaster:
    """Facebook Prophet for business forecasting"""
    
    def __init__(self, daily_seasonality: bool = True, weekly_seasonality: bool = True):
        """
        Initialize Prophet Forecaster
        
        Args:
            daily_seasonality: Enable daily seasonality
            weekly_seasonality: Enable weekly seasonality
        """
        self.daily_seasonality = daily_seasonality
        self.weekly_seasonality = weekly_seasonality
        self.model = None
        self.is_trained = False
        
    def prepare_dataframe(self, time_series: np.ndarray, dates: List[datetime] = None) -> pd.DataFrame:
        """Prepare data in Prophet format (ds, y columns)"""
        if dates is None:
            # Generate daily dates
            dates = [datetime.now() - timedelta(days=len(time_series) - i - 1) for i in range(len(time_series))]
        
        return pd.DataFrame({
            'ds': dates,
            'y': time_series
        })
    
    def train(self, time_series: np.ndarray, dates: List[datetime] = None) -> Dict[str, Any]:
        """
        Train Prophet model
        
        Args:
            time_series: Historical time series data
            dates: Corresponding dates (optional)
            
        Returns:
            Training results
        """
        try:
            from prophet import Prophet
            
            # Prepare data
            df = self.prepare_dataframe(time_series, dates)
            
            # Create and fit model
            self.model = Prophet(
                daily_seasonality=self.daily_seasonality,
                weekly_seasonality=self.weekly_seasonality,
                yearly_seasonality=len(time_series) >= 730,  # 2 years of data
                changepoint_prior_scale=0.05
            )
            
            # Suppress output
            import logging
            logging.getLogger('prophet').setLevel(logging.ERROR)
            
            self.model.fit(df)
            self.is_trained = True
            
            return {
                'successful': True,
                'data_points': len(time_series),
                'components': {
                    'trend': True,
                    'daily': self.daily_seasonality,
                    'weekly': self.weekly_seasonality,
                    'yearly': len(time_series) >= 730
                }
            }
        except ImportError:
            raise ImportError("Prophet not available. Install with: pip install prophet")
        except Exception as e:
            return {
                'successful': False,
                'error': str(e)
            }
    
    def forecast(self, horizon: int = 30, freq: str = 'D') -> Dict[str, Any]:
        """
        Generate forecast
        
        Args:
            horizon: Forecast horizon
            freq: Frequency ('D' for daily, 'H' for hourly)
            
        Returns:
            Forecast with uncertainty intervals
        """
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        # Create future dataframe
        future = self.model.make_future_dataframe(periods=horizon, freq=freq)
        
        # Predict
        forecast_df = self.model.predict(future)
        
        # Extract forecast values (last 'horizon' rows)
        forecast_values = forecast_df['yhat'].tail(horizon).values
        lower_bound = forecast_df['yhat_lower'].tail(horizon).values
        upper_bound = forecast_df['yhat_upper'].tail(horizon).values
        
        return {
            'forecast': forecast_values.tolist(),
            'horizon': horizon,
            'confidence_intervals': {
                '95%': {
                    'lower': lower_bound.tolist(),
                    'upper': upper_bound.tolist()
                }
            },
            'model_type': 'Prophet',
            'components': {
                'trend': forecast_df['trend'].tail(horizon).values.tolist(),
                'weekly': forecast_df.get('weekly', pd.Series([0] * horizon)).tail(horizon).values.tolist() if self.weekly_seasonality else None,
                'yearly': forecast_df.get('yearly', pd.Series([0] * horizon)).tail(horizon).values.tolist() if len(forecast_df) >= 730 else None
            }
        }


def forecast_with_prophet(
    historical_data: List[float],
    metric_name: str = 'cycle_time',
    horizon: int = 30,
    dates: List[datetime] = None
) -> Dict[str, Any]:
    """
    Forecast using Facebook Prophet
    
    Args:
        historical_data: Historical metric values
        metric_name: Name of metric
        horizon: Forecast horizon
        dates: Corresponding dates (optional)
        
    Returns:
        Forecast results
    """
    time_series = np.array(historical_data)
    
    # Create forecaster
    forecaster = ProphetForecaster()
    
    # Train
    training_result = forecaster.train(time_series, dates)
    
    if not training_result.get('successful', False):
        return {
            'algorithm': 'Prophet',
            'metric': metric_name,
            'error': training_result.get('error', 'Training failed'),
            'forecast': None
        }
    
    # Forecast
    forecast_result = forecaster.forecast(horizon)
    
    return {
        'algorithm': 'Prophet',
        'metric': metric_name,
        'training': training_result,
        'forecast': forecast_result['forecast'],
        'confidence_intervals': forecast_result['confidence_intervals'],
        'components': forecast_result['components'],
        'horizon': horizon
    }
