"""
Production-Ready Isolation Forest Anomaly Detector
Complete implementation with persistence, evaluation, and proper error handling
"""

import numpy as np
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from base.ml_model_base import AnomalyDetectorBase, TrainingResult, PredictionResult
from base.schemas import EventLogSchema, AnomalyDetectionInput, AnomalyDetectionOutput, validate_event_log
from base.model_registry import get_registry
from datetime import datetime


class IsolationForestAnomalyDetector(AnomalyDetectorBase):
    """
    Production-ready Isolation Forest anomaly detector
    Fast, scalable tree-based outlier detection
    """
    
    def __init__(
        self,
        model_id: str = "isolation_forest_default",
        n_estimators: int = 100,
        contamination: float = 0.05,
        max_samples: int = 256,
        random_state: int = 42
    ):
        super().__init__(model_id, "isolation_forest", contamination)
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.random_state = random_state
        
        # Update hyperparameters
        self.metadata.hyperparameters.update({
            'n_estimators': n_estimators,
            'max_samples': max_samples,
            'random_state': random_state
        })
    
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """
        Train Isolation Forest on normal data
        
        Args:
            data: Either numpy array or list of EventLogSchema
            **kwargs: Additional parameters
        
        Returns:
            TrainingResult with success status and metrics
        """
        try:
            # Import sklearn
            try:
                from sklearn.ensemble import IsolationForest
            except ImportError:
                error_msg = "scikit-learn not available. Install with: pip install scikit-learn"
                self.metadata.status = 'failed'
                return TrainingResult(
                    success=False,
                    metrics={},
                    metadata=self.metadata,
                    error=error_msg
                )
            
            # Convert data to numpy array if needed
            if isinstance(data, list) and data and isinstance(data[0], (EventLogSchema, dict)):
                if isinstance(data[0], dict):
                    data = validate_event_log(data)
                input_schema = AnomalyDetectionInput(events=data)
                X = input_schema.to_feature_matrix()
            else:
                X = np.array(data)
            
            # Validate data
            if len(X) < 10:
                raise ValueError(f"Insufficient training data: need at least 10 samples, got {len(X)}")
            
            # Update training samples count
            self.metadata.training_samples = len(X)
            self.metadata.status = 'training'
            
            # Train model
            self.model = IsolationForest(
                contamination=self.contamination,
                n_estimators=self.n_estimators,
                max_samples=min(self.max_samples, len(X)),
                random_state=self.random_state,
                n_jobs=-1
            )
            
            self.model.fit(X)
            
            # Calculate threshold from training data
            scores = self.model.score_samples(X)
            self.threshold = np.percentile(scores, self.contamination * 100)
            
            # Mark as trained
            self.is_trained = True
            self.metadata.status = 'trained'
            self.metadata.trained_at = datetime.now()
            
            # Calculate training metrics
            train_predictions = self.model.predict(X)
            anomaly_count = np.sum(train_predictions == -1)
            
            metrics = {
                'training_samples': len(X),
                'anomalies_in_training': int(anomaly_count),
                'anomaly_rate': float(anomaly_count / len(X)),
                'threshold': float(self.threshold)
            }
            
            self.metadata.performance_metrics = metrics
            
            return TrainingResult(
                success=True,
                metrics=metrics,
                metadata=self.metadata
            )
            
        except Exception as e:
            self.metadata.status = 'failed'
            return TrainingResult(
                success=False,
                metrics={},
                metadata=self.metadata,
                error=str(e)
            )
    
    def predict(self, data: Any, **kwargs) -> PredictionResult:
        """
        Predict anomalies
        
        Args:
            data: Either numpy array or list of EventLogSchema
        
        Returns:
            PredictionResult with anomaly predictions
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction. Call train() first.")
        
        # Convert data to numpy array if needed
        if isinstance(data, list) and data and isinstance(data[0], (EventLogSchema, dict)):
            if isinstance(data[0], dict):
                data = validate_event_log(data)
            input_schema = AnomalyDetectionInput(events=data)
            X = input_schema.to_feature_matrix()
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
                'confidence': float(abs(score) / abs(self.threshold)) if self.threshold else 1.0
            })
        
        return PredictionResult(
            predictions=results,
            metadata={
                'model_type': 'isolation_forest',
                'total_samples': len(results),
                'anomalies_detected': sum(1 for r in results if r['is_anomaly'])
            }
        )
    
    def detect_anomalies(self, data: Any) -> List[Dict[str, Any]]:
        """
        Detect anomalies and return only anomalous records
        
        Args:
            data: Input data
        
        Returns:
            List of anomaly records
        """
        pred_result = self.predict(data)
        return [p for p in pred_result.predictions if p['is_anomaly']]
    
    def evaluate(self, data: Any, labels: Any, **kwargs) -> Dict[str, float]:
        """
        Evaluate model performance with ground truth labels
        
        Args:
            data: Test data
            labels: Ground truth (1 for anomaly, 0 for normal)
        
        Returns:
            Dict of performance metrics
        """
        predictions = self.predict(data).predictions
        pred_labels = [1 if p['is_anomaly'] else 0 for p in predictions]
        
        # Calculate metrics
        labels = np.array(labels)
        pred_labels = np.array(pred_labels)
        
        true_positives = np.sum((pred_labels == 1) & (labels == 1))
        false_positives = np.sum((pred_labels == 1) & (labels == 0))
        true_negatives = np.sum((pred_labels == 0) & (labels == 0))
        false_negatives = np.sum((pred_labels == 0) & (labels == 1))
        
        total = len(labels)
        accuracy = (true_positives + true_negatives) / total if total > 0 else 0
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        metrics = {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'true_positives': int(true_positives),
            'false_positives': int(false_positives),
            'true_negatives': int(true_negatives),
            'false_negatives': int(false_negatives)
        }
        
        # Update metadata
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
    
    def save_to_registry(self) -> str:
        """Save model and register in model registry"""
        model_path = self.save()
        
        registry = get_registry()
        registry.register_model(
            model_id=self.model_id,
            model_type=self.model_type,
            version=self.version,
            metadata=self.metadata,
            model_path=model_path
        )
        
        return model_path


def train_isolation_forest(
    event_log: List[Dict[str, Any]],
    model_id: str = "isolation_forest_default",
    contamination: float = 0.05,
    n_estimators: int = 100
) -> Dict[str, Any]:
    """
    Convenience function to train Isolation Forest on event log
    
    Args:
        event_log: List of process events
        model_id: Unique model identifier
        contamination: Expected proportion of anomalies
        n_estimators: Number of trees
    
    Returns:
        Training results with model info
    """
    # Validate and convert event log
    events = validate_event_log(event_log)
    
    # Create detector
    detector = IsolationForestAnomalyDetector(
        model_id=model_id,
        contamination=contamination,
        n_estimators=n_estimators
    )
    
    # Train
    result = detector.train(events)
    
    if result.success:
        # Save to registry
        model_path = detector.save_to_registry()
        
        return {
            'success': True,
            'model_id': model_id,
            'model_path': model_path,
            'metrics': result.metrics,
            'model_info': detector.get_info()
        }
    else:
        return {
            'success': False,
            'error': result.error
        }


def detect_anomalies_with_isolation_forest(
    event_log: List[Dict[str, Any]],
    model_id: str = "isolation_forest_default",
    train_if_not_exists: bool = True
) -> AnomalyDetectionOutput:
    """
    Detect anomalies using Isolation Forest
    
    Args:
        event_log: List of process events
        model_id: Model to use for detection
        train_if_not_exists: Train new model if not found
    
    Returns:
        AnomalyDetectionOutput with detected anomalies
    """
    # Try to load from registry
    registry = get_registry()
    deployed = registry.get_deployed_model('isolation_forest', 'production')
    
    detector = IsolationForestAnomalyDetector(model_id=model_id)
    
    if deployed and deployed['model_id'] == model_id:
        # Load deployed model
        detector.load(deployed['model_path'])
    elif train_if_not_exists:
        # Train new model
        events = validate_event_log(event_log)
        result = detector.train(events)
        if not result.success:
            raise ValueError(f"Training failed: {result.error}")
    else:
        raise ValueError(f"Model {model_id} not found and train_if_not_exists=False")
    
    # Detect anomalies
    events = validate_event_log(event_log)
    anomalies = detector.detect_anomalies(events)
    
    return AnomalyDetectionOutput(
        total_events=len(events),
        anomalies_detected=len(anomalies),
        anomaly_rate=len(anomalies) / len(events) if events else 0,
        anomalies=anomalies,
        model_info=detector.get_info(),
        performance_metrics=detector.metadata.performance_metrics
    )
