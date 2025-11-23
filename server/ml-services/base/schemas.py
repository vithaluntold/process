"""
Data schemas for ML services
Ensures consistent I/O contracts across all algorithms
"""

from typing import List, Dict, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime
import numpy as np


@dataclass
class EventLogSchema:
    """Standard schema for process event logs"""
    case_id: str
    activity: str
    timestamp: datetime
    resource: Optional[str] = None
    duration: Optional[float] = None
    cost: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'EventLogSchema':
        """Create from dictionary"""
        return cls(
            case_id=str(data.get('case_id', data.get('caseId', ''))),
            activity=str(data.get('activity', '')),
            timestamp=data.get('timestamp') if isinstance(data.get('timestamp'), datetime) 
                     else datetime.fromisoformat(str(data.get('timestamp', datetime.now().isoformat()))),
            resource=data.get('resource'),
            duration=float(data['duration']) if data.get('duration') is not None else None,
            cost=float(data['cost']) if data.get('cost') is not None else None,
            metadata=data.get('metadata', {})
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'case_id': self.case_id,
            'activity': self.activity,
            'timestamp': self.timestamp.isoformat(),
            'resource': self.resource,
            'duration': self.duration,
            'cost': self.cost,
            'metadata': self.metadata
        }


@dataclass
class AnomalyDetectionInput:
    """Input schema for anomaly detection"""
    events: List[EventLogSchema]
    features: Optional[List[str]] = None  # Which features to use
    contamination: Optional[float] = 0.05
    
    def to_feature_matrix(self) -> np.ndarray:
        """Convert events to feature matrix"""
        features = []
        for event in self.events:
            feature_vec = [
                event.duration if event.duration is not None else 0.0,
                hash(event.resource) % 1000 if event.resource else 0.0,
                event.cost if event.cost is not None else 0.0,
                event.timestamp.hour if event.timestamp else 0,
                event.timestamp.weekday() if event.timestamp else 0
            ]
            features.append(feature_vec)
        return np.array(features)


@dataclass
class AnomalyDetectionOutput:
    """Output schema for anomaly detection"""
    total_events: int
    anomalies_detected: int
    anomaly_rate: float
    anomalies: List[Dict[str, Any]]
    model_info: Dict[str, Any]
    performance_metrics: Optional[Dict[str, float]] = None


@dataclass
class ForecastingInput:
    """Input schema for forecasting"""
    historical_values: List[float]
    timestamps: Optional[List[datetime]] = None
    horizon: int = 30
    confidence_level: float = 0.95
    external_features: Optional[np.ndarray] = None
    
    def to_array(self) -> np.ndarray:
        """Convert to numpy array"""
        return np.array(self.historical_values)


@dataclass
class ForecastingOutput:
    """Output schema for forecasting"""
    forecast: List[float]
    horizon: int
    confidence_intervals: Dict[str, Dict[str, List[float]]]  # {'95%': {'lower': [...], 'upper': [...]}}
    model_type: str
    performance_metrics: Optional[Dict[str, float]] = None
    components: Optional[Dict[str, List[float]]] = None  # Trend, seasonality, etc.


@dataclass
class ProcessDiscoveryInput:
    """Input schema for process discovery"""
    event_log: List[EventLogSchema]
    algorithm: str  # 'alpha', 'inductive', 'ocpm', 'trace2vec'
    parameters: Optional[Dict[str, Any]] = None


@dataclass
class ProcessDiscoveryOutput:
    """Output schema for process discovery"""
    model_type: str
    places: List[Dict[str, Any]]
    transitions: List[Dict[str, Any]]
    arcs: List[Dict[str, Any]]
    statistics: Dict[str, Any]
    quality_metrics: Optional[Dict[str, float]] = None


@dataclass
class OptimizationInput:
    """Input schema for RL optimization"""
    process_model: Dict[str, Any]
    objective: str  # 'minimize_cycle_time', 'maximize_throughput', 'balanced'
    constraints: Optional[Dict[str, Any]] = None
    training_timesteps: int = 100000


@dataclass
class OptimizationOutput:
    """Output schema for RL optimization"""
    optimal_parameters: Dict[str, float]
    expected_results: Dict[str, Any]
    improvement_metrics: Dict[str, str]
    training_info: Dict[str, Any]


def validate_event_log(events: List[Dict[str, Any]]) -> List[EventLogSchema]:
    """
    Validate and convert event log to schema
    Raises ValueError if validation fails
    """
    validated = []
    for i, event in enumerate(events):
        try:
            validated.append(EventLogSchema.from_dict(event))
        except Exception as e:
            raise ValueError(f"Event {i} validation failed: {str(e)}")
    
    if not validated:
        raise ValueError("Event log is empty")
    
    return validated


def convert_to_sequences(events: List[EventLogSchema], sequence_length: int) -> np.ndarray:
    """Convert events to sequences for LSTM models"""
    # Group by case_id
    cases = {}
    for event in events:
        if event.case_id not in cases:
            cases[event.case_id] = []
        cases[event.case_id].append(event)
    
    # Sort each case by timestamp
    for case_id in cases:
        cases[case_id].sort(key=lambda e: e.timestamp)
    
    # Create sequences
    sequences = []
    for case_id, case_events in cases.items():
        if len(case_events) >= sequence_length:
            for i in range(len(case_events) - sequence_length + 1):
                sequence = []
                for j in range(sequence_length):
                    event = case_events[i + j]
                    sequence.append([
                        event.duration if event.duration else 0.0,
                        hash(event.activity) % 100,
                        hash(event.resource) % 100 if event.resource else 0,
                    ])
                sequences.append(sequence)
    
    return np.array(sequences) if sequences else np.array([])
