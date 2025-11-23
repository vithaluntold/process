"""
Production-Ready ARIMA/SARIMA Forecaster
Statistical time series forecasting
"""

import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from base.ml_model_base import ForecasterBase, TrainingResult, PredictionResult, TrainingError


class ARIMAForecaster(ForecasterBase):
    """ARIMA/SARIMA forecaster with auto-parameter selection"""
    
    def __init__(
        self,
        model_id: str = "arima_default",
        horizon: int = 30,
        seasonal: bool = False,
        m: int = 7  # Seasonal period
    ):
        super().__init__(model_id, "arima", horizon)
        self.seasonal = seasonal
        self.m = m
        self.order = None
        
        self.metadata.hyperparameters.update({
            'seasonal': seasonal,
            'seasonal_period': m
        })
    
    def train(self, data: Any, timestamps: Optional[List[datetime]] = None, **kwargs) -> TrainingResult:
        """Train ARIMA model with auto parameter selection"""
        try:
            from pmdarima import auto_arima
        except ImportError:
            raise TrainingError("pmdarima not available. Install with: pip install pmdarima")
        
        if isinstance(data, list):
            data = np.array(data)
        
        if len(data) < 10:
            raise TrainingError("Need at least 10 samples")
        
        self.metadata.status = 'training'
        self.metadata.training_samples = len(data)
        
        # Auto ARIMA
        try:
            self.model = auto_arima(
                data,
                seasonal=self.seasonal,
                m=self.m if self.seasonal else 1,
                stepwise=True,
                suppress_warnings=True,
                error_action='ignore',
                max_p=5,
                max_q=5,
                max_P=2,
                max_Q=2
            )
            
            self.order = self.model.order
            
        except Exception as e:
            raise TrainingError(f"ARIMA fitting failed: {str(e)}")
        
        self.is_trained = True
        self.metadata.status = 'trained'
        
        # In-sample performance
        fitted_values = self.model.predict_in_sample()
        mae = float(np.mean(np.abs(data - fitted_values)))
        rmse = float(np.sqrt(np.mean((data - fitted_values) ** 2)))
        
        metrics = {
            'training_samples': len(data),
            'order': str(self.order),
            'mae': mae,
            'rmse': rmse
        }
        
        self.metadata.performance_metrics = metrics
        
        return TrainingResult(
            success=True,
            metrics=metrics,
            metadata=self.metadata
        )
    
    def predict(self, data: Any, horizon: Optional[int] = None, **kwargs) -> PredictionResult:
        """Generate forecast"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        h = horizon or self.horizon
        
        # Forecast
        forecast_values, conf_int = self.model.predict(n_periods=h, return_conf_int=True)
        
        results = {
            'forecast': forecast_values.tolist(),
            'confidence_intervals': {
                '95%': {
                    'lower': conf_int[:, 0].tolist(),
                    'upper': conf_int[:, 1].tolist()
                }
            }
        }
        
        return PredictionResult(
            predictions=results,
            metadata={'model_type': 'arima', 'order': str(self.order), 'horizon': h}
        )
    
    def forecast(self, historical_data: Any, horizon: Optional[int] = None) -> Dict[str, Any]:
        """Generate forecast (convenience method)"""
        pred_result = self.predict(historical_data, horizon)
        return pred_result.predictions
    
    def evaluate(self, data: Any, labels: Any, **kwargs) -> Dict[str, float]:
        """Evaluate forecasting performance"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        horizon = len(labels)
        forecast_result = self.predict(data, horizon=horizon)
        predictions = np.array(forecast_result.predictions['forecast'])
        labels = np.array(labels)
        
        mae = float(np.mean(np.abs(predictions - labels)))
        rmse = float(np.sqrt(np.mean((predictions - labels) ** 2)))
        mape = float(np.mean(np.abs((predictions - labels) / (labels + 1e-10))) * 100)
        
        return {
            'mae': mae,
            'rmse': rmse,
            'mape': mape
        }
