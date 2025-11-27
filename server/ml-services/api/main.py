"""
FastAPI Server for EPI-Q ML Services
Bridges Python ML models with TypeScript backend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

app = FastAPI(
    title="EPI-Q ML Services API",
    description="Production-ready ML algorithms for process mining",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EventLog(BaseModel):
    case_id: str
    activity: str
    timestamp: str
    resource: Optional[str] = None
    duration: Optional[float] = None


class AnomalyDetectionRequest(BaseModel):
    events: List[EventLog]
    algorithm: str = "isolation_forest"
    contamination: float = 0.05


class AnomalyDetectionResponse(BaseModel):
    success: bool
    algorithm: str
    total_events: int
    anomalies_detected: int
    anomaly_rate: float
    anomalies: List[Dict[str, Any]]
    model_metrics: Dict[str, Any]


class ForecastRequest(BaseModel):
    values: List[float]
    timestamps: Optional[List[str]] = None
    horizon: int = 30
    algorithm: str = "holt_winters"


class ForecastResponse(BaseModel):
    success: bool
    algorithm: str
    forecast: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    confidence_intervals: Dict[str, Any]


class HealthResponse(BaseModel):
    status: str
    algorithms_available: Dict[str, List[str]]
    version: str


def extract_features(events: List[EventLog]) -> np.ndarray:
    """Extract numerical features from event logs for ML models"""
    features = []
    
    case_events = {}
    for event in events:
        if event.case_id not in case_events:
            case_events[event.case_id] = []
        case_events[event.case_id].append(event)
    
    for case_id, case_data in case_events.items():
        sorted_events = sorted(case_data, key=lambda x: x.timestamp)
        
        for i, event in enumerate(sorted_events):
            try:
                ts = datetime.fromisoformat(event.timestamp.replace('Z', '+00:00'))
            except:
                ts = datetime.now()
            
            duration = event.duration if event.duration else 0
            if i > 0:
                try:
                    prev_ts = datetime.fromisoformat(sorted_events[i-1].timestamp.replace('Z', '+00:00'))
                    duration = (ts - prev_ts).total_seconds()
                except:
                    pass
            
            feature_vector = [
                ts.hour,
                ts.weekday(),
                len(case_data),
                i,
                duration,
                hash(event.activity) % 1000,
            ]
            features.append(feature_vector)
    
    return np.array(features) if features else np.array([[0]*6])


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check API health and list available algorithms"""
    return HealthResponse(
        status="healthy",
        algorithms_available={
            "anomaly_detection": [
                "isolation_forest",
                "statistical_zscore",
                "dbscan"
            ],
            "forecasting": [
                "holt_winters",
                "linear_regression",
                "moving_average"
            ],
            "simulation": [
                "monte_carlo",
                "parameter_based"
            ]
        },
        version="1.0.0"
    )


@app.post("/anomaly-detection", response_model=AnomalyDetectionResponse)
async def detect_anomalies(request: AnomalyDetectionRequest):
    """Detect anomalies in event log data using ML algorithms"""
    try:
        if len(request.events) < 10:
            raise HTTPException(
                status_code=400,
                detail="Insufficient data: need at least 10 events for anomaly detection"
            )
        
        X = extract_features(request.events)
        
        if request.algorithm == "isolation_forest":
            from sklearn.ensemble import IsolationForest
            
            model = IsolationForest(
                contamination=request.contamination,
                n_estimators=100,
                max_samples=min(256, len(X)),
                random_state=42,
                n_jobs=-1
            )
            
            model.fit(X)
            predictions = model.predict(X)
            scores = model.score_samples(X)
            
            anomalies = []
            for i, (pred, score) in enumerate(zip(predictions, scores)):
                if pred == -1:
                    event = request.events[i] if i < len(request.events) else None
                    if event:
                        anomalies.append({
                            "index": i,
                            "case_id": event.case_id,
                            "activity": event.activity,
                            "timestamp": event.timestamp,
                            "anomaly_score": float(-score),
                            "severity": "high" if score < np.percentile(scores, 5) else "medium"
                        })
            
            return AnomalyDetectionResponse(
                success=True,
                algorithm="isolation_forest",
                total_events=len(request.events),
                anomalies_detected=len(anomalies),
                anomaly_rate=len(anomalies) / len(request.events),
                anomalies=anomalies[:100],
                model_metrics={
                    "threshold": float(np.percentile(scores, request.contamination * 100)),
                    "mean_score": float(np.mean(scores)),
                    "std_score": float(np.std(scores))
                }
            )
        
        elif request.algorithm == "statistical_zscore":
            durations = np.array([e.duration if e.duration else 0 for e in request.events])
            if durations.std() > 0:
                z_scores = np.abs((durations - durations.mean()) / durations.std())
            else:
                z_scores = np.zeros_like(durations)
            
            anomalies = []
            for i, z in enumerate(z_scores):
                if z > 3:
                    event = request.events[i]
                    anomalies.append({
                        "index": i,
                        "case_id": event.case_id,
                        "activity": event.activity,
                        "timestamp": event.timestamp,
                        "z_score": float(z),
                        "severity": "critical" if z > 5 else "high" if z > 4 else "medium"
                    })
            
            return AnomalyDetectionResponse(
                success=True,
                algorithm="statistical_zscore",
                total_events=len(request.events),
                anomalies_detected=len(anomalies),
                anomaly_rate=len(anomalies) / len(request.events),
                anomalies=anomalies[:100],
                model_metrics={
                    "mean_duration": float(durations.mean()),
                    "std_duration": float(durations.std()),
                    "threshold_z": 3.0
                }
            )
        
        elif request.algorithm == "dbscan":
            from sklearn.cluster import DBSCAN
            from sklearn.preprocessing import StandardScaler
            
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            db = DBSCAN(eps=0.5, min_samples=5)
            labels = db.fit_predict(X_scaled)
            
            anomalies = []
            for i, label in enumerate(labels):
                if label == -1:
                    event = request.events[i] if i < len(request.events) else None
                    if event:
                        anomalies.append({
                            "index": i,
                            "case_id": event.case_id,
                            "activity": event.activity,
                            "timestamp": event.timestamp,
                            "cluster": int(label),
                            "severity": "medium"
                        })
            
            return AnomalyDetectionResponse(
                success=True,
                algorithm="dbscan",
                total_events=len(request.events),
                anomalies_detected=len(anomalies),
                anomaly_rate=len(anomalies) / len(request.events),
                anomalies=anomalies[:100],
                model_metrics={
                    "n_clusters": int(len(set(labels)) - (1 if -1 in labels else 0)),
                    "noise_ratio": float(sum(1 for l in labels if l == -1) / len(labels))
                }
            )
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown algorithm: {request.algorithm}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/forecast", response_model=ForecastResponse)
async def generate_forecast(request: ForecastRequest):
    """Generate time series forecasts using ML algorithms"""
    try:
        if len(request.values) < 3:
            raise HTTPException(
                status_code=400,
                detail="Insufficient data: need at least 3 data points for forecasting"
            )
        
        values = np.array(request.values)
        
        if request.algorithm == "holt_winters":
            alpha = 0.3
            beta = 0.1
            
            level = values[0]
            trend = 0
            
            for i in range(1, len(values)):
                prev_level = level
                level = alpha * values[i] + (1 - alpha) * (level + trend)
                trend = beta * (level - prev_level) + (1 - beta) * trend
            
            forecast = []
            std_dev = float(np.std(values))
            
            for i in range(1, request.horizon + 1):
                point_forecast = level + i * trend
                margin = 1.96 * std_dev * np.sqrt(i / len(values))
                
                forecast.append({
                    "step": i,
                    "value": max(0, float(point_forecast)),
                    "lower": max(0, float(point_forecast - margin)),
                    "upper": float(point_forecast + margin)
                })
            
            return ForecastResponse(
                success=True,
                algorithm="holt_winters",
                forecast=forecast,
                metrics={
                    "level": float(level),
                    "trend": float(trend),
                    "alpha": alpha,
                    "beta": beta
                },
                confidence_intervals={
                    "confidence_level": 0.95,
                    "method": "prediction_interval"
                }
            )
        
        elif request.algorithm == "linear_regression":
            from sklearn.linear_model import LinearRegression
            
            X = np.arange(len(values)).reshape(-1, 1)
            y = values
            
            model = LinearRegression()
            model.fit(X, y)
            
            future_X = np.arange(len(values), len(values) + request.horizon).reshape(-1, 1)
            predictions = model.predict(future_X)
            
            residuals = y - model.predict(X)
            std_dev = float(np.std(residuals))
            
            forecast = []
            for i, pred in enumerate(predictions):
                margin = 1.645 * std_dev * np.sqrt(1 + 1/len(values))
                forecast.append({
                    "step": i + 1,
                    "value": max(0, float(pred)),
                    "lower": max(0, float(pred - margin)),
                    "upper": float(pred + margin)
                })
            
            return ForecastResponse(
                success=True,
                algorithm="linear_regression",
                forecast=forecast,
                metrics={
                    "slope": float(model.coef_[0]),
                    "intercept": float(model.intercept_),
                    "r_squared": float(model.score(X, y))
                },
                confidence_intervals={
                    "confidence_level": 0.90,
                    "method": "prediction_interval"
                }
            )
        
        elif request.algorithm == "moving_average":
            window = min(7, len(values) // 2)
            ma = float(np.mean(values[-window:]))
            std_dev = float(np.std(values[-window:]))
            
            forecast = []
            for i in range(1, request.horizon + 1):
                margin = 1.28 * std_dev * np.sqrt(i / window)
                forecast.append({
                    "step": i,
                    "value": max(0, ma),
                    "lower": max(0, ma - margin),
                    "upper": ma + margin
                })
            
            return ForecastResponse(
                success=True,
                algorithm="moving_average",
                forecast=forecast,
                metrics={
                    "window_size": window,
                    "moving_average": ma,
                    "std_dev": std_dev
                },
                confidence_intervals={
                    "confidence_level": 0.80,
                    "method": "prediction_interval"
                }
            )
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown algorithm: {request.algorithm}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SimulationRequest(BaseModel):
    process_model: Dict[str, Any]
    parameters: Dict[str, Any]
    num_simulations: int = 1000
    algorithm: str = "monte_carlo"


class SimulationResponse(BaseModel):
    success: bool
    algorithm: str
    num_simulations: int
    results: Dict[str, Any]
    statistics: Dict[str, Any]


@app.post("/simulation", response_model=SimulationResponse)
async def run_simulation(request: SimulationRequest):
    """Run process simulation using specified algorithm"""
    try:
        if request.algorithm == "monte_carlo":
            base_cycle_time = request.parameters.get("base_cycle_time", 60)
            variance = request.parameters.get("variance", 0.2)
            
            simulated_times = np.random.normal(
                base_cycle_time,
                base_cycle_time * variance,
                request.num_simulations
            )
            simulated_times = np.maximum(simulated_times, 1)
            
            return SimulationResponse(
                success=True,
                algorithm="monte_carlo",
                num_simulations=request.num_simulations,
                results={
                    "cycle_times": simulated_times.tolist()[:100],
                    "percentiles": {
                        "p10": float(np.percentile(simulated_times, 10)),
                        "p25": float(np.percentile(simulated_times, 25)),
                        "p50": float(np.percentile(simulated_times, 50)),
                        "p75": float(np.percentile(simulated_times, 75)),
                        "p90": float(np.percentile(simulated_times, 90)),
                        "p95": float(np.percentile(simulated_times, 95)),
                        "p99": float(np.percentile(simulated_times, 99))
                    }
                },
                statistics={
                    "mean": float(np.mean(simulated_times)),
                    "median": float(np.median(simulated_times)),
                    "std_dev": float(np.std(simulated_times)),
                    "min": float(np.min(simulated_times)),
                    "max": float(np.max(simulated_times))
                }
            )
        
        elif request.algorithm == "parameter_based":
            activities = request.process_model.get("activities", [])
            activity_times = request.parameters.get("activity_times", {})
            
            total_time = sum(activity_times.get(a, 10) for a in activities)
            
            return SimulationResponse(
                success=True,
                algorithm="parameter_based",
                num_simulations=1,
                results={
                    "estimated_cycle_time": total_time,
                    "activity_breakdown": {a: activity_times.get(a, 10) for a in activities}
                },
                statistics={
                    "total_activities": len(activities),
                    "avg_activity_time": total_time / max(len(activities), 1)
                }
            )
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown algorithm: {request.algorithm}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
