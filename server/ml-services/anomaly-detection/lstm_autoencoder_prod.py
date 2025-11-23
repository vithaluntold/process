"""
Production-Ready LSTM Autoencoder Anomaly Detector
Deep learning reconstruction-based anomaly detection
"""

import numpy as np
from typing import List, Dict, Any
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from base.ml_model_base import AnomalyDetectorBase, TrainingResult, PredictionResult, TrainingError


class LSTMAutoencoderDetector(AnomalyDetectorBase):
    """LSTM Autoencoder for anomaly detection"""
    
    def __init__(
        self,
        model_id: str = "lstm_ae_default",
        sequence_length: int = 10,
        encoding_dim: int = 8,
        epochs: int = 50,
        contamination: float = 0.05
    ):
        super().__init__(model_id, "lstm_autoencoder", contamination)
        self.sequence_length = sequence_length
        self.encoding_dim = encoding_dim
        self.epochs = epochs
        self.scaler_mean = None
        self.scaler_std = None
        
        self.metadata.hyperparameters.update({
            'sequence_length': sequence_length,
            'encoding_dim': encoding_dim,
            'epochs': epochs
        })
    
    def _scale_data(self, data: np.ndarray, fit: bool = False) -> np.ndarray:
        """Normalize data"""
        if fit:
            self.scaler_mean = np.mean(data, axis=0)
            self.scaler_std = np.std(data, axis=0)
        
        return (data - self.scaler_mean) / (self.scaler_std + 1e-8)
    
    def _create_sequences(self, data: np.ndarray) -> np.ndarray:
        """Create LSTM sequences"""
        X = []
        
        for i in range(len(data) - self.sequence_length + 1):
            X.append(data[i:i + self.sequence_length])
        
        return np.array(X)
    
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """Train LSTM Autoencoder"""
        try:
            import tensorflow as tf
            from tensorflow import keras
        except ImportError:
            raise TrainingError("tensorflow not available. Install with: pip install tensorflow")
        
        if isinstance(data, list):
            data = np.array(data)
        
        if len(data.shape) == 1:
            data = data.reshape(-1, 1)
        
        if len(data) < self.sequence_length + 10:
            raise TrainingError(f"Need at least {self.sequence_length + 10} samples")
        
        self.metadata.status = 'training'
        
        # Scale data
        scaled_data = self._scale_data(data, fit=True)
        
        # Create sequences
        X = self._create_sequences(scaled_data)
        n_features = X.shape[2]
        
        self.metadata.training_samples = len(X)
        
        # Build autoencoder
        encoder = keras.Sequential([
            keras.layers.LSTM(self.encoding_dim, input_shape=(self.sequence_length, n_features))
        ])
        
        decoder = keras.Sequential([
            keras.layers.RepeatVector(self.sequence_length),
            keras.layers.LSTM(n_features, return_sequences=True)
        ])
        
        self.model = keras.Sequential([encoder, decoder])
        self.model.compile(optimizer='adam', loss='mse')
        
        # Train
        self.model.fit(
            X, X,
            epochs=self.epochs,
            batch_size=32,
            verbose=0
        )
        
        # Calculate reconstruction errors
        reconstructions = self.model.predict(X, verbose=0)
        mse = np.mean(np.square(X - reconstructions), axis=(1, 2))
        
        # Set threshold at contamination percentile
        self.threshold = np.percentile(mse, (1 - self.contamination) * 100)
        
        self.is_trained = True
        self.metadata.status = 'trained'
        
        n_anomalies = np.sum(mse > self.threshold)
        
        metrics = {
            'training_samples': len(X),
            'sequence_length': self.sequence_length,
            'encoding_dim': self.encoding_dim,
            'threshold': float(self.threshold),
            'anomalies_in_training': int(n_anomalies),
            'anomaly_rate': float(n_anomalies / len(X))
        }
        
        self.metadata.performance_metrics = metrics
        
        return TrainingResult(
            success=True,
            metrics=metrics,
            metadata=self.metadata
        )
    
    def predict(self, data: Any, **kwargs) -> PredictionResult:
        """Detect anomalies"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        if isinstance(data, list):
            data = np.array(data)
        
        if len(data.shape) == 1:
            data = data.reshape(-1, 1)
        
        # Scale and create sequences
        scaled_data = self._scale_data(data, fit=False)
        X = self._create_sequences(scaled_data)
        
        # Get reconstructions
        reconstructions = self.model.predict(X, verbose=0)
        mse = np.mean(np.square(X - reconstructions), axis=(1, 2))
        
        # Detect anomalies
        results = []
        for idx, error in enumerate(mse):
            is_anomaly = error > self.threshold
            results.append({
                'index': int(idx),
                'is_anomaly': bool(is_anomaly),
                'anomaly_score': float(error),
                'reconstruction_error': float(error),
                'severity': 'critical' if error > self.threshold * 2 else 'high' if is_anomaly else 'low',
                'confidence': float(error / self.threshold) if self.threshold > 0 else 1.0
            })
        
        return PredictionResult(
            predictions=results,
            metadata={'model_type': 'lstm_autoencoder', 'total_samples': len(results)}
        )
    
    def detect_anomalies(self, data: Any) -> List[Dict[str, Any]]:
        """Return only anomalies"""
        pred_result = self.predict(data)
        return [p for p in pred_result.predictions if p['is_anomaly']]
    
    def evaluate(self, data: Any, labels: Any, **kwargs) -> Dict[str, float]:
        """Evaluate performance"""
        predictions = self.predict(data).predictions
        pred_labels = [1 if p['is_anomaly'] else 0 for p in predictions]
        
        labels = np.array(labels)
        pred_labels = np.array(pred_labels)
        
        # Handle length mismatch due to sequence creation
        min_len = min(len(pred_labels), len(labels))
        pred_labels = pred_labels[:min_len]
        labels = labels[:min_len]
        
        tp = np.sum((pred_labels == 1) & (labels == 1))
        fp = np.sum((pred_labels == 1) & (labels == 0))
        tn = np.sum((pred_labels == 0) & (labels == 0))
        fn = np.sum((pred_labels == 0) & (labels == 1))
        
        total = len(labels)
        accuracy = (tp + tn) / total if total > 0 else 0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        return {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1)
        }
