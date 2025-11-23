"""
Production-Ready DBSCAN Anomaly Detector
Density-based clustering for anomaly detection
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


class DBSCANAnomalyDetector(AnomalyDetectorBase):
    """DBSCAN-based anomaly detection with production-ready lifecycle"""
    
    def __init__(
        self,
        model_id: str = "dbscan_default",
        eps: float = 0.5,
        min_samples: int = 5,
        contamination: float = 0.05
    ):
        super().__init__(model_id, "dbscan", contamination)
        self.eps = eps
        self.min_samples = min_samples
        
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
            'eps': eps,
            'min_samples': min_samples
        })
    
    def before_train(self, context: LifecycleContext) -> None:
        """Lifecycle hook before training"""
        print(f"[{self.model_id}] Starting DBSCAN training at {context.timestamp}")
        self.metadata.status = 'training'
    
    def after_train(self, context: LifecycleContext) -> None:
        """Lifecycle hook after training"""
        print(f"[{self.model_id}] DBSCAN training completed")
        self.metadata.status = 'trained'
    
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """Train DBSCAN with proper lifecycle"""
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
                from sklearn.cluster import DBSCAN
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
            
            if len(X) < self.min_samples:
                raise TrainingError(
                    f"Insufficient data: need at least {self.min_samples} samples, got {len(X)}",
                    context={'samples': len(X), 'min_required': self.min_samples}
                )
            
            self.metadata.training_samples = len(X)
            
            # Fit DBSCAN
            self.model = DBSCAN(eps=self.eps, min_samples=self.min_samples, n_jobs=-1)
            labels = self.model.fit_predict(X)
            
            # Points labeled -1 are anomalies
            n_anomalies = np.sum(labels == -1)
            n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
            
            self.is_trained = True
            
            metrics = {
                'training_samples': len(X),
                'anomalies_detected': int(n_anomalies),
                'anomaly_rate': float(n_anomalies / len(X)),
                'n_clusters': int(n_clusters),
                'eps': self.eps,
                'min_samples': self.min_samples
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
        """Detect anomalies with proper lifecycle"""
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
            
            # Re-run clustering on new data
            labels = self.model.fit_predict(X)
            
            results = []
            for idx, label in enumerate(labels):
                results.append({
                    'index': int(idx),
                    'is_anomaly': bool(label == -1),
                    'cluster_id': int(label) if label != -1 else None,
                    'anomaly_score': 1.0 if label == -1 else 0.0,
                    'severity': 'high' if label == -1 else 'low'
                })
            
            # Invoke after_predict hook
            self.after_predict(context)
            
            return PredictionResult(
                predictions=results,
                metadata={
                    'model_type': 'dbscan',
                    'total_samples': len(results),
                    'anomalies_detected': sum(1 for r in results if r['is_anomaly'])
                }
            )
            
        except PredictionError:
            raise
        except Exception as e:
            raise PredictionError(f"Unexpected prediction error: {str(e)}")
    
    def detect_anomalies(self, data: Any) -> List[Dict[str, Any]]:
        """Return only anomalous records"""
        pred_result = self.predict(data)
        return [p for p in pred_result.predictions if p['is_anomaly']]
    
    def evaluate(self, data: Any, labels: Any, **kwargs) -> Dict[str, float]:
        """Evaluate against ground truth"""
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
    
    def save(self, path: Optional[str] = None) -> str:
        """Save with proper artifact storage"""
        if not self.is_trained:
            raise PersistenceError("Cannot save untrained model")
        
        # Call parent save (handles DBSCAN model and creates base manifest)
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
        
        # Replace artifacts list with complete set (prevents accumulation on repeated saves)
        self.metadata.artifacts = [model_artifact, extractor_spec]
        
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
        
        # ALSO load feature extractor
        load_dir = Path(path)
        artifact_dir = load_dir / "artifacts"
        
        for artifact_spec in self.metadata.artifacts:
            if artifact_spec.name == 'feature_extractor':
                extractor_path = artifact_dir / artifact_spec.filename
                self.feature_extractor = ArtifactStore.load(extractor_path, artifact_spec.artifact_type)
