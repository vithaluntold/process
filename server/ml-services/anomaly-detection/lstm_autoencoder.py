"""
LSTM Autoencoder for Temporal Anomaly Detection
Detects unusual temporal patterns in process execution sequences
"""

import numpy as np
from typing import List, Dict, Any, Tuple
import json


class LSTMAutoencoder:
    """LSTM-based autoencoder for temporal anomaly detection in process mining"""
    
    def __init__(self, sequence_length: int = 10, latent_dim: int = 32):
        """
        Initialize LSTM Autoencoder
        
        Args:
            sequence_length: Length of input sequences
            latent_dim: Dimension of latent space
        """
        self.sequence_length = sequence_length
        self.latent_dim = latent_dim
        self.model = None
        self.threshold = None
        self.is_trained = False
        
    def build_model(self, input_dim: int):
        """Build LSTM autoencoder architecture"""
        try:
            import tensorflow as tf
            from tensorflow import keras
            from tensorflow.keras import layers
            
            # Encoder
            encoder_inputs = keras.Input(shape=(self.sequence_length, input_dim))
            encoder_lstm1 = layers.LSTM(128, return_sequences=True)(encoder_inputs)
            encoder_lstm2 = layers.LSTM(64, return_sequences=True)(encoder_lstm1)
            encoder_lstm3 = layers.LSTM(self.latent_dim, return_sequences=False)(encoder_lstm2)
            
            # Decoder
            decoder_input = layers.RepeatVector(self.sequence_length)(encoder_lstm3)
            decoder_lstm1 = layers.LSTM(self.latent_dim, return_sequences=True)(decoder_input)
            decoder_lstm2 = layers.LSTM(64, return_sequences=True)(decoder_lstm1)
            decoder_lstm3 = layers.LSTM(128, return_sequences=True)(decoder_lstm2)
            decoder_output = layers.TimeDistributed(layers.Dense(input_dim))(decoder_lstm3)
            
            # Create model
            self.model = keras.Model(encoder_inputs, decoder_output)
            self.model.compile(optimizer='adam', loss='mse')
            
            return True
        except ImportError:
            return False
    
    def prepare_sequences(self, data: np.ndarray) -> np.ndarray:
        """Convert data to sequences for LSTM"""
        sequences = []
        for i in range(len(data) - self.sequence_length + 1):
            sequences.append(data[i:i + self.sequence_length])
        return np.array(sequences)
    
    def train(self, normal_data: np.ndarray, epochs: int = 50, batch_size: int = 32) -> Dict[str, Any]:
        """
        Train autoencoder on normal process data
        
        Args:
            normal_data: Normal process sequences (n_samples, n_features)
            epochs: Training epochs
            batch_size: Batch size
            
        Returns:
            Training history
        """
        if not self.build_model(normal_data.shape[1]):
            raise ImportError("TensorFlow not available. Install with: pip install tensorflow")
        
        # Prepare sequences
        sequences = self.prepare_sequences(normal_data)
        
        # Train
        history = self.model.fit(
            sequences, sequences,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=0
        )
        
        # Calculate threshold (95th percentile of reconstruction error)
        reconstructions = self.model.predict(sequences, verbose=0)
        mse = np.mean(np.power(sequences - reconstructions, 2), axis=(1, 2))
        self.threshold = np.percentile(mse, 95)
        self.is_trained = True
        
        return {
            'loss': history.history['loss'][-1],
            'val_loss': history.history['val_loss'][-1],
            'threshold': float(self.threshold)
        }
    
    def detect_anomalies(self, data: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect anomalies in process data
        
        Args:
            data: Process sequences to analyze
            
        Returns:
            List of anomalies with scores and details
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before detection")
        
        sequences = self.prepare_sequences(data)
        reconstructions = self.model.predict(sequences, verbose=0)
        
        # Calculate reconstruction errors
        mse = np.mean(np.power(sequences - reconstructions, 2), axis=(1, 2))
        
        anomalies = []
        for idx, error in enumerate(mse):
            if error > self.threshold:
                anomalies.append({
                    'index': int(idx),
                    'reconstruction_error': float(error),
                    'threshold': float(self.threshold),
                    'anomaly_score': float(min(error / self.threshold, 10.0)),
                    'severity': self._calculate_severity(error),
                    'type': 'temporal_pattern_anomaly',
                    'description': f'Unusual temporal pattern detected (error: {error:.4f})'
                })
        
        return anomalies
    
    def _calculate_severity(self, error: float) -> str:
        """Calculate severity based on reconstruction error"""
        ratio = error / self.threshold
        if ratio > 3.0:
            return 'critical'
        elif ratio > 2.0:
            return 'high'
        elif ratio > 1.5:
            return 'medium'
        else:
            return 'low'
    
    def save_model(self, path: str):
        """Save trained model"""
        if self.model is not None:
            self.model.save(path)
            with open(f"{path}_config.json", 'w') as f:
                json.dump({
                    'sequence_length': self.sequence_length,
                    'latent_dim': self.latent_dim,
                    'threshold': float(self.threshold) if self.threshold else None
                }, f)
    
    def load_model(self, path: str):
        """Load pre-trained model"""
        import tensorflow as tf
        self.model = tf.keras.models.load_model(path)
        with open(f"{path}_config.json", 'r') as f:
            config = json.load(f)
            self.sequence_length = config['sequence_length']
            self.latent_dim = config['latent_dim']
            self.threshold = config['threshold']
        self.is_trained = True


def analyze_process_with_lstm_ae(
    event_data: List[Dict[str, Any]],
    sequence_length: int = 10,
    train_on_normal: bool = True
) -> Dict[str, Any]:
    """
    Analyze process events using LSTM Autoencoder
    
    Args:
        event_data: List of process events with features
        sequence_length: Length of sequences to analyze
        train_on_normal: Whether to train on data (assumed normal)
        
    Returns:
        Detection results with anomalies
    """
    # Extract features from events
    features = np.array([[
        event.get('duration', 0),
        event.get('resource_id', 0),
        event.get('hour_of_day', 0),
        event.get('day_of_week', 0)
    ] for event in event_data])
    
    # Normalize features
    features = (features - features.mean(axis=0)) / (features.std(axis=0) + 1e-8)
    
    # Create and train model
    lstm_ae = LSTMAutoencoder(sequence_length=sequence_length)
    
    if train_on_normal:
        training_result = lstm_ae.train(features)
    
    # Detect anomalies
    anomalies = lstm_ae.detect_anomalies(features)
    
    return {
        'algorithm': 'LSTM_Autoencoder',
        'total_events': len(event_data),
        'anomalies_detected': len(anomalies),
        'anomalies': anomalies,
        'model_info': {
            'sequence_length': sequence_length,
            'threshold': float(lstm_ae.threshold) if lstm_ae.threshold else None
        }
    }
