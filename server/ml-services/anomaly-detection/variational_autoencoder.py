"""
Variational Autoencoder (VAE) for Probabilistic Anomaly Detection
Models probability distributions of normal process states
"""

import numpy as np
from typing import List, Dict, Any, Tuple
import json


class VariationalAutoencoder:
    """VAE for probabilistic anomaly detection in process mining"""
    
    def __init__(self, latent_dim: int = 16):
        """
        Initialize Variational Autoencoder
        
        Args:
            latent_dim: Dimension of latent space
        """
        self.latent_dim = latent_dim
        self.model = None
        self.encoder = None
        self.decoder = None
        self.threshold = None
        self.is_trained = False
        
    def sampling(self, args):
        """Reparameterization trick for VAE"""
        import tensorflow as tf
        z_mean, z_log_var = args
        batch = tf.shape(z_mean)[0]
        dim = tf.shape(z_mean)[1]
        epsilon = tf.keras.backend.random_normal(shape=(batch, dim))
        return z_mean + tf.exp(0.5 * z_log_var) * epsilon
    
    def build_model(self, input_dim: int):
        """Build VAE architecture"""
        try:
            import tensorflow as tf
            from tensorflow import keras
            from tensorflow.keras import layers
            
            # Encoder
            encoder_inputs = keras.Input(shape=(input_dim,))
            x = layers.Dense(256, activation='relu')(encoder_inputs)
            x = layers.Dense(128, activation='relu')(x)
            z_mean = layers.Dense(self.latent_dim, name='z_mean')(x)
            z_log_var = layers.Dense(self.latent_dim, name='z_log_var')(x)
            
            # Sampling layer
            z = layers.Lambda(self.sampling, name='z')([z_mean, z_log_var])
            
            self.encoder = keras.Model(encoder_inputs, [z_mean, z_log_var, z], name='encoder')
            
            # Decoder
            latent_inputs = keras.Input(shape=(self.latent_dim,))
            x = layers.Dense(128, activation='relu')(latent_inputs)
            x = layers.Dense(256, activation='relu')(x)
            decoder_outputs = layers.Dense(input_dim, activation='sigmoid')(x)
            
            self.decoder = keras.Model(latent_inputs, decoder_outputs, name='decoder')
            
            # VAE Model
            outputs = self.decoder(self.encoder(encoder_inputs)[2])
            self.model = keras.Model(encoder_inputs, outputs, name='vae')
            
            # VAE Loss
            reconstruction_loss = keras.losses.mse(encoder_inputs, outputs)
            reconstruction_loss *= input_dim
            kl_loss = 1 + z_log_var - tf.square(z_mean) - tf.exp(z_log_var)
            kl_loss = tf.reduce_mean(kl_loss)
            kl_loss *= -0.5
            vae_loss = tf.reduce_mean(reconstruction_loss + kl_loss)
            
            self.model.add_loss(vae_loss)
            self.model.compile(optimizer='adam')
            
            return True
        except ImportError:
            return False
    
    def train(self, normal_data: np.ndarray, epochs: int = 100, batch_size: int = 32) -> Dict[str, Any]:
        """
        Train VAE on normal process data
        
        Args:
            normal_data: Normal process features (n_samples, n_features)
            epochs: Training epochs
            batch_size: Batch size
            
        Returns:
            Training history
        """
        if not self.build_model(normal_data.shape[1]):
            raise ImportError("TensorFlow not available")
        
        # Normalize data
        self.mean = normal_data.mean(axis=0)
        self.std = normal_data.std(axis=0) + 1e-8
        normalized_data = (normal_data - self.mean) / self.std
        
        # Train
        history = self.model.fit(
            normalized_data, normalized_data,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=0
        )
        
        # Calculate threshold using reconstruction probability
        reconstructions = self.model.predict(normalized_data, verbose=0)
        reconstruction_errors = np.mean(np.power(normalized_data - reconstructions, 2), axis=1)
        self.threshold = np.percentile(reconstruction_errors, 95)
        self.is_trained = True
        
        return {
            'loss': float(history.history['loss'][-1]),
            'val_loss': float(history.history['val_loss'][-1]) if 'val_loss' in history.history else None,
            'threshold': float(self.threshold)
        }
    
    def detect_anomalies(self, data: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect anomalies using probabilistic modeling
        
        Args:
            data: Process features to analyze
            
        Returns:
            List of anomalies with uncertainty scores
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before detection")
        
        # Normalize
        normalized_data = (data - self.mean) / self.std
        
        # Get reconstructions and latent representations
        reconstructions = self.model.predict(normalized_data, verbose=0)
        z_mean, z_log_var, _ = self.encoder.predict(normalized_data, verbose=0)
        
        # Calculate reconstruction errors
        reconstruction_errors = np.mean(np.power(normalized_data - reconstructions, 2), axis=1)
        
        # Calculate uncertainty (from latent space variance)
        uncertainty = np.mean(np.exp(z_log_var), axis=1)
        
        anomalies = []
        for idx, error in enumerate(reconstruction_errors):
            if error > self.threshold:
                anomalies.append({
                    'index': int(idx),
                    'reconstruction_error': float(error),
                    'uncertainty': float(uncertainty[idx]),
                    'threshold': float(self.threshold),
                    'anomaly_score': float(min(error / self.threshold, 10.0)),
                    'severity': self._calculate_severity(error, uncertainty[idx]),
                    'type': 'probabilistic_anomaly',
                    'description': f'Rare process state (error: {error:.4f}, uncertainty: {uncertainty[idx]:.4f})'
                })
        
        return anomalies
    
    def _calculate_severity(self, error: float, uncertainty: float) -> str:
        """Calculate severity based on error and uncertainty"""
        ratio = error / self.threshold
        if ratio > 3.0 or uncertainty > 2.0:
            return 'critical'
        elif ratio > 2.0 or uncertainty > 1.5:
            return 'high'
        elif ratio > 1.5 or uncertainty > 1.0:
            return 'medium'
        else:
            return 'low'


def analyze_process_with_vae(
    event_data: List[Dict[str, Any]],
    latent_dim: int = 16
) -> Dict[str, Any]:
    """
    Analyze process events using Variational Autoencoder
    
    Args:
        event_data: List of process events
        latent_dim: Dimension of latent space
        
    Returns:
        Detection results with probabilistic anomalies
    """
    # Extract features
    features = np.array([[
        event.get('duration', 0),
        event.get('resource_id', 0),
        event.get('cost', 0),
        event.get('priority', 0),
        event.get('complexity', 0)
    ] for event in event_data])
    
    # Create and train VAE
    vae = VariationalAutoencoder(latent_dim=latent_dim)
    training_result = vae.train(features)
    
    # Detect anomalies
    anomalies = vae.detect_anomalies(features)
    
    return {
        'algorithm': 'Variational_Autoencoder',
        'total_events': len(event_data),
        'anomalies_detected': len(anomalies),
        'anomalies': anomalies,
        'model_info': {
            'latent_dim': latent_dim,
            'threshold': training_result['threshold']
        }
    }
