"""
Production-Ready XGBoost Forecaster
Gradient boosting for time series
"""

import numpy as np
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from base.ml_model_base import ForecasterBase, TrainingResult, PredictionResult, TrainingError


class XGBoostForecaster(ForecasterBase):
    """XGBoost forecaster with lag features"""
    
    def __init__(
        self,
        model_id: str = "xgboost_default",
        horizon: int = 30,
        n_lags: int = 7,
        n_estimators: int = 100
    ):
        super().__init__(model_id, "xgboost", horizon)
        self.n_lags = n_lags
        self.n_estimators = n_estimators
        
        self.metadata.hyperparameters.update({
            'n_lags': n_lags,
            'n_estimators': n_estimators
        })
    
    def _create_features(self, data: np.ndarray) -> tuple:
        """Create lag features"""
        X, y = [], []
        
        for i in range(self.n_lags, len(data)):
            X.append(data[i-self.n_lags:i])
            y.append(data[i])
        
        return np.array(X), np.array(y)
    
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """Train XGBoost model"""
        try:
            from xgboost import XGBRegressor
        except ImportError:
            raise TrainingError("xgboost not available. Install with: pip install xgboost")
        
        if isinstance(data, list):
            data = np.array(data)
        
        if len(data) < self.n_lags + 10:
            raise TrainingError(f"Need at least {self.n_lags + 10} samples")
        
        self.metadata.status = 'training'
        
        # Create features
        X, y = self._create_features(data)
        self.metadata.training_samples = len(X)
        
        # Train model
        self.model = XGBRegressor(
            n_estimators=self.n_estimators,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        
        self.model.fit(X, y)
        
        self.is_trained = True
        self.metadata.status = 'trained'
        
        # Calculate metrics
        predictions = self.model.predict(X)
        mae = float(np.mean(np.abs(predictions - y)))
        rmse = float(np.sqrt(np.mean((predictions - y) ** 2)))
        
        metrics = {
            'training_samples': len(X),
            'n_lags': self.n_lags,
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
        
        if isinstance(data, list):
            data = np.array(data)
        
        h = horizon or self.horizon
        
        # Use last n_lags points as seed
        forecast = []
        current_window = data[-self.n_lags:].tolist()
        
        for _ in range(h):
            # Predict next point
            X = np.array([current_window[-self.n_lags:]])
            pred = self.model.predict(X)[0]
            forecast.append(pred)
            
            # Update window
            current_window.append(pred)
        
        results = {
            'forecast': forecast
        }
        
        return PredictionResult(
            predictions=results,
            metadata={'model_type': 'xgboost', 'horizon': h}
        )
    
    def forecast(self, historical_data: Any, horizon: Optional[int] = None) -> Dict[str, Any]:
        """Generate forecast (convenience method)"""
        pred_result = self.predict(historical_data, horizon)
        return pred_result.predictions
    
    def evaluate(self, data: Any, labels: Any, **kwargs) -> Dict[str, float]:
        """Evaluate performance"""
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
