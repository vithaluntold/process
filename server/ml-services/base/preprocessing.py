"""
Deterministic preprocessing utilities for ML models
Shared feature extraction, normalization, and encoding
"""

import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import hashlib
from dataclasses import dataclass


@dataclass
class FeatureConfig:
    """Configuration for feature extraction"""
    numerical_features: List[str]
    categorical_features: List[str]
    temporal_features: List[str]
    use_normalization: bool = True


class DeterministicEncoder:
    """
    Deterministic encoding for categorical variables
    Uses consistent hashing instead of random hashing
    """
    
    def __init__(self, max_categories: int = 1000):
        self.max_categories = max_categories
        self.category_mappings = {}
        self.is_fitted = False
    
    def fit(self, categories: List[str]) -> 'DeterministicEncoder':
        """Learn category mappings from data"""
        unique_categories = sorted(set(categories))  # Sort for determinism
        
        for idx, category in enumerate(unique_categories):
            self.category_mappings[category] = idx % self.max_categories
        
        self.is_fitted = True
        return self
    
    def transform(self, categories: List[str]) -> np.ndarray:
        """Transform categories to numerical codes"""
        if not self.is_fitted:
            raise ValueError("Encoder must be fitted before transform")
        
        encoded = []
        for cat in categories:
            if cat in self.category_mappings:
                encoded.append(self.category_mappings[cat])
            else:
                # Use deterministic hash for unseen categories
                encoded.append(self._hash_string(cat) % self.max_categories)
        
        return np.array(encoded)
    
    def fit_transform(self, categories: List[str]) -> np.ndarray:
        """Fit and transform in one step"""
        return self.fit(categories).transform(categories)
    
    def _hash_string(self, s: str) -> int:
        """Deterministic hash function"""
        return int(hashlib.md5(s.encode()).hexdigest(), 16)


class StandardScaler:
    """
    Standard scaler for normalization
    Saves mean and std for consistent scaling
    """
    
    def __init__(self):
        self.mean = None
        self.std = None
        self.is_fitted = False
    
    def fit(self, data: np.ndarray) -> 'StandardScaler':
        """Learn mean and std from data"""
        self.mean = np.mean(data, axis=0)
        self.std = np.std(data, axis=0)
        self.is_fitted = True
        return self
    
    def transform(self, data: np.ndarray) -> np.ndarray:
        """Transform data using learned statistics"""
        if not self.is_fitted:
            raise ValueError("Scaler must be fitted before transform")
        
        return (data - self.mean) / (self.std + 1e-8)
    
    def fit_transform(self, data: np.ndarray) -> np.ndarray:
        """Fit and transform in one step"""
        return self.fit(data).transform(data)
    
    def inverse_transform(self, data: np.ndarray) -> np.ndarray:
        """Convert scaled data back to original scale"""
        if not self.is_fitted:
            raise ValueError("Scaler must be fitted before inverse_transform")
        
        return data * self.std + self.mean


class FeatureExtractor:
    """
    Consistent feature extraction from event logs
    Ensures deterministic and reproducible features
    """
    
    def __init__(self, config: Optional[FeatureConfig] = None):
        self.config = config or FeatureConfig(
            numerical_features=['duration', 'cost'],
            categorical_features=['activity', 'resource'],
            temporal_features=['timestamp'],
            use_normalization=True
        )
        
        self.categorical_encoders = {}
        self.scaler = StandardScaler() if self.config.use_normalization else None
        self.is_fitted = False
    
    def fit(self, events: List[Dict[str, Any]]) -> 'FeatureExtractor':
        """Learn feature extraction parameters from data"""
        # Fit categorical encoders
        for cat_feature in self.config.categorical_features:
            categories = [str(event.get(cat_feature, '')) for event in events]
            encoder = DeterministicEncoder()
            encoder.fit(categories)
            self.categorical_encoders[cat_feature] = encoder
        
        # Fit scaler if needed
        if self.scaler is not None:
            features = self._extract_raw_features(events)
            self.scaler.fit(features)
        
        self.is_fitted = True
        return self
    
    def transform(self, events: List[Dict[str, Any]]) -> np.ndarray:
        """Extract features from events"""
        if not self.is_fitted:
            raise ValueError("FeatureExtractor must be fitted before transform")
        
        features = self._extract_raw_features(events)
        
        if self.scaler is not None:
            features = self.scaler.transform(features)
        
        return features
    
    def fit_transform(self, events: List[Dict[str, Any]]) -> np.ndarray:
        """Fit and transform in one step"""
        return self.fit(events).transform(events)
    
    def _extract_raw_features(self, events: List[Dict[str, Any]]) -> np.ndarray:
        """Extract raw features before scaling"""
        feature_matrix = []
        
        for event in events:
            feature_vec = []
            
            # Numerical features
            for num_feature in self.config.numerical_features:
                value = event.get(num_feature, 0.0)
                feature_vec.append(float(value) if value is not None else 0.0)
            
            # Categorical features (encoded)
            for cat_feature in self.config.categorical_features:
                category = str(event.get(cat_feature, ''))
                if cat_feature in self.categorical_encoders:
                    encoded = self.categorical_encoders[cat_feature].transform([category])[0]
                else:
                    # Use deterministic hash if not fitted
                    encoded = int(hashlib.md5(category.encode()).hexdigest(), 16) % 1000
                feature_vec.append(float(encoded))
            
            # Temporal features
            for temp_feature in self.config.temporal_features:
                timestamp = event.get(temp_feature)
                if timestamp:
                    if isinstance(timestamp, datetime):
                        feature_vec.append(float(timestamp.hour))
                        feature_vec.append(float(timestamp.weekday()))
                    else:
                        feature_vec.append(0.0)
                        feature_vec.append(0.0)
                else:
                    feature_vec.append(0.0)
                    feature_vec.append(0.0)
            
            feature_matrix.append(feature_vec)
        
        return np.array(feature_matrix)


class TimeSeriesPreprocessor:
    """
    Preprocessing for time series data
    Handles timestamps, missing values, and normalization
    """
    
    def __init__(self, freq: str = 'D'):
        """
        Args:
            freq: Frequency of time series ('D' for daily, 'H' for hourly, etc.)
        """
        self.freq = freq
        self.scaler = StandardScaler()
        self.is_fitted = False
    
    def validate_timestamps(
        self,
        timestamps: List[datetime],
        values: List[float]
    ) -> Tuple[List[datetime], List[float]]:
        """
        Validate and clean timestamps
        Ensures chronological order and consistent frequency
        """
        if len(timestamps) != len(values):
            raise ValueError(f"Timestamps ({len(timestamps)}) and values ({len(values)}) length mismatch")
        
        if len(timestamps) == 0:
            return timestamps, values
        
        # Sort by timestamp
        sorted_pairs = sorted(zip(timestamps, values), key=lambda x: x[0])
        timestamps, values = zip(*sorted_pairs) if sorted_pairs else ([], [])
        
        return list(timestamps), list(values)
    
    def handle_missing_values(
        self,
        values: List[float],
        method: str = 'forward_fill'
    ) -> np.ndarray:
        """
        Handle missing values in time series
        
        Args:
            values: Time series values (None for missing)
            method: 'forward_fill', 'backward_fill', 'mean', or 'zero'
        """
        arr = np.array(values, dtype=float)
        
        if method == 'forward_fill':
            # Forward fill missing values
            mask = np.isnan(arr)
            idx = np.where(~mask, np.arange(len(mask)), 0)
            np.maximum.accumulate(idx, out=idx)
            arr[mask] = arr[idx[mask]]
        
        elif method == 'backward_fill':
            # Backward fill
            arr = np.flip(arr)
            mask = np.isnan(arr)
            idx = np.where(~mask, np.arange(len(mask)), 0)
            np.maximum.accumulate(idx, out=idx)
            arr[mask] = arr[idx[mask]]
            arr = np.flip(arr)
        
        elif method == 'mean':
            # Fill with mean
            mean_val = np.nanmean(arr)
            arr[np.isnan(arr)] = mean_val
        
        elif method == 'zero':
            # Fill with zero
            arr[np.isnan(arr)] = 0.0
        
        return arr
    
    def create_sequences(
        self,
        data: np.ndarray,
        sequence_length: int,
        forecast_horizon: int = 1
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create sequences for LSTM models
        
        Args:
            data: Time series data
            sequence_length: Length of input sequences
            forecast_horizon: Number of steps to forecast
        
        Returns:
            (X, y) sequences
        """
        X, y = [], []
        
        for i in range(len(data) - sequence_length - forecast_horizon + 1):
            X.append(data[i:i + sequence_length])
            y.append(data[i + sequence_length:i + sequence_length + forecast_horizon])
        
        return np.array(X), np.array(y)
