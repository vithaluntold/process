"""
Production-Ready LSTM Autoencoder Anomaly Detector
Deep learning reconstruction-based anomaly detection with proper lifecycle management
"""

import numpy as np
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path
import json
from dataclasses import asdict

sys.path.append(str(Path(__file__).parent.parent))

from base.ml_model_base import (
    AnomalyDetectorBase, TrainingResult, PredictionResult, TrainingError,
    PersistenceError, ArtifactStore, LifecycleContext
)
from base.preprocessing import FeatureExtractor


class LSTMAutoencoderDetector(AnomalyDetectorBase):
    """
    Production-Ready LSTM Autoencoder for anomaly detection
    
    Features:
    - Deterministic preprocessing with FeatureExtractor
    - Lifecycle hooks (before_train, after_train, before_predict, etc.)
    - Complete artifact persistence (TensorFlow model + scaler + threshold)
    - Proper save/load cycle
    """
    
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
        self.feature_extractor: Optional[FeatureExtractor] = None
        
        self.metadata.hyperparameters.update({
            'sequence_length': sequence_length,
            'encoding_dim': encoding_dim,
            'epochs': epochs
        })
    
    def _create_sequences(self, data: np.ndarray) -> np.ndarray:
        """Create LSTM sequences"""
        X = []
        for i in range(len(data) - self.sequence_length + 1):
            X.append(data[i:i + self.sequence_length])
        return np.array(X)
    
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """
        Train LSTM Autoencoder with production-ready lifecycle management
        
        Args:
            data: Time series data (array-like)
            **kwargs: Additional training parameters
        
        Returns:
            TrainingResult with metrics and metadata
        """
        # Lifecycle hook: before training
        from datetime import datetime
        context = LifecycleContext(
            model_id=self.model_id,
            model_type=self.model_type,
            operation='train',
            timestamp=datetime.now()
        )
        self.before_train(context)
        
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
        
        # Deterministic preprocessing with FeatureExtractor
        from base.preprocessing import FeatureConfig
        config = FeatureConfig(scaling='standard', feature_selection=False)
        self.feature_extractor = FeatureExtractor(config)
        
        # Fit and transform data
        scaled_data = self.feature_extractor.fit_transform(data)
        
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
        
        # Lifecycle hook: after training (fresh context)
        after_context = LifecycleContext(
            model_id=self.model_id,
            model_type=self.model_type,
            operation='train',
            timestamp=datetime.now()
        )
        self.after_train(after_context)
        
        return TrainingResult(
            success=True,
            metrics=metrics,
            metadata=self.metadata
        )
    
    def predict(self, data: Any, **kwargs) -> PredictionResult:
        """
        Detect anomalies with production-ready lifecycle management
        
        Args:
            data: Time series data (array-like)
            **kwargs: Additional prediction parameters
        
        Returns:
            PredictionResult with anomaly detections
        """
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        # Explicit error handling for missing artifacts
        if self.feature_extractor is None:
            raise PersistenceError("feature_extractor not loaded - model state incomplete")
        if self.threshold is None:
            raise ValueError("threshold not set - model not properly trained or loaded")
        
        # Lifecycle hook: before prediction
        from datetime import datetime
        context = LifecycleContext(
            model_id=self.model_id,
            model_type=self.model_type,
            operation='predict',
            timestamp=datetime.now()
        )
        self.before_predict(context)
        
        if isinstance(data, list):
            data = np.array(data)
        
        if len(data.shape) == 1:
            data = data.reshape(-1, 1)
        
        # Validate sufficient data for sequence creation
        if len(data) < self.sequence_length:
            from base.ml_model_base import PredictionError
            raise PredictionError(
                f"Insufficient data: need at least {self.sequence_length} samples, got {len(data)}. "
                f"Provide more historical data for sequence-based prediction."
            )
        
        # Deterministic preprocessing (use fitted extractor)
        scaled_data = self.feature_extractor.transform(data)
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
        
        # Lifecycle hook: after prediction (fresh context)
        after_context = LifecycleContext(
            model_id=self.model_id,
            model_type=self.model_type,
            operation='predict',
            timestamp=datetime.now()
        )
        self.after_predict(after_context)
        
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
    
    def save(self, path: Optional[str] = None) -> str:
        """
        Save model with proper artifact persistence
        
        CRITICAL: TensorFlow models need special handling (save as .keras format)
        Also saves feature_extractor and threshold artifacts
        
        Returns:
            Path to saved model directory
        """
        if not self.is_trained:
            raise PersistenceError("Cannot save untrained model")
        
        # Lifecycle hook: before save
        from datetime import datetime
        context = LifecycleContext(
            model_id=self.model_id,
            model_type=self.model_type,
            operation='save',
            timestamp=datetime.now()
        )
        self.before_save(context)
        
        # Setup save directory
        save_dir = Path(path) if path else self.model_dir
        artifact_dir = save_dir / "artifacts"
        artifact_dir.mkdir(parents=True, exist_ok=True)
        
        # Save TensorFlow model using ArtifactStore (with proper checksum)
        model_path = artifact_dir / "model.keras"
        model_spec = ArtifactStore.save(
            self.model, model_path, 'tensorflow', name='model'
        )
        
        # Save feature extractor
        extractor_path = artifact_dir / "feature_extractor.joblib"
        extractor_spec = ArtifactStore.save(
            self.feature_extractor, extractor_path, 'joblib', name='feature_extractor'
        )
        
        # Save threshold
        threshold_path = artifact_dir / "threshold.json"
        threshold_spec = ArtifactStore.save(
            {'threshold': self.threshold}, threshold_path, 'json', name='threshold'
        )
        
        # Build complete artifacts list (prevents accumulation on repeated saves)
        from datetime import datetime
        self.metadata.artifacts = [model_spec, extractor_spec, threshold_spec]
        self.metadata.trained_at = datetime.now().isoformat()
        
        # Save manifest
        manifest_path = save_dir / "manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(asdict(self.metadata), f, indent=2, default=str)
        
        # Lifecycle hook: after save
        after_context = LifecycleContext(
            model_id=self.model_id,
            model_type=self.model_type,
            operation='save',
            timestamp=datetime.now()
        )
        self.after_save(after_context)
        
        return str(save_dir)
    
    def load(self, path: str) -> None:
        """
        Load model with complete state restoration
        
        Args:
            path: Path to model directory
        """
        try:
            import tensorflow as tf
            from tensorflow import keras
        except ImportError:
            raise PersistenceError("tensorflow not available for loading")
        
        load_dir = Path(path)
        manifest_path = load_dir / "manifest.json"
        artifact_dir = load_dir / "artifacts"
        
        # Load manifest
        with open(manifest_path, 'r') as f:
            manifest_dict = json.load(f)
        
        # Convert to dataclass
        from base.ml_model_base import ArtifactSpec, ModelManifest, ManifestValidator
        manifest_dict['artifacts'] = [
            ArtifactSpec(**a) for a in manifest_dict.get('artifacts', [])
        ]
        self.metadata = ModelManifest(**manifest_dict)
        
        # Validate manifest (ensures artifact integrity)
        ManifestValidator.validate(self.metadata, artifact_dir)
        
        # Load artifacts using ArtifactStore
        for artifact_spec in self.metadata.artifacts:
            artifact_path = artifact_dir / artifact_spec.filename
            if artifact_spec.name == 'model':
                self.model = ArtifactStore.load(artifact_path, artifact_spec.artifact_type)
            elif artifact_spec.name == 'feature_extractor':
                self.feature_extractor = ArtifactStore.load(artifact_path, artifact_spec.artifact_type)
            elif artifact_spec.name == 'threshold':
                threshold_data = ArtifactStore.load(artifact_path, artifact_spec.artifact_type)
                self.threshold = threshold_data['threshold']
        
        # Verify all required artifacts were loaded
        if self.model is None:
            raise PersistenceError("Failed to load model artifact")
        if self.feature_extractor is None:
            raise PersistenceError("Failed to load feature_extractor artifact")
        if self.threshold is None:
            raise PersistenceError("Failed to load threshold artifact")
        
        self.is_trained = True
        
        # Lifecycle hook
        from datetime import datetime
        context = LifecycleContext(
            model_id=self.model_id,
            model_type=self.model_type,
            operation='load',
            timestamp=datetime.now()
        )
        self.after_load(context)
