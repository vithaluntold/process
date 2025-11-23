"""
Production-Ready LSTM Forecaster
Deep learning time series forecasting
"""

import numpy as np
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from base.ml_model_base import ForecasterBase, TrainingResult, PredictionResult, TrainingError


class LSTMForecaster(ForecasterBase):
    """LSTM neural network forecaster"""
    
    def __init__(
        self,
        model_id: str = "lstm_default",
        horizon: int = 30,
        sequence_length: int = 10,
        hidden_units: int = 50,
        epochs: int = 50
    ):
        super().__init__(model_id, "lstm", horizon)
        self.sequence_length = sequence_length
        self.hidden_units = hidden_units
        self.epochs = epochs
        self.scaler_mean = None
        self.scaler_std = None
        
        self.metadata.hyperparameters.update({
            'sequence_length': sequence_length,
            'hidden_units': hidden_units,
            'epochs': epochs
        })
    
    def _scale_data(self, data: np.ndarray, fit: bool = False) -> np.ndarray:
        """Normalize data"""
        if fit:
            self.scaler_mean = np.mean(data)
            self.scaler_std = np.std(data)
        
        return (data - self.scaler_mean) / (self.scaler_std + 1e-8)
    
    def _inverse_scale(self, data: np.ndarray) -> np.ndarray:
        """Denormalize data"""
        return data * self.scaler_std + self.scaler_mean
    
    def _create_sequences(self, data: np.ndarray) -> tuple:
        """Create LSTM sequences"""
        X, y = [], []
        
        for i in range(len(data) - self.sequence_length):
            X.append(data[i:i + self.sequence_length])
            y.append(data[i + self.sequence_length])
        
        return np.array(X), np.array(y)
    
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """Train LSTM model"""
        try:
            import tensorflow as tf
            from tensorflow import keras
        except ImportError:
            raise TrainingError("tensorflow not available. Install with: pip install tensorflow")
        
        if isinstance(data, list):
            data = np.array(data)
        
        if len(data) < self.sequence_length + 20:
            raise TrainingError(f"Need at least {self.sequence_length + 20} samples")
        
        self.metadata.status = 'training'
        
        # Scale data
        scaled_data = self._scale_data(data, fit=True)
        
        # Create sequences
        X, y = self._create_sequences(scaled_data)
        X = X.reshape(X.shape[0], X.shape[1], 1)
        
        self.metadata.training_samples = len(X)
        
        # Build model
        self.model = keras.Sequential([
            keras.layers.LSTM(self.hidden_units, input_shape=(self.sequence_length, 1)),
            keras.layers.Dense(1)
        ])
        
        self.model.compile(optimizer='adam', loss='mse')
        
        # Train
        self.model.fit(
            X, y,
            epochs=self.epochs,
            batch_size=32,
            verbose=0
        )
        
        self.is_trained = True
        self.metadata.status = 'trained'
        
        # Calculate metrics
        predictions = self.model.predict(X, verbose=0).flatten()
        mae = float(np.mean(np.abs(predictions - y)))
        rmse = float(np.sqrt(np.mean((predictions - y) ** 2)))
        
        metrics = {
            'training_samples': len(X),
            'sequence_length': self.sequence_length,
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
        
        # Scale last sequence
        scaled_data = self._scale_data(data, fit=False)
        current_seq = scaled_data[-self.sequence_length:].tolist()
        
        # Generate forecast
        forecast = []
        for _ in range(h):
            # Predict next point
            X = np.array([current_seq[-self.sequence_length:]])
            X = X.reshape(1, self.sequence_length, 1)
            pred = self.model.predict(X, verbose=0)[0, 0]
            forecast.append(pred)
            
            # Update sequence
            current_seq.append(pred)
        
        # Inverse scale
        forecast = self._inverse_scale(np.array(forecast))
        
        results = {
            'forecast': forecast.tolist()
        }
        
        return PredictionResult(
            predictions=results,
            metadata={'model_type': 'lstm', 'horizon': h}
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
