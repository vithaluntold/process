"""
DBSCAN Clustering for Anomaly Detection
Density-based clustering to identify outliers
"""

import numpy as np
from typing import List, Dict, Any


class DBSCANDetector:
    """DBSCAN clustering for anomaly detection"""
    
    def __init__(self, eps: float = 0.5, min_samples: int = 5):
        """
        Initialize DBSCAN
        
        Args:
            eps: Maximum distance between samples
            min_samples: Minimum samples in neighborhood
        """
        self.eps = eps
        self.min_samples = min_samples
        self.model = None
        self.is_trained = False
        
    def train(self, data: np.ndarray) -> Dict[str, Any]:
        """Train DBSCAN clustering"""
        try:
            from sklearn.cluster import DBSCAN
            
            self.model = DBSCAN(
                eps=self.eps,
                min_samples=self.min_samples,
                metric='euclidean',
                n_jobs=-1
            )
            
            self.labels = self.model.fit_predict(data)
            self.is_trained = True
            
            # Count clusters
            n_clusters = len(set(self.labels)) - (1 if -1 in self.labels else 0)
            n_noise = list(self.labels).count(-1)
            
            return {
                'n_clusters': int(n_clusters),
                'n_outliers': int(n_noise),
                'outlier_percentage': float(n_noise / len(data) * 100)
            }
        except ImportError:
            raise ImportError("scikit-learn not available")
    
    def detect_anomalies(self, data: np.ndarray) -> List[Dict[str, Any]]:
        """Detect anomalies (noise points) using DBSCAN"""
        if not self.is_trained:
            # Train on the same data if not pre-trained
            self.train(data)
        
        anomalies = []
        for idx, label in enumerate(self.labels):
            if label == -1:  # Noise point
                anomalies.append({
                    'index': int(idx),
                    'cluster_label': -1,
                    'anomaly_score': 5.0,
                    'severity': 'medium',
                    'type': 'density_based_outlier',
                    'description': 'Point does not belong to any cluster (low-density region)'
                })
        
        return anomalies


def analyze_with_dbscan(event_data: List[Dict[str, Any]], eps: float = 0.5) -> Dict[str, Any]:
    """Analyze process events using DBSCAN"""
    features = np.array([[
        event.get('duration', 0),
        event.get('resource_id', 0),
        event.get('cost', 0)
    ] for event in event_data])
    
    # Normalize
    features = (features - features.mean(axis=0)) / (features.std(axis=0) + 1e-8)
    
    detector = DBSCANDetector(eps=eps)
    training_result = detector.train(features)
    anomalies = detector.detect_anomalies(features)
    
    return {
        'algorithm': 'DBSCAN',
        'total_events': len(event_data),
        'anomalies_detected': len(anomalies),
        'anomalies': anomalies,
        'clustering_info': training_result
    }
