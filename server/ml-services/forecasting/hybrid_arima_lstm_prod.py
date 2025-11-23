"""
Production-Ready Hybrid ARIMA-LSTM Forecaster
Combines statistical and deep learning approaches
"""

import numpy as np
from typing import Dict, Any, Optional
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from base.ml_model_base import ForecasterBase, TrainingResult, PredictionResult, TrainingError


class HybridARIMALSTMForecaster(ForecasterBase):
    """Hybrid ARIMA-LSTM forecaster"""
    
    def __init__(
        self,
        model_id: str = "hybrid_arima_lstm_default",
        horizon: int = 30,
        sequence_length: int = 10
    ):
        super().__init__(model_id, "hybrid_arima_lstm", horizon)
        self.sequence_length = sequence_length
        self.arima_model = None
        self.lstm_model = None
        self.scaler_mean = None
        self.scaler_std = None
        
        self.metadata.hyperparameters.update({
            'sequence_length': sequence_length
        })
    
    def _scale_data(self, data: np.ndarray, fit: bool = False) -> np.ndarray:
        """Normalize data"""
        if fit:
            self.scaler_mean = np.mean(data)
            self.scaler_std = np.std(data)
        return (data - self.scaler_mean) / (self.scaler_std + 1e-8)
    
    def _create_sequences(self, data: np.ndarray) -> tuple:
        """Create sequences"""
        X, y = [], []
        for i in range(len(data) - self.sequence_length):
            X.append(data[i:i + self.sequence_length])
            y.append(data[i + self.sequence_length])
        return np.array(X), np.array(y)
    
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """Train hybrid model"""
        try:
            from pmdarima import auto_arima
            import tensorflow as tf
            from tensorflow import keras
        except ImportError:
            raise TrainingError("pmdarima or tensorflow not available")
        
        if isinstance(data, list):
            data = np.array(data)
        
        if len(data) < self.sequence_length + 20:
            raise TrainingError(f"Need at least {self.sequence_length + 20} samples")
        
        self.metadata.status = 'training'
        self.metadata.training_samples = len(data)
        
        # Train ARIMA on original data
        self.arima_model = auto_arima(
            data,
            seasonal=False,
            stepwise=True,
            suppress_warnings=True,
            error_action='ignore'
        )
        
        # Get ARIMA residuals
        arima_fitted = self.arima_model.predict_in_sample()
        residuals = data - arima_fitted
        
        # Train LSTM on residuals
        scaled_residuals = self._scale_data(residuals, fit=True)
        X, y = self._create_sequences(scaled_residuals)
        X = X.reshape(X.shape[0], X.shape[1], 1)
        
        self.lstm_model = keras.Sequential([
            keras.layers.LSTM(32, input_shape=(self.sequence_length, 1)),
            keras.layers.Dense(1)
        ])
        
        self.lstm_model.compile(optimizer='adam', loss='mse')
        self.lstm_model.fit(X, y, epochs=30, batch_size=32, verbose=0)
        
        self.is_trained = True
        self.metadata.status = 'trained'
        
        metrics = {
            'training_samples': len(data),
            'arima_order': str(self.arima_model.order)
        }
        
        self.metadata.performance_metrics = metrics
        
        return TrainingResult(
            success=True,
            metrics=metrics,
            metadata=self.metadata
        )
    
    def predict(self, data: Any, horizon: Optional[int] = None, **kwargs) -> PredictionResult:
        """Generate hybrid forecast"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        if isinstance(data, list):
            data = np.array(data)
        
        h = horizon or self.horizon
        
        # ARIMA forecast
        arima_forecast, _ = self.arima_model.predict(n_periods=h, return_conf_int=True)
        
        # LSTM forecast on residuals
        residuals = data - self.arima_model.predict_in_sample()
        scaled_residuals = self._scale_data(residuals, fit=False)
        current_seq = scaled_residuals[-self.sequence_length:].tolist()
        
        lstm_forecast = []
        for _ in range(h):
            X = np.array([current_seq[-self.sequence_length:]])
            X = X.reshape(1, self.sequence_length, 1)
            pred = self.lstm_model.predict(X, verbose=0)[0, 0]
            lstm_forecast.append(pred)
            current_seq.append(pred)
        
        lstm_forecast = np.array(lstm_forecast) * self.scaler_std + self.scaler_mean
        
        # Combine forecasts
        hybrid_forecast = arima_forecast + lstm_forecast
        
        results = {
            'forecast': hybrid_forecast.tolist(),
            'arima_component': arima_forecast.tolist(),
            'lstm_component': lstm_forecast.tolist()
        }
        
        return PredictionResult(
            predictions=results,
            metadata={'model_type': 'hybrid_arima_lstm', 'horizon': h}
        )
    
    def forecast(self, historical_data: Any, horizon: Optional[int] = None) -> Dict[str, Any]:
        """Generate forecast"""
        pred_result = self.predict(historical_data, horizon)
        return pred_result.predictions
    
    def evaluate(self, data: Any, labels: Any, **kwargs) -> Dict[str, float]:
        """Evaluate performance"""
        horizon = len(labels)
        forecast_result = self.predict(data, horizon=horizon)
        predictions = np.array(forecast_result.predictions['forecast'])
        labels = np.array(labels)
        
        mae = float(np.mean(np.abs(predictions - labels)))
        rmse = float(np.sqrt(np.mean((predictions - labels) ** 2)))
        mape = float(np.mean(np.abs((predictions - labels) / (labels + 1e-10))) * 100)
        
        return {'mae': mae, 'rmse': rmse, 'mape': mape}
