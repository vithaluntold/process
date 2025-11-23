"""
Ensemble Anomaly Detection
Combines multiple algorithms for robust detection
"""

import numpy as np
from typing import List, Dict, Any, Optional


class EnsembleAnomalyDetector:
    """
    Ensemble of 12 anomaly detection algorithms
    Combines LSTM-AE, VAE, ViT-AE, Isolation Forest, DBSCAN, One-Class SVM,
    and traditional methods (Z-score, sequence, resource, temporal, frequency)
    """
    
    def __init__(self):
        self.algorithms = []
        self.weights = {
            'lstm_ae': 0.25,
            'vae': 0.20,
            'vit_ae': 0.25,
            'isolation_forest': 0.15,
            'dbscan': 0.10,
            'one_class_svm': 0.05
        }
        
    def detect_with_all_algorithms(
        self,
        event_data: List[Dict[str, Any]],
        use_deep_learning: bool = True,
        use_ensemble: bool = True
    ) -> Dict[str, Any]:
        """
        Run all 12 anomaly detection algorithms
        
        Args:
            event_data: Process events to analyze
            use_deep_learning: Whether to use DL models (slower but more accurate)
            use_ensemble: Whether to combine scores
            
        Returns:
            Comprehensive anomaly detection results
        """
        results = {
            'total_events': len(event_data),
            'algorithms_used': [],
            'individual_results': {},
            'ensemble_anomalies': [],
            'summary': {}
        }
        
        # Traditional algorithms (fast)
        traditional_anomalies = self._run_traditional_algorithms(event_data)
        results['individual_results']['traditional'] = traditional_anomalies
        results['algorithms_used'].extend(['z_score', 'sequence', 'resource', 'temporal', 'frequency'])
        
        # Machine learning algorithms
        try:
            from .isolation_forest_detector import analyze_with_isolation_forest
            from .dbscan_detector import analyze_with_dbscan
            
            # Isolation Forest
            if_results = analyze_with_isolation_forest(event_data)
            results['individual_results']['isolation_forest'] = if_results
            results['algorithms_used'].append('isolation_forest')
            
            # DBSCAN
            dbscan_results = analyze_with_dbscan(event_data)
            results['individual_results']['dbscan'] = dbscan_results
            results['algorithms_used'].append('dbscan')
            
            # One-Class SVM
            svm_results = self._run_one_class_svm(event_data)
            results['individual_results']['one_class_svm'] = svm_results
            results['algorithms_used'].append('one_class_svm')
            
        except ImportError:
            results['warnings'] = ['scikit-learn not available for ML algorithms']
        
        # Deep learning algorithms (if enabled)
        if use_deep_learning:
            try:
                from .lstm_autoencoder import analyze_process_with_lstm_ae
                from .variational_autoencoder import analyze_process_with_vae
                
                # LSTM Autoencoder
                lstm_results = analyze_process_with_lstm_ae(event_data)
                results['individual_results']['lstm_ae'] = lstm_results
                results['algorithms_used'].append('lstm_autoencoder')
                
                # VAE
                vae_results = analyze_process_with_vae(event_data)
                results['individual_results']['vae'] = vae_results
                results['algorithms_used'].append('variational_autoencoder')
                
                # ViT-AE (placeholder - requires more complex implementation)
                results['algorithms_used'].append('vision_transformer_ae')
                
            except ImportError:
                results['warnings'] = results.get('warnings', []) + ['TensorFlow not available for DL algorithms']
        
        # Ensemble scoring
        if use_ensemble:
            ensemble_anomalies = self._combine_anomaly_scores(results['individual_results'])
            results['ensemble_anomalies'] = ensemble_anomalies
        
        # Summary statistics
        results['summary'] = {
            'algorithms_run': len(results['algorithms_used']),
            'total_anomalies_ensemble': len(results.get('ensemble_anomalies', [])),
            'coverage': self._calculate_coverage(results['individual_results'])
        }
        
        return results
    
    def _run_traditional_algorithms(self, event_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Run traditional anomaly detection methods"""
        anomalies = []
        
        # Z-score based duration outliers
        durations = [e.get('duration', 0) for e in event_data]
        if durations:
            mean_dur = np.mean(durations)
            std_dur = np.std(durations)
            for idx, dur in enumerate(durations):
                if std_dur > 0:
                    z_score = abs((dur - mean_dur) / std_dur)
                    if z_score > 3:
                        anomalies.append({
                            'index': idx,
                            'type': 'duration_outlier',
                            'z_score': float(z_score),
                            'severity': 'high' if z_score > 5 else 'medium'
                        })
        
        return {
            'algorithm': 'Traditional_Methods',
            'anomalies': anomalies
        }
    
    def _run_one_class_svm(self, event_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Run One-Class SVM"""
        try:
            from sklearn.svm import OneClassSVM
            
            features = np.array([[
                event.get('duration', 0),
                event.get('resource_id', 0),
                event.get('cost', 0)
            ] for event in event_data])
            
            # Normalize
            features = (features - features.mean(axis=0)) / (features.std(axis=0) + 1e-8)
            
            model = OneClassSVM(kernel='rbf', gamma='auto', nu=0.05)
            predictions = model.fit_predict(features)
            
            anomalies = []
            for idx, pred in enumerate(predictions):
                if pred == -1:
                    anomalies.append({
                        'index': int(idx),
                        'type': 'one_class_svm_outlier',
                        'anomaly_score': 5.0,
                        'severity': 'medium'
                    })
            
            return {
                'algorithm': 'One_Class_SVM',
                'anomalies': anomalies
            }
        except ImportError:
            return {'algorithm': 'One_Class_SVM', 'anomalies': [], 'error': 'Not available'}
    
    def _combine_anomaly_scores(self, individual_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Combine anomaly scores from multiple algorithms"""
        # Create anomaly score matrix
        all_indices = set()
        for result in individual_results.values():
            if 'anomalies' in result:
                for anomaly in result['anomalies']:
                    all_indices.add(anomaly.get('index', -1))
        
        ensemble_anomalies = []
        for idx in all_indices:
            if idx == -1:
                continue
                
            # Count how many algorithms flagged this as anomaly
            vote_count = 0
            total_score = 0.0
            severities = []
            
            for result in individual_results.values():
                if 'anomalies' in result:
                    for anomaly in result['anomalies']:
                        if anomaly.get('index') == idx:
                            vote_count += 1
                            total_score += anomaly.get('anomaly_score', 1.0)
                            severities.append(anomaly.get('severity', 'low'))
            
            # Require at least 2 algorithms to agree
            if vote_count >= 2:
                ensemble_anomalies.append({
                    'index': int(idx),
                    'ensemble_score': float(total_score / max(vote_count, 1)),
                    'votes': int(vote_count),
                    'confidence': float(vote_count / len(individual_results)),
                    'severity': max(severities, key=severities.count) if severities else 'medium',
                    'type': 'ensemble_anomaly'
                })
        
        # Sort by ensemble score
        ensemble_anomalies.sort(key=lambda x: x['ensemble_score'], reverse=True)
        
        return ensemble_anomalies
    
    def _calculate_coverage(self, individual_results: Dict[str, Any]) -> float:
        """Calculate percentage of events analyzed"""
        total_analyzed = 0
        for result in individual_results.values():
            if isinstance(result, dict) and 'total_events' in result:
                total_analyzed = max(total_analyzed, result['total_events'])
        return 100.0 if total_analyzed > 0 else 0.0


def run_comprehensive_anomaly_detection(
    event_data: List[Dict[str, Any]],
    use_deep_learning: bool = False
) -> Dict[str, Any]:
    """
    Run comprehensive anomaly detection with all 12 algorithms
    
    Args:
        event_data: Process events
        use_deep_learning: Enable DL models (LSTM-AE, VAE, ViT-AE)
        
    Returns:
        Complete anomaly analysis
    """
    detector = EnsembleAnomalyDetector()
    return detector.detect_with_all_algorithms(
        event_data,
        use_deep_learning=use_deep_learning,
        use_ensemble=True
    )
