"""
LSTM/GRU Time Series Forecasting
Deep learning models for process metric prediction
"""

import numpy as np
from typing import List, Dict, Any, Tuple


class LSTMForecaster:
    """LSTM-based time series forecasting for process metrics"""
    
    def __init__(self, sequence_length: int = 30, forecast_horizon: int = 30, use_gru: bool = False):
        """
        Initialize LSTM Forecaster
        
        Args:
            sequence_length: Length of input sequences
            forecast_horizon: Number of steps to forecast
            use_gru: Use GRU instead of LSTM (faster)
        """
        self.sequence_length = sequence_length
        self.forecast_horizon = forecast_horizon
        self.use_gru = use_gru
        self.model = None
        self.scaler = None
        self.is_trained = False
        
    def build_model(self, input_features: int = 1):
        """Build LSTM/GRU forecasting model"""
        try:
            import tensorflow as tf
            from tensorflow import keras
            from tensorflow.keras import layers
            
            model = keras.Sequential([
                layers.Input(shape=(self.sequence_length, input_features)),
                
                # First layer
                layers.GRU(128, return_sequences=True) if self.use_gru 
                else layers.LSTM(128, return_sequences=True),
                layers.Dropout(0.2),
                
                # Second layer
                layers.GRU(64, return_sequences=True) if self.use_gru
                else layers.LSTM(64, return_sequences=True),
                layers.Dropout(0.2),
                
                # Third layer
                layers.GRU(32, return_sequences=False) if self.use_gru
                else layers.LSTM(32, return_sequences=False),
                
                # Output layers
                layers.Dense(32, activation='relu'),
                layers.Dense(self.forecast_horizon)
            ])
            
            model.compile(
                optimizer=keras.optimizers.Adam(learning_rate=0.001),
                loss='mse',
                metrics=['mae']
            )
            
            self.model = model
            return True
        except ImportError:
            return False
    
    def prepare_data(self, time_series: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare sequences for training"""
        X, y = [], []
        for i in range(len(time_series) - self.sequence_length - self.forecast_horizon + 1):
            X.append(time_series[i:i + self.sequence_length])
            y.append(time_series[i + self.sequence_length:i + self.sequence_length + self.forecast_horizon])
        return np.array(X), np.array(y)
    
    def train(self, time_series: np.ndarray, epochs: int = 100, batch_size: int = 32) -> Dict[str, Any]:
        """
        Train LSTM forecaster
        
        Args:
            time_series: Historical time series data
            epochs: Training epochs
            batch_size: Batch size
            
        Returns:
            Training history
        """
        if not self.build_model():
            raise ImportError("TensorFlow not available")
        
        # Normalize data
        self.mean = time_series.mean()
        self.std = time_series.std()
        normalized = (time_series - self.mean) / (self.std + 1e-8)
        
        # Prepare sequences
        X, y = self.prepare_data(normalized)
        
        if len(X) < 10:
            raise ValueError(f"Insufficient data: need at least {self.sequence_length + self.forecast_horizon + 10} points")
        
        # Train
        history = self.model.fit(
            X, y,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=0,
            callbacks=[
                tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True)
            ]
        )
        
        self.is_trained = True
        
        return {
            'loss': float(history.history['loss'][-1]),
            'mae': float(history.history['mae'][-1]),
            'val_loss': float(history.history['val_loss'][-1]) if 'val_loss' in history.history else None,
            'epochs_trained': len(history.history['loss'])
        }
    
    def forecast(self, recent_data: np.ndarray) -> Dict[str, Any]:
        """
        Generate forecast
        
        Args:
            recent_data: Most recent sequence_length data points
            
        Returns:
            Forecast with confidence intervals
        """
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        if len(recent_data) < self.sequence_length:
            raise ValueError(f"Need at least {self.sequence_length} recent data points")
        
        # Normalize
        recent_normalized = (recent_data[-self.sequence_length:] - self.mean) / (self.std + 1e-8)
        
        # Reshape for model input
        X = recent_normalized.reshape(1, self.sequence_length, 1)
        
        # Predict
        prediction_normalized = self.model.predict(X, verbose=0)[0]
        
        # Denormalize
        prediction = prediction_normalized * self.std + self.mean
        
        # Calculate simple confidence intervals (±2 std)
        confidence_interval = 2 * self.std
        
        return {
            'forecast': prediction.tolist(),
            'horizon': self.forecast_horizon,
            'confidence_intervals': {
                '95%': {
                    'lower': (prediction - confidence_interval).tolist(),
                    'upper': (prediction + confidence_interval).tolist()
                }
            },
            'model_type': 'GRU' if self.use_gru else 'LSTM'
        }


class BidirectionalLSTMForecaster(LSTMForecaster):
    """Bidirectional LSTM for improved context understanding"""
    
    def build_model(self, input_features: int = 1):
        """Build bidirectional LSTM model"""
        try:
            import tensorflow as tf
            from tensorflow import keras
            from tensorflow.keras import layers
            
            model = keras.Sequential([
                layers.Input(shape=(self.sequence_length, input_features)),
                
                # Bidirectional layers
                layers.Bidirectional(layers.LSTM(128, return_sequences=True)),
                layers.Dropout(0.2),
                
                layers.Bidirectional(layers.LSTM(64, return_sequences=False)),
                layers.Dropout(0.2),
                
                # Output layers
                layers.Dense(32, activation='relu'),
                layers.Dense(self.forecast_horizon)
            ])
            
            model.compile(
                optimizer=keras.optimizers.Adam(learning_rate=0.001),
                loss='mse',
                metrics=['mae']
            )
            
            self.model = model
            return True
        except ImportError:
            return False


def forecast_process_metrics(
    historical_data: List[float],
    metric_name: str = 'cycle_time',
    horizon: int = 30,
    use_bidirectional: bool = False
) -> Dict[str, Any]:
    """
    Forecast process metrics using LSTM
    
    Args:
        historical_data: Historical metric values
        metric_name: Name of metric being forecast
        horizon: Forecast horizon
        use_bidirectional: Use bidirectional LSTM
        
    Returns:
        Forecast results
    """
    time_series = np.array(historical_data)
    
    # Choose model
    if use_bidirectional:
        forecaster = BidirectionalLSTMForecaster(
            sequence_length=min(30, len(time_series) // 3),
            forecast_horizon=horizon
        )
    else:
        forecaster = LSTMForecaster(
            sequence_length=min(30, len(time_series) // 3),
            forecast_horizon=horizon,
            use_gru=False
        )
    
    # Train
    training_result = forecaster.train(time_series, epochs=50)
    
    # Forecast
    forecast_result = forecaster.forecast(time_series)
    
    return {
        'algorithm': 'Bidirectional_LSTM' if use_bidirectional else 'LSTM',
        'metric': metric_name,
        'training': training_result,
        'forecast': forecast_result['forecast'],
        'confidence_intervals': forecast_result['confidence_intervals'],
        'horizon': horizon
    }
