"""
Production-Ready One-Class SVM Anomaly Detector
Support Vector Machine for novelty detection
"""

import numpy as np
from typing import List, Dict, Any
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from base.ml_model_base import AnomalyDetectorBase, TrainingResult, PredictionResult, TrainingError
from base.schemas import validate_event_log, AnomalyDetectionInput


class OneClassSVMAnomalyDetector(AnomalyDetectorBase):
    """One-Class SVM for anomaly detection"""
    
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
        
        self.metadata.hyperparameters.update({
            'kernel': kernel,
            'nu': nu,
            'gamma': gamma
        })
    
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """Train One-Class SVM"""
        try:
            from sklearn.svm import OneClassSVM
        except ImportError:
            raise TrainingError("scikit-learn not available")
        
        if isinstance(data, list) and data and isinstance(data[0], (dict, object)):
            try:
                events = validate_event_log(data)
                input_schema = AnomalyDetectionInput(events=events)
                X = input_schema.to_feature_matrix()
            except:
                X = np.array(data)
        else:
            X = np.array(data)
        
        if len(X) < 10:
            raise TrainingError("Need at least 10 samples")
        
        self.metadata.status = 'training'
        self.metadata.training_samples = len(X)
        
        # Train model
        self.model = OneClassSVM(kernel=self.kernel, nu=self.nu, gamma=self.gamma)
        self.model.fit(X)
        
        # Calculate decision scores
        scores = self.model.decision_function(X)
        self.threshold = np.percentile(scores, self.nu * 100)
        
        self.is_trained = True
        self.metadata.status = 'trained'
        
        predictions = self.model.predict(X)
        n_anomalies = np.sum(predictions == -1)
        
        metrics = {
            'training_samples': len(X),
            'anomalies_in_training': int(n_anomalies),
            'anomaly_rate': float(n_anomalies / len(X)),
            'threshold': float(self.threshold)
        }
        
        self.metadata.performance_metrics = metrics
        
        return TrainingResult(
            success=True,
            metrics=metrics,
            metadata=self.metadata
        )
    
    def predict(self, data: Any, **kwargs) -> PredictionResult:
        """Predict anomalies"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        if isinstance(data, list) and data and isinstance(data[0], (dict, object)):
            try:
                events = validate_event_log(data)
                input_schema = AnomalyDetectionInput(events=events)
                X = input_schema.to_feature_matrix()
            except:
                X = np.array(data)
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
                'severity': 'high' if score < self.threshold * 2 else 'medium' if pred == -1 else 'low',
                'confidence': float(abs(score) / abs(self.threshold)) if self.threshold else 1.0
            })
        
        return PredictionResult(
            predictions=results,
            metadata={'model_type': 'oneclass_svm', 'total_samples': len(results)}
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
