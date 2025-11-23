"""
Production-Ready DBSCAN Anomaly Detector
Density-based clustering for anomaly detection
"""

import numpy as np
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from base.ml_model_base import AnomalyDetectorBase, TrainingResult, PredictionResult, TrainingError
from base.schemas import validate_event_log, AnomalyDetectionInput
from base.model_registry import get_registry


class DBSCANAnomalyDetector(AnomalyDetectorBase):
    """DBSCAN-based anomaly detection"""
    
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
        
        self.metadata.hyperparameters.update({
            'eps': eps,
            'min_samples': min_samples
        })
    
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """Train DBSCAN (fit data to learn cluster structure)"""
        try:
            from sklearn.cluster import DBSCAN
        except ImportError:
            raise TrainingError("scikit-learn not available")
        
        # Convert to numpy
        if isinstance(data, list) and data and isinstance(data[0], (dict, object)):
            try:
                events = validate_event_log(data)
                input_schema = AnomalyDetectionInput(events=events)
                X = input_schema.to_feature_matrix()
            except:
                X = np.array(data)
        else:
            X = np.array(data)
        
        if len(X) < self.min_samples:
            raise TrainingError(f"Insufficient data: need at least {self.min_samples} samples")
        
        self.metadata.status = 'training'
        self.metadata.training_samples = len(X)
        
        # Fit DBSCAN
        self.model = DBSCAN(eps=self.eps, min_samples=self.min_samples, n_jobs=-1)
        labels = self.model.fit_predict(X)
        
        # Points labeled -1 are anomalies
        n_anomalies = np.sum(labels == -1)
        
        self.is_trained = True
        self.metadata.status = 'trained'
        
        metrics = {
            'training_samples': len(X),
            'anomalies_detected': int(n_anomalies),
            'anomaly_rate': float(n_anomalies / len(X)),
            'n_clusters': int(len(set(labels)) - (1 if -1 in labels else 0))
        }
        
        self.metadata.performance_metrics = metrics
        
        return TrainingResult(
            success=True,
            metrics=metrics,
            metadata=self.metadata
        )
    
    def predict(self, data: Any, **kwargs) -> PredictionResult:
        """Detect anomalies using DBSCAN"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        # Convert to numpy
        if isinstance(data, list) and data and isinstance(data[0], (dict, object)):
            try:
                events = validate_event_log(data)
                input_schema = AnomalyDetectionInput(events=events)
                X = input_schema.to_feature_matrix()
            except:
                X = np.array(data)
        else:
            X = np.array(data)
        
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
        
        return PredictionResult(
            predictions=results,
            metadata={'model_type': 'dbscan', 'total_samples': len(results)}
        )
    
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
        
        return {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1)
        }
