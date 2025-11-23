"""
PROPERLY WORKING Production-Ready Isolation Forest
Correctly uses the foundation with lifecycle hooks and proper persistence
"""

import numpy as np
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

# Use CORRECT imports from redesigned foundation
from base.ml_model_base import (
    AnomalyDetectorBase,
    TrainingResult,
    PredictionResult,
    TrainingError,
    PredictionError,
    LifecycleContext,
    ArtifactStore
)
from base.preprocessing import FeatureExtractor, FeatureConfig
from base.schemas import validate_event_log, AnomalyDetectionInput


class IsolationForestDetector(AnomalyDetectorBase):
    """
    Properly integrated Isolation Forest detector
    Uses deterministic preprocessing, lifecycle hooks, and proper artifact storage
    """
    
    def __init__(
        self,
        model_id: str = "isolation_forest_fixed",
        n_estimators: int = 100,
        contamination: float = 0.05,
        random_state: int = 42
    ):
        super().__init__(model_id, "isolation_forest", contamination)
        self.n_estimators = n_estimators
        self.random_state = random_state
        
        # Initialize deterministic feature extractor
        self.feature_extractor = FeatureExtractor(
            config=FeatureConfig(
                numerical_features=['duration', 'cost'],
                categorical_features=['activity', 'resource'],
                temporal_features=['timestamp'],
                use_normalization=True
            )
        )
        
        self.metadata.hyperparameters.update({
            'n_estimators': n_estimators,
            'random_state': random_state,
            'contamination': contamination
        })
    
    def before_train(self, context: LifecycleContext) -> None:
        """Lifecycle hook before training"""
        print(f"[{self.model_id}] Starting training at {context.timestamp}")
        self.metadata.status = 'training'
    
    def after_train(self, context: LifecycleContext) -> None:
        """Lifecycle hook after training"""
        print(f"[{self.model_id}] Training completed at {context.timestamp}")
        self.metadata.status = 'trained'
    
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """Train Isolation Forest with proper lifecycle and error handling"""
        # Invoke before_train hook
        context = LifecycleContext(
            model_id=self.model_id,
            model_type=self.model_type,
            operation='train',
            timestamp=datetime.now()
        )
        self.before_train(context)
        
        try:
            # Import sklearn with proper error handling
            try:
                from sklearn.ensemble import IsolationForest
            except ImportError:
                raise TrainingError(
                    "scikit-learn not available. Install with: pip install scikit-learn",
                    context={'dependency': 'scikit-learn'}
                )
            
            # Convert data using deterministic feature extraction
            if isinstance(data, list) and data and isinstance(data[0], (dict, object)):
                try:
                    events = validate_event_log(data)
                    # FIT feature extractor for deterministic encoding
                    self.feature_extractor.fit(events)
                    X = self.feature_extractor.transform(events)
                except Exception as e:
                    raise TrainingError(f"Feature extraction failed: {str(e)}", context={'error': str(e)})
            else:
                X = np.array(data)
            
            # Validate data
            if len(X) < 10:
                raise TrainingError(
                    f"Insufficient training data: need at least 10 samples, got {len(X)}",
                    context={'samples': len(X)}
                )
            
            # Update training samples
            self.metadata.training_samples = len(X)
            
            # Train model
            self.model = IsolationForest(
                contamination=self.contamination,
                n_estimators=self.n_estimators,
                max_samples=min(256, len(X)),
                random_state=self.random_state,
                n_jobs=-1
            )
            
            self.model.fit(X)
            
            # Calculate threshold
            scores = self.model.score_samples(X)
            self.threshold = float(np.percentile(scores, self.contamination * 100))
            
            # Mark as trained
            self.is_trained = True
            
            # Calculate metrics
            train_predictions = self.model.predict(X)
            anomaly_count = np.sum(train_predictions == -1)
            
            metrics = {
                'training_samples': len(X),
                'anomalies_in_training': int(anomaly_count),
                'anomaly_rate': float(anomaly_count / len(X)),
                'threshold': self.threshold
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
            # Convert data using SAME feature extractor (deterministic)
            if isinstance(data, list) and data and isinstance(data[0], (dict, object)):
                try:
                    events = validate_event_log(data)
                    X = self.feature_extractor.transform(events)  # Use fitted extractor
                except Exception as e:
                    raise PredictionError(f"Feature extraction failed: {str(e)}")
            else:
                X = np.array(data)
            
            # Predict
            predictions = self.model.predict(X)
            scores = self.model.score_samples(X)
            
            # Format results
            results = []
            for idx, (pred, score) in enumerate(zip(predictions, scores)):
                results.append({
                    'index': int(idx),
                    'is_anomaly': bool(pred == -1),
                    'anomaly_score': float(abs(score)),
                    'isolation_score': float(score),
                    'severity': self._calculate_severity(score),
                    'confidence': float(abs(score - self.threshold) / abs(self.threshold)) if self.threshold else 1.0
                })
            
            # Invoke after_predict hook
            self.after_predict(context)
            
            return PredictionResult(
                predictions=results,
                metadata={
                    'model_type': 'isolation_forest',
                    'total_samples': len(results),
                    'anomalies_detected': sum(1 for r in results if r['is_anomaly'])
                }
            )
            
        except PredictionError:
            raise
        except Exception as e:
            raise PredictionError(f"Unexpected prediction error: {str(e)}")
    
    def detect_anomalies(self, data: Any) -> List[Dict[str, Any]]:
        """Detect anomalies and return only anomalous records"""
        pred_result = self.predict(data)
        return [p for p in pred_result.predictions if p['is_anomaly']]
    
    def evaluate(self, data: Any, labels: Any, **kwargs) -> Dict[str, float]:
        """Evaluate model performance with ground truth labels"""
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
        """Calculate severity level based on isolation score"""
        if self.threshold is None:
            return 'unknown'
        
        ratio = abs(score) / abs(self.threshold)
        
        if ratio > 2.0:
            return 'critical'
        elif ratio > 1.5:
            return 'high'
        elif ratio > 1.0:
            return 'medium'
        else:
            return 'low'
    
    def save(self, path: Optional[str] = None) -> str:
        """
        Save model with proper artifact storage
        Overrides base to also save feature extractor
        """
        if not self.is_trained:
            raise PersistenceError("Cannot save untrained model")
        
        # Call parent save (handles sklearn model)
        save_dir = super().save(path)
        save_dir_path = Path(save_dir)
        artifact_dir = save_dir_path / "artifacts"
        
        # ALSO save feature extractor as separate artifact
        extractor_path = artifact_dir / "feature_extractor.joblib"
        extractor_spec = ArtifactStore.save(self.feature_extractor, extractor_path, 'joblib')
        
        # ALSO save threshold
        threshold_path = artifact_dir / "threshold.json"
        threshold_spec = ArtifactStore.save({'threshold': self.threshold}, threshold_path, 'json')
        
        # Update manifest with ALL artifacts
        self.metadata.artifacts.extend([extractor_spec, threshold_spec])
        
        # Re-save manifest with all artifacts
        manifest_path = save_dir_path / "manifest.json"
        with open(manifest_path, 'w') as f:
            from dataclasses import asdict
            import json
            json.dump(asdict(self.metadata), f, indent=2, default=str)
        
        return save_dir
    
    def load(self, path: str) -> None:
        """
        Load model with proper artifact loading
        Overrides base to also load feature extractor
        """
        # Call parent load (handles sklearn model + manifest validation)
        super().load(path)
        
        # ALSO load feature extractor
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


# Import datetime for context timestamps
from datetime import datetime
from base.ml_model_base import PersistenceError
