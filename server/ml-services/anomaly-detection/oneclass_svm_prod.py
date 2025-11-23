"""
Production-Ready One-Class SVM Anomaly Detector
Support Vector Machine for novelty detection
FIXED: Uses lifecycle hooks, deterministic preprocessing, proper artifact storage
"""

import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from base.ml_model_base import (
    AnomalyDetectorBase,
    TrainingResult,
    PredictionResult,
    TrainingError,
    PredictionError,
    LifecycleContext,
    ArtifactStore,
    PersistenceError
)
from base.preprocessing import FeatureExtractor, FeatureConfig
from base.schemas import validate_event_log


class OneClassSVMAnomalyDetector(AnomalyDetectorBase):
    """One-Class SVM for anomaly detection with production-ready lifecycle"""
    
    def __init__(
        self,
        model_id: str = "svm_default",
        kernel: str = 'rbf',
        nu: float = 0.05,
        gamma: str = 'scale'
    ):
        super().__init__(model_id, "oneclass_svm", nu)
        self.kernel = kernel
        self.nu = nu
        self.gamma = gamma
        
        # Deterministic feature extractor
        self.feature_extractor = FeatureExtractor(
            config=FeatureConfig(
                numerical_features=['duration', 'cost'],
                categorical_features=['activity', 'resource'],
                temporal_features=['timestamp'],
                use_normalization=True
            )
        )
        
        self.metadata.hyperparameters.update({
            'kernel': kernel,
            'nu': nu,
            'gamma': gamma
        })
    
    def before_train(self, context: LifecycleContext) -> None:
        """Lifecycle hook before training"""
        print(f"[{self.model_id}] Starting One-Class SVM training at {context.timestamp}")
        self.metadata.status = 'training'
    
    def after_train(self, context: LifecycleContext) -> None:
        """Lifecycle hook after training"""
        print(f"[{self.model_id}] One-Class SVM training completed")
        self.metadata.status = 'trained'
    
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """Train One-Class SVM with proper lifecycle"""
        # Invoke before_train hook
        context = LifecycleContext(
            model_id=self.model_id,
            model_type=self.model_type,
            operation='train',
            timestamp=datetime.now()
        )
        self.before_train(context)
        
        try:
            try:
                from sklearn.svm import OneClassSVM
            except ImportError:
                raise TrainingError(
                    "scikit-learn not available. Install with: pip install scikit-learn",
                    context={'dependency': 'scikit-learn'}
                )
            
            # Convert using deterministic feature extraction
            if isinstance(data, list) and data and isinstance(data[0], (dict, object)):
                try:
                    events = validate_event_log(data)
                    self.feature_extractor.fit(events)  # FIT during training
                    X = self.feature_extractor.transform(events)
                except Exception as e:
                    raise TrainingError(f"Feature extraction failed: {str(e)}")
            else:
                X = np.array(data)
            
            if len(X) < 10:
                raise TrainingError(
                    f"Insufficient training data: need at least 10 samples, got {len(X)}",
                    context={'samples': len(X)}
                )
            
            self.metadata.training_samples = len(X)
            
            # Train model
            self.model = OneClassSVM(kernel=self.kernel, nu=self.nu, gamma=self.gamma)
            self.model.fit(X)
            
            # Calculate threshold
            scores = self.model.decision_function(X)
            self.threshold = float(np.percentile(scores, self.nu * 100))
            
            self.is_trained = True
            
            predictions = self.model.predict(X)
            n_anomalies = np.sum(predictions == -1)
            
            metrics = {
                'training_samples': len(X),
                'anomalies_in_training': int(n_anomalies),
                'anomaly_rate': float(n_anomalies / len(X)),
                'threshold': self.threshold,
                'kernel': self.kernel,
                'nu': self.nu
            }
            
            self.metadata.performance_metrics = metrics
            
            # Invoke after_train hook
            self.after_train(context)
            
            return TrainingResult(
                success=True,
                metrics=metrics,
                metadata=self.metadata
            )
            
        except TrainingError:
            self.metadata.status = 'failed'
            raise
        except Exception as e:
            self.metadata.status = 'failed'
            raise TrainingError(f"Unexpected training error: {str(e)}", context={'error': str(e)})
    
    def predict(self, data: Any, **kwargs) -> PredictionResult:
        """Predict anomalies with proper lifecycle"""
        if not self.is_trained:
            raise PredictionError("Model must be trained before prediction")
        
        # Invoke before_predict hook
        context = LifecycleContext(
            model_id=self.model_id,
            model_type=self.model_type,
            operation='predict',
            timestamp=datetime.now()
        )
        self.before_predict(context)
        
        try:
            # Convert using SAME feature extractor (deterministic)
            if isinstance(data, list) and data and isinstance(data[0], (dict, object)):
                try:
                    events = validate_event_log(data)
                    X = self.feature_extractor.transform(events)  # Use fitted extractor
                except Exception as e:
                    raise PredictionError(f"Feature extraction failed: {str(e)}")
            else:
                X = np.array(data)
            
            predictions = self.model.predict(X)
            scores = self.model.decision_function(X)
            
            results = []
            for idx, (pred, score) in enumerate(zip(predictions, scores)):
                results.append({
                    'index': int(idx),
                    'is_anomaly': bool(pred == -1),
                    'anomaly_score': float(abs(score)),
                    'decision_score': float(score),
                    'severity': self._calculate_severity(score),
                    'confidence': float(abs(score - self.threshold) / abs(self.threshold)) if self.threshold else 1.0
                })
            
            # Invoke after_predict hook
            self.after_predict(context)
            
            return PredictionResult(
                predictions=results,
                metadata={
                    'model_type': 'oneclass_svm',
                    'total_samples': len(results),
                    'anomalies_detected': sum(1 for r in results if r['is_anomaly'])
                }
            )
            
        except PredictionError:
            raise
        except Exception as e:
            raise PredictionError(f"Unexpected prediction error: {str(e)}")
    
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
        
        metrics = {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'true_positives': int(tp),
            'false_positives': int(fp),
            'true_negatives': int(tn),
            'false_negatives': int(fn)
        }
        
        self.metadata.performance_metrics.update(metrics)
        
        return metrics
    
    def _calculate_severity(self, score: float) -> str:
        """Calculate severity level based on decision score"""
        if self.threshold is None:
            return 'unknown'
        
        if score < self.threshold * 2:
            return 'critical'
        elif score < self.threshold * 1.5:
            return 'high'
        elif score < self.threshold:
            return 'medium'
        else:
            return 'low'
    
    def save(self, path: Optional[str] = None) -> str:
        """Save with proper artifact storage"""
        if not self.is_trained:
            raise PersistenceError("Cannot save untrained model")
        
        # Call parent save (handles SVM model and creates base manifest)
        save_dir = super().save(path)
        save_dir_path = Path(save_dir)
        artifact_dir = save_dir_path / "artifacts"
        
        # Get the model artifact from parent save
        model_artifact = self.metadata.artifacts[0]
        
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
        
        # Replace artifacts list with complete set (prevents accumulation on repeated saves)
        self.metadata.artifacts = [model_artifact, extractor_spec, threshold_spec]
        
        # Re-save manifest
        manifest_path = save_dir_path / "manifest.json"
        with open(manifest_path, 'w') as f:
            from dataclasses import asdict
            import json
            json.dump(asdict(self.metadata), f, indent=2, default=str)
        
        return save_dir
    
    def load(self, path: str) -> None:
        """Load with proper artifact loading"""
        # Call parent load
        super().load(path)
        
        # ALSO load feature extractor and threshold
        load_dir = Path(path)
        artifact_dir = load_dir / "artifacts"
        
        for artifact_spec in self.metadata.artifacts:
            if artifact_spec.name == 'feature_extractor':
                extractor_path = artifact_dir / artifact_spec.filename
                self.feature_extractor = ArtifactStore.load(extractor_path, artifact_spec.artifact_type)
            elif artifact_spec.name == 'threshold':
                threshold_path = artifact_dir / artifact_spec.filename
                threshold_data = ArtifactStore.load(threshold_path, artifact_spec.artifact_type)
                self.threshold = threshold_data['threshold']
