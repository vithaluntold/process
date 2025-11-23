"""
ARIMA/SARIMA Time Series Forecasting
Statistical models for seasonal patterns
"""

import numpy as np
from typing import List, Dict, Any, Tuple, Optional


class ARIMAForecaster:
    """ARIMA/SARIMA forecasting for process metrics"""
    
    def __init__(self, order: Tuple[int, int, int] = (5, 1, 0), seasonal_order: Optional[Tuple[int, int, int, int]] = None):
        """
        Initialize ARIMA Forecaster
        
        Args:
            order: (p, d, q) for ARIMA
            seasonal_order: (P, D, Q, s) for SARIMA (None for non-seasonal)
        """
        self.order = order
        self.seasonal_order = seasonal_order
        self.model = None
        self.model_fit = None
        self.is_trained = False
        
    def auto_select_order(self, time_series: np.ndarray) -> Tuple[int, int, int]:
        """Automatically select best ARIMA order using AIC"""
        try:
            import pmdarima as pm
            
            auto_model = pm.auto_arima(
                time_series,
                start_p=1, start_q=1,
                max_p=5, max_q=5,
                seasonal=False,
                stepwise=True,
                suppress_warnings=True,
                error_action='ignore'
            )
            
            return auto_model.order
        except ImportError:
            return self.order
    
    def train(self, time_series: np.ndarray, auto_order: bool = True) -> Dict[str, Any]:
        """
        Train ARIMA model
        
        Args:
            time_series: Historical time series data
            auto_order: Automatically select best order
            
        Returns:
            Training results
        """
        try:
            from statsmodels.tsa.statespace.sarimax import SARIMAX
            
            # Auto-select order if requested
            if auto_order:
                self.order = self.auto_select_order(time_series)
            
            # Create and fit model
            if self.seasonal_order:
                self.model = SARIMAX(
                    time_series,
                    order=self.order,
                    seasonal_order=self.seasonal_order,
                    enforce_stationarity=False,
                    enforce_invertibility=False
                )
            else:
                self.model = SARIMAX(
                    time_series,
                    order=self.order,
                    enforce_stationarity=False,
                    enforce_invertibility=False
                )
            
            self.model_fit = self.model.fit(disp=False)
            self.is_trained = True
            
            return {
                'order': self.order,
                'seasonal_order': self.seasonal_order,
                'aic': float(self.model_fit.aic),
                'bic': float(self.model_fit.bic),
                'successful': True
            }
        except ImportError:
            raise ImportError("statsmodels not available")
        except Exception as e:
            return {
                'successful': False,
                'error': str(e)
            }
    
    def forecast(self, horizon: int = 30) -> Dict[str, Any]:
        """
        Generate forecast
        
        Args:
            horizon: Forecast horizon
            
        Returns:
            Forecast with confidence intervals
        """
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        # Get forecast
        forecast_result = self.model_fit.get_forecast(steps=horizon)
        forecast_mean = forecast_result.predicted_mean
        confidence_intervals = forecast_result.conf_int()
        
        return {
            'forecast': forecast_mean.tolist(),
            'horizon': horizon,
            'confidence_intervals': {
                '95%': {
                    'lower': confidence_intervals.iloc[:, 0].tolist(),
                    'upper': confidence_intervals.iloc[:, 1].tolist()
                }
            },
            'model_type': 'SARIMA' if self.seasonal_order else 'ARIMA',
            'order': self.order
        }


def forecast_with_arima(
    historical_data: List[float],
    metric_name: str = 'throughput',
    horizon: int = 30,
    seasonal: bool = False,
    seasonal_period: int = 7
) -> Dict[str, Any]:
    """
    Forecast using ARIMA/SARIMA
    
    Args:
        historical_data: Historical metric values
        metric_name: Name of metric
        horizon: Forecast horizon
        seasonal: Use SARIMA for seasonal data
        seasonal_period: Seasonal period (e.g., 7 for weekly)
        
    Returns:
        Forecast results
    """
    time_series = np.array(historical_data)
    
    # Configure model
    if seasonal:
        forecaster = ARIMAForecaster(
            order=(1, 1, 1),
            seasonal_order=(1, 1, 1, seasonal_period)
        )
    else:
        forecaster = ARIMAForecaster()
    
    # Train
    training_result = forecaster.train(time_series)
    
    if not training_result.get('successful', False):
        return {
            'algorithm': 'SARIMA' if seasonal else 'ARIMA',
            'metric': metric_name,
            'error': training_result.get('error', 'Training failed'),
            'forecast': None
        }
    
    # Forecast
    forecast_result = forecaster.forecast(horizon)
    
    return {
        'algorithm': 'SARIMA' if seasonal else 'ARIMA',
        'metric': metric_name,
        'training': training_result,
        'forecast': forecast_result['forecast'],
        'confidence_intervals': forecast_result['confidence_intervals'],
        'horizon': horizon
    }
