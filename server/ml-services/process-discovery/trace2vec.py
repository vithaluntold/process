"""
Trace2Vec / Activity2Vec
Neural embeddings for process mining
Learn semantic representations of activities and traces
"""

import numpy as np
from typing import List, Dict, Any, Tuple
from collections import defaultdict


class Trace2Vec:
    """
    Trace2Vec embeddings for process traces
    Similar to Word2Vec but for process mining
    """
    
    def __init__(self, vector_size: int = 100, window: int = 3):
        """
        Initialize Trace2Vec
        
        Args:
            vector_size: Dimension of embedding vectors
            window: Context window size
        """
        self.vector_size = vector_size
        self.window = window
        self.model = None
        self.is_trained = False
        
    def train(self, traces: List[List[str]], epochs: int = 50) -> Dict[str, Any]:
        """
        Train Trace2Vec model
        
        Args:
            traces: List of activity sequences
            epochs: Training epochs
            
        Returns:
            Training results
        """
        try:
            from gensim.models import Word2Vec
            
            # Train Word2Vec on process traces
            self.model = Word2Vec(
                sentences=traces,
                vector_size=self.vector_size,
                window=self.window,
                min_count=1,
                workers=4,
                epochs=epochs,
                sg=1  # Skip-gram model
            )
            
            self.is_trained = True
            
            return {
                'successful': True,
                'vocabulary_size': len(self.model.wv),
                'vector_size': self.vector_size,
                'activities': list(self.model.wv.key_to_index.keys())
            }
        except ImportError:
            return {
                'successful': False,
                'error': 'gensim not available. Install with: pip install gensim'
            }
    
    def get_activity_embedding(self, activity: str) -> np.ndarray:
        """Get embedding vector for an activity"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        return self.model.wv[activity] if activity in self.model.wv else None
    
    def get_similar_activities(self, activity: str, topn: int = 5) -> List[Tuple[str, float]]:
        """Find similar activities"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        if activity not in self.model.wv:
            return []
        
        similar = self.model.wv.most_similar(activity, topn=topn)
        return [(act, float(score)) for act, score in similar]
    
    def calculate_trace_similarity(self, trace1: List[str], trace2: List[str]) -> float:
        """Calculate similarity between two traces"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        # Get average embeddings for each trace
        embedding1 = self._get_trace_embedding(trace1)
        embedding2 = self._get_trace_embedding(trace2)
        
        if embedding1 is None or embedding2 is None:
            return 0.0
        
        # Cosine similarity
        similarity = np.dot(embedding1, embedding2) / (
            np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
        )
        
        return float(similarity)
    
    def _get_trace_embedding(self, trace: List[str]) -> np.ndarray:
        """Get average embedding for a trace"""
        embeddings = []
        for activity in trace:
            if activity in self.model.wv:
                embeddings.append(self.model.wv[activity])
        
        if not embeddings:
            return None
        
        return np.mean(embeddings, axis=0)
    
    def cluster_traces(self, traces: List[List[str]], n_clusters: int = 5) -> Dict[str, Any]:
        """Cluster traces based on embeddings"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        try:
            from sklearn.cluster import KMeans
            
            # Get trace embeddings
            trace_embeddings = []
            valid_traces = []
            for trace in traces:
                embedding = self._get_trace_embedding(trace)
                if embedding is not None:
                    trace_embeddings.append(embedding)
                    valid_traces.append(trace)
            
            if not trace_embeddings:
                return {'error': 'No valid trace embeddings'}
            
            # Cluster
            kmeans = KMeans(n_clusters=min(n_clusters, len(trace_embeddings)), random_state=42)
            cluster_labels = kmeans.fit_predict(trace_embeddings)
            
            # Group traces by cluster
            clusters = defaultdict(list)
            for trace, label in zip(valid_traces, cluster_labels):
                clusters[int(label)].append(trace)
            
            return {
                'n_clusters': len(clusters),
                'clusters': {
                    f'cluster_{i}': {
                        'size': len(traces),
                        'representative_trace': traces[0] if traces else None
                    }
                    for i, traces in clusters.items()
                }
            }
        except ImportError:
            return {
                'error': 'scikit-learn not available'
            }


class Activity2Vec:
    """Activity2Vec for individual activity embeddings"""
    
    def __init__(self, embedding_dim: int = 50):
        self.embedding_dim = embedding_dim
        self.activity_to_idx = {}
        self.embeddings = None
        
    def train(self, event_log: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Train activity embeddings from event log"""
        # Extract all unique activities
        activities = list(set(event.get('activity', '') for event in event_log))
        self.activity_to_idx = {act: idx for idx, act in enumerate(activities)}
        
        # Initialize random embeddings (in production, train with neural network)
        self.embeddings = np.random.randn(len(activities), self.embedding_dim)
        
        # Normalize
        norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        self.embeddings = self.embeddings / norms
        
        return {
            'num_activities': len(activities),
            'embedding_dim': self.embedding_dim,
            'activities': activities
        }
    
    def get_embedding(self, activity: str) -> np.ndarray:
        """Get embedding for an activity"""
        idx = self.activity_to_idx.get(activity)
        if idx is None:
            return None
        return self.embeddings[idx]
    
    def find_similar(self, activity: str, topn: int = 5) -> List[Tuple[str, float]]:
        """Find similar activities"""
        embedding = self.get_embedding(activity)
        if embedding is None:
            return []
        
        # Calculate similarities
        similarities = np.dot(self.embeddings, embedding)
        
        # Get top-n
        top_indices = np.argsort(similarities)[::-1][1:topn+1]  # Exclude self
        
        idx_to_activity = {idx: act for act, idx in self.activity_to_idx.items()}
        return [(idx_to_activity[idx], float(similarities[idx])) for idx in top_indices]


def analyze_process_with_trace2vec(
    event_log: List[Dict[str, Any]],
    n_clusters: int = 5
) -> Dict[str, Any]:
    """
    Analyze process using Trace2Vec
    
    Args:
        event_log: Process event log
        n_clusters: Number of trace clusters
        
    Returns:
        Analysis results with embeddings and clusters
    """
    # Extract traces (group by case ID)
    traces_dict = defaultdict(list)
    for event in event_log:
        case_id = event.get('case_id', event.get('caseId'))
        activity = event.get('activity')
        if case_id and activity:
            traces_dict[case_id].append(activity)
    
    traces = list(traces_dict.values())
    
    # Train Trace2Vec
    trace2vec = Trace2Vec(vector_size=100)
    training_result = trace2vec.train(traces)
    
    if not training_result.get('successful', False):
        return training_result
    
    # Find similar activities
    all_activities = list(set(activity for trace in traces for activity in trace))
    activity_similarities = {}
    for activity in all_activities[:10]:  # Top 10 for demo
        similar = trace2vec.get_similar_activities(activity, topn=3)
        if similar:
            activity_similarities[activity] = similar
    
    # Cluster traces
    clustering_result = trace2vec.cluster_traces(traces, n_clusters)
    
    return {
        'algorithm': 'Trace2Vec',
        'training': training_result,
        'activity_similarities': activity_similarities,
        'trace_clustering': clustering_result,
        'insights': {
            'semantic_understanding': True,
            'use_case': 'Process variant analysis, similarity detection, clustering'
        }
    }
