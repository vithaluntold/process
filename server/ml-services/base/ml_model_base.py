"""
Base classes for all ML models with proper persistence and lifecycle management
Production-ready ML service infrastructure
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass
from datetime import datetime
import json
import pickle
import os
from pathlib import Path


@dataclass
class ModelMetadata:
    """Metadata for tracking model versions and performance"""
    model_id: str
    model_type: str
    version: str
    created_at: datetime
    trained_at: Optional[datetime]
    hyperparameters: Dict[str, Any]
    performance_metrics: Dict[str, float]
    training_samples: int
    status: str  # 'initialized', 'training', 'trained', 'failed'


@dataclass
class TrainingResult:
    """Standardized training result"""
    success: bool
    metrics: Dict[str, float]
    metadata: ModelMetadata
    error: Optional[str] = None


@dataclass
class PredictionResult:
    """Standardized prediction result"""
    predictions: Union[List[Any], Dict[str, Any]]
    confidence: Optional[Dict[str, float]] = None
    metadata: Optional[Dict[str, Any]] = None


class MLModelBase(ABC):
    """
    Base class for all ML models
    Enforces proper persistence, evaluation, and error handling
    """
    
    def __init__(self, model_id: str, model_type: str, version: str = "1.0.0"):
        self.model_id = model_id
        self.model_type = model_type
        self.version = version
        self.metadata = ModelMetadata(
            model_id=model_id,
            model_type=model_type,
            version=version,
            created_at=datetime.now(),
            trained_at=None,
            hyperparameters={},
            performance_metrics={},
            training_samples=0,
            status='initialized'
        )
        self.model = None
        self.is_trained = False
        
        # Create model directory
        self.model_dir = Path(f"models/{model_type}/{model_id}")
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
    @abstractmethod
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """
        Train the model
        Must return TrainingResult with success status and metrics
        """
        pass
    
    @abstractmethod
    def predict(self, data: Any, **kwargs) -> PredictionResult:
        """
        Make predictions
        Must return PredictionResult with predictions and confidence
        """
        pass
    
    @abstractmethod
    def evaluate(self, data: Any, labels: Any, **kwargs) -> Dict[str, float]:
        """
        Evaluate model performance
        Must return dict of metrics (accuracy, precision, recall, etc.)
        """
        pass
    
    def save(self, path: Optional[str] = None) -> str:
        """
        Save model to disk
        Returns path where model was saved
        """
        if not self.is_trained:
            raise ValueError("Cannot save untrained model")
        
        save_path = path or str(self.model_dir / f"{self.model_id}_v{self.version}.pkl")
        
        # Save model state
        model_state = {
            'model': self.model,
            'metadata': self.metadata,
            'is_trained': self.is_trained,
            'version': self.version
        }
        
        with open(save_path, 'wb') as f:
            pickle.dump(model_state, f)
        
        # Save metadata separately as JSON for easy inspection
        metadata_path = str(self.model_dir / f"{self.model_id}_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump({
                'model_id': self.metadata.model_id,
                'model_type': self.metadata.model_type,
                'version': self.metadata.version,
                'created_at': self.metadata.created_at.isoformat(),
                'trained_at': self.metadata.trained_at.isoformat() if self.metadata.trained_at else None,
                'hyperparameters': self.metadata.hyperparameters,
                'performance_metrics': self.metadata.performance_metrics,
                'training_samples': self.metadata.training_samples,
                'status': self.metadata.status
            }, f, indent=2)
        
        return save_path
    
    def load(self, path: str) -> None:
        """Load model from disk"""
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found: {path}")
        
        with open(path, 'rb') as f:
            model_state = pickle.load(f)
        
        self.model = model_state['model']
        self.metadata = model_state['metadata']
        self.is_trained = model_state['is_trained']
        self.version = model_state['version']
    
    def get_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            'model_id': self.model_id,
            'model_type': self.model_type,
            'version': self.version,
            'is_trained': self.is_trained,
            'status': self.metadata.status,
            'performance_metrics': self.metadata.performance_metrics,
            'hyperparameters': self.metadata.hyperparameters
        }
    
    def _update_metadata(self, **kwargs):
        """Update metadata fields"""
        for key, value in kwargs.items():
            if hasattr(self.metadata, key):
                setattr(self.metadata, key, value)


class AnomalyDetectorBase(MLModelBase):
    """Base class for anomaly detection models"""
    
    def __init__(self, model_id: str, model_type: str, contamination: float = 0.05):
        super().__init__(model_id, model_type)
        self.contamination = contamination
        self.threshold = None
        self.metadata.hyperparameters['contamination'] = contamination
    
    @abstractmethod
    def detect_anomalies(self, data: Any) -> List[Dict[str, Any]]:
        """
        Detect anomalies in data
        Returns list of anomaly records with scores and metadata
        """
        pass
    
    def evaluate(self, data: Any, labels: Any, **kwargs) -> Dict[str, float]:
        """
        Evaluate anomaly detection performance
        labels: 1 for anomaly, 0 for normal
        """
        predictions = self.predict(data)
        pred_labels = [1 if p['is_anomaly'] else 0 for p in predictions.predictions]
        
        # Calculate metrics
        true_positives = sum(1 for p, l in zip(pred_labels, labels) if p == 1 and l == 1)
        false_positives = sum(1 for p, l in zip(pred_labels, labels) if p == 1 and l == 0)
        true_negatives = sum(1 for p, l in zip(pred_labels, labels) if p == 0 and l == 0)
        false_negatives = sum(1 for p, l in zip(pred_labels, labels) if p == 0 and l == 1)
        
        total = len(labels)
        accuracy = (true_positives + true_negatives) / total if total > 0 else 0
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'true_positives': true_positives,
            'false_positives': false_positives,
            'true_negatives': true_negatives,
            'false_negatives': false_negatives
        }


class ForecasterBase(MLModelBase):
    """Base class for forecasting models"""
    
    def __init__(self, model_id: str, model_type: str, horizon: int = 30):
        super().__init__(model_id, model_type)
        self.horizon = horizon
        self.scaler_mean = None
        self.scaler_std = None
        self.metadata.hyperparameters['horizon'] = horizon
    
    @abstractmethod
    def forecast(self, historical_data: Any, horizon: Optional[int] = None) -> Dict[str, Any]:
        """
        Generate forecast
        Returns dict with forecast values and confidence intervals
        """
        pass
    
    def evaluate(self, data: Any, labels: Any, **kwargs) -> Dict[str, float]:
        """
        Evaluate forecasting performance
        Uses RMSE, MAE, MAPE metrics
        """
        predictions = self.predict(data).predictions
        
        # Calculate metrics
        errors = [abs(p - l) for p, l in zip(predictions, labels)]
        squared_errors = [(p - l) ** 2 for p, l in zip(predictions, labels)]
        
        mae = sum(errors) / len(errors) if errors else 0
        rmse = (sum(squared_errors) / len(squared_errors)) ** 0.5 if squared_errors else 0
        mape = sum([abs(p - l) / abs(l) for p, l in zip(predictions, labels) if l != 0]) / len(labels) * 100 if labels else 0
        
        return {
            'mae': mae,
            'rmse': rmse,
            'mape': mape
        }
    
    def normalize(self, data):
        """Normalize data using stored statistics"""
        if self.scaler_mean is None:
            import numpy as np
            self.scaler_mean = np.mean(data)
            self.scaler_std = np.std(data)
        
        return (data - self.scaler_mean) / (self.scaler_std + 1e-8)
    
    def denormalize(self, data):
        """Denormalize data"""
        if self.scaler_mean is None:
            raise ValueError("Scaler not initialized. Train model first.")
        return data * self.scaler_std + self.scaler_mean


class ProcessMinerBase(MLModelBase):
    """Base class for process mining models"""
    
    @abstractmethod
    def discover_process(self, event_log: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Discover process model from event log
        Returns process model representation
        """
        pass
