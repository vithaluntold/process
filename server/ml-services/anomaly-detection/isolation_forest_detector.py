"""
Isolation Forest for Fast Anomaly Detection
Tree-based ensemble method for outlier detection
"""

import numpy as np
from typing import List, Dict, Any


class IsolationForestDetector:
    """Isolation Forest for fast anomaly detection in process mining"""
    
    def __init__(self, contamination: float = 0.05, n_estimators: int = 100):
        """
        Initialize Isolation Forest
        
        Args:
            contamination: Expected proportion of anomalies
            n_estimators: Number of trees
        """
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.model = None
        self.is_trained = False
        
    def train(self, normal_data: np.ndarray) -> Dict[str, Any]:
        """Train Isolation Forest on normal data"""
        try:
            from sklearn.ensemble import IsolationForest
            
            self.model = IsolationForest(
                contamination=self.contamination,
                n_estimators=self.n_estimators,
                max_samples=min(256, len(normal_data)),
                random_state=42,
                n_jobs=-1
            )
            
            self.model.fit(normal_data)
            self.is_trained = True
            
            return {
                'n_estimators': self.n_estimators,
                'contamination': self.contamination,
                'samples_used': len(normal_data)
            }
        except ImportError:
            raise ImportError("scikit-learn not available")
    
    def detect_anomalies(self, data: np.ndarray) -> List[Dict[str, Any]]:
        """Detect anomalies using Isolation Forest"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        # Predict: -1 for anomalies, 1 for normal
        predictions = self.model.predict(data)
        
        # Get anomaly scores (more negative = more anomalous)
        scores = self.model.score_samples(data)
        
        anomalies = []
        for idx, (pred, score) in enumerate(zip(predictions, scores)):
            if pred == -1:
                anomalies.append({
                    'index': int(idx),
                    'isolation_score': float(score),
                    'anomaly_score': float(abs(score)),
                    'severity': self._calculate_severity(score),
                    'type': 'isolation_forest_outlier',
                    'description': f'Outlier detected by tree isolation (score: {score:.4f})'
                })
        
        return anomalies
    
    def _calculate_severity(self, score: float) -> str:
        """Calculate severity based on isolation score"""
        if score < -0.5:
            return 'critical'
        elif score < -0.3:
            return 'high'
        elif score < -0.2:
            return 'medium'
        else:
            return 'low'


def analyze_with_isolation_forest(event_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze process events using Isolation Forest"""
    features = np.array([[
        event.get('duration', 0),
        event.get('resource_id', 0),
        event.get('cost', 0),
        event.get('complexity', 0)
    ] for event in event_data])
    
    # Normalize
    features = (features - features.mean(axis=0)) / (features.std(axis=0) + 1e-8)
    
    detector = IsolationForestDetector(contamination=0.05)
    detector.train(features)
    anomalies = detector.detect_anomalies(features)
    
    return {
        'algorithm': 'Isolation_Forest',
        'total_events': len(event_data),
        'anomalies_detected': len(anomalies),
        'anomalies': anomalies
    }
