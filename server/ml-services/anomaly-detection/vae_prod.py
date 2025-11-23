"""
Production-Ready Variational Autoencoder (VAE) Anomaly Detector
Probabilistic deep learning for anomaly detection
"""

import numpy as np
from typing import List, Dict, Any
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from base.ml_model_base import AnomalyDetectorBase, TrainingResult, PredictionResult, TrainingError


class VAEAnomalyDetector(AnomalyDetectorBase):
    """Variational Autoencoder for anomaly detection"""
    
    def __init__(
        self,
        model_id: str = "vae_default",
        latent_dim: int = 8,
        epochs: int = 50,
        contamination: float = 0.05
    ):
        super().__init__(model_id, "vae", contamination)
        self.latent_dim = latent_dim
        self.epochs = epochs
        self.input_dim = None
        self.scaler_mean = None
        self.scaler_std = None
        
        self.metadata.hyperparameters.update({
            'latent_dim': latent_dim,
            'epochs': epochs
        })
    
    def _scale_data(self, data: np.ndarray, fit: bool = False) -> np.ndarray:
        """Normalize data"""
        if fit:
            self.scaler_mean = np.mean(data, axis=0)
            self.scaler_std = np.std(data, axis=0)
        
        return (data - self.scaler_mean) / (self.scaler_std + 1e-8)
    
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """Train VAE"""
        try:
            import tensorflow as tf
            from tensorflow import keras
        except ImportError:
            raise TrainingError("tensorflow not available. Install with: pip install tensorflow")
        
        if isinstance(data, list):
            data = np.array(data)
        
        if len(data.shape) == 1:
            data = data.reshape(-1, 1)
        
        if len(data) < 20:
            raise TrainingError("Need at least 20 samples")
        
        self.metadata.status = 'training'
        self.metadata.training_samples = len(data)
        
        # Scale data
        scaled_data = self._scale_data(data, fit=True)
        self.input_dim = scaled_data.shape[1]
        
        # Build encoder
        encoder_inputs = keras.Input(shape=(self.input_dim,))
        h = keras.layers.Dense(32, activation='relu')(encoder_inputs)
        z_mean = keras.layers.Dense(self.latent_dim)(h)
        z_log_var = keras.layers.Dense(self.latent_dim)(h)
        
        # Sampling layer
        def sampling(args):
            z_mean, z_log_var = args
            epsilon = keras.backend.random_normal(shape=(keras.backend.shape(z_mean)[0], self.latent_dim))
            return z_mean + keras.backend.exp(0.5 * z_log_var) * epsilon
        
        z = keras.layers.Lambda(sampling)([z_mean, z_log_var])
        
        # Build decoder
        decoder_h = keras.layers.Dense(32, activation='relu')
        decoder_output = keras.layers.Dense(self.input_dim)
        
        h_decoded = decoder_h(z)
        x_decoded = decoder_output(h_decoded)
        
        # Build VAE
        self.model = keras.Model(encoder_inputs, x_decoded)
        
        # VAE loss
        reconstruction_loss = keras.losses.mse(encoder_inputs, x_decoded)
        reconstruction_loss *= self.input_dim
        kl_loss = 1 + z_log_var - keras.backend.square(z_mean) - keras.backend.exp(z_log_var)
        kl_loss = keras.backend.sum(kl_loss, axis=-1)
        kl_loss *= -0.5
        vae_loss = keras.backend.mean(reconstruction_loss + kl_loss)
        
        self.model.add_loss(vae_loss)
        self.model.compile(optimizer='adam')
        
        # Train
        self.model.fit(
            scaled_data, None,
            epochs=self.epochs,
            batch_size=32,
            verbose=0
        )
        
        # Calculate reconstruction errors
        reconstructions = self.model.predict(scaled_data, verbose=0)
        mse = np.mean(np.square(scaled_data - reconstructions), axis=1)
        
        # Set threshold
        self.threshold = np.percentile(mse, (1 - self.contamination) * 100)
        
        self.is_trained = True
        self.metadata.status = 'trained'
        
        n_anomalies = np.sum(mse > self.threshold)
        
        metrics = {
            'training_samples': len(data),
            'latent_dim': self.latent_dim,
            'threshold': float(self.threshold),
            'anomalies_in_training': int(n_anomalies)
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
        
        # Scale data
        scaled_data = self._scale_data(data, fit=False)
        
        # Get reconstructions
        reconstructions = self.model.predict(scaled_data, verbose=0)
        mse = np.mean(np.square(scaled_data - reconstructions), axis=1)
        
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
            metadata={'model_type': 'vae', 'total_samples': len(results)}
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
