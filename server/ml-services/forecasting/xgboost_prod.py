"""
Production-Ready XGBoost Forecaster
Gradient boosting for time series
FIXED: Uses lifecycle hooks, deterministic features, proper artifact storage
"""

import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from base.ml_model_base import (
    ForecasterBase,
    TrainingResult,
    PredictionResult,
    TrainingError,
    PredictionError,
    LifecycleContext,
    ArtifactStore,
    PersistenceError
)


class XGBoostForecaster(ForecasterBase):
    """XGBoost forecaster with lag features and production-ready lifecycle"""
    
    def __init__(
        self,
        model_id: str = "xgboost_default",
        horizon: int = 30,
        n_lags: int = 7,
        n_estimators: int = 100
    ):
        super().__init__(model_id, "xgboost", horizon)
        self.n_lags = n_lags
        self.n_estimators = n_estimators
        self.training_data = None  # Store for future predictions
        
        self.metadata.hyperparameters.update({
            'n_lags': n_lags,
            'n_estimators': n_estimators
        })
    
    def _create_features(self, data: np.ndarray) -> tuple:
        """Create deterministic lag features"""
        X, y = [], []
        
        for i in range(self.n_lags, len(data)):
            X.append(data[i-self.n_lags:i])
            y.append(data[i])
        
        return np.array(X), np.array(y)
    
    def before_train(self, context: LifecycleContext) -> None:
        """Lifecycle hook before training"""
        print(f"[{self.model_id}] Starting XGBoost training at {context.timestamp}")
        self.metadata.status = 'training'
    
    def after_train(self, context: LifecycleContext) -> None:
        """Lifecycle hook after training"""
        print(f"[{self.model_id}] XGBoost training completed")
        self.metadata.status = 'trained'
    
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """Train XGBoost model with proper lifecycle"""
        # Invoke before_train hook
        context = LifecycleContext(
            model_id=self.model_id,
            model_type=self.model_type,
            operation='train',
            timestamp=datetime.now()
        )
        self.before_train(context)
        
        try:
            try:
                from xgboost import XGBRegressor
            except ImportError:
                raise TrainingError(
                    "xgboost not available. Install with: pip install xgboost",
                    context={'dependency': 'xgboost'}
                )
            
            if isinstance(data, list):
                data = np.array(data)
            
            if len(data) < self.n_lags + 10:
                raise TrainingError(
                    f"Insufficient data: need at least {self.n_lags + 10} samples, got {len(data)}",
                    context={'samples': len(data), 'min_required': self.n_lags + 10}
                )
            
            # Store training data for future forecasting
            self.training_data = data.copy()
            
            # Create features
            X, y = self._create_features(data)
            self.metadata.training_samples = len(X)
            
            # Train model
            self.model = XGBRegressor(
                n_estimators=self.n_estimators,
                learning_rate=0.1,
                max_depth=5,
                random_state=42,
                n_jobs=-1
            )
            
            self.model.fit(X, y)
            
            self.is_trained = True
            
            # Calculate metrics
            predictions = self.model.predict(X)
            mae = float(np.mean(np.abs(predictions - y)))
            rmse = float(np.sqrt(np.mean((predictions - y) ** 2)))
            mape = float(np.mean(np.abs((y - predictions) / (y + 1e-8))) * 100)
            
            metrics = {
                'training_samples': len(X),
                'n_lags': self.n_lags,
                'mae': mae,
                'rmse': rmse,
                'mape': mape,
                'n_estimators': self.n_estimators
            }
            
            self.metadata.performance_metrics = metrics
            
            # Invoke after_train hook
            self.after_train(context)
            
            return TrainingResult(
                success=True,
                metrics=metrics,
                metadata=self.metadata
            )
            
        except TrainingError:
            self.metadata.status = 'failed'
            raise
        except Exception as e:
            self.metadata.status = 'failed'
            raise TrainingError(f"Unexpected training error: {str(e)}", context={'error': str(e)})
    
    def predict(self, data: Any, horizon: Optional[int] = None, **kwargs) -> PredictionResult:
        """Generate forecast with proper lifecycle"""
        if not self.is_trained:
            raise PredictionError("Model must be trained before prediction")
        
        # Invoke before_predict hook
        context = LifecycleContext(
            model_id=self.model_id,
            model_type=self.model_type,
            operation='predict',
            timestamp=datetime.now()
        )
        self.before_predict(context)
        
        try:
            if isinstance(data, list):
                data = np.array(data)
            
            h = horizon or self.horizon
            
            # Use last n_lags points as seed
            forecast = []
            current_window = data[-self.n_lags:].tolist()
            
            for _ in range(h):
                # Predict next point
                X = np.array([current_window[-self.n_lags:]])
                pred = self.model.predict(X)[0]
                forecast.append(float(pred))
                
                # Update window
                current_window.append(pred)
            
            results = {
                'forecast': forecast,
                'horizon': h,
                'n_lags_used': self.n_lags
            }
            
            # Invoke after_predict hook
            self.after_predict(context)
            
            return PredictionResult(
                predictions=results,
                metadata={
                    'model_type': 'xgboost',
                    'horizon': h,
                    'n_lags': self.n_lags
                }
            )
            
        except PredictionError:
            raise
        except Exception as e:
            raise PredictionError(f"Unexpected prediction error: {str(e)}")
    
    def forecast(self, historical_data: Any, horizon: Optional[int] = None) -> Dict[str, Any]:
        """Generate forecast (convenience method)"""
        pred_result = self.predict(historical_data, horizon)
        return pred_result.predictions
    
    def evaluate(self, data: Any, labels: Any, **kwargs) -> Dict[str, float]:
        """Evaluate forecasting performance"""
        pred_result = self.predict(data, horizon=len(labels))
        predictions = np.array(pred_result.predictions['forecast'])
        actuals = np.array(labels)
        
        mae = float(np.mean(np.abs(predictions - actuals)))
        rmse = float(np.sqrt(np.mean((predictions - actuals) ** 2)))
        mape = float(np.mean(np.abs((actuals - predictions) / (actuals + 1e-8))) * 100)
        
        metrics = {
            'mae': mae,
            'rmse': rmse,
            'mape': mape
        }
        
        self.metadata.performance_metrics.update(metrics)
        
        return metrics
    
    def save(self, path: Optional[str] = None) -> str:
        """Save with proper artifact storage"""
        if not self.is_trained:
            raise PersistenceError("Cannot save untrained model")
        
        # Call parent save (handles XGBoost model and creates base manifest)
        save_dir = super().save(path)
        save_dir_path = Path(save_dir)
        artifact_dir = save_dir_path / "artifacts"
        
        # Get the model artifact from parent save
        model_artifact = self.metadata.artifacts[0]
        
        # Save training data for future forecasting
        if self.training_data is not None:
            training_data_path = artifact_dir / "training_data.joblib"
            training_data_spec = ArtifactStore.save(
                self.training_data, training_data_path, 'joblib', name='training_data'
            )
            
            # Replace artifacts list with complete set (prevents accumulation on repeated saves)
            self.metadata.artifacts = [model_artifact, training_data_spec]
            
            # Re-save manifest
            manifest_path = save_dir_path / "manifest.json"
            with open(manifest_path, 'w') as f:
                from dataclasses import asdict
                import json
                json.dump(asdict(self.metadata), f, indent=2, default=str)
        
        return save_dir
    
    def load(self, path: str) -> None:
        """Load with proper artifact loading"""
        # Call parent load
        super().load(path)
        
        # ALSO load training data
        load_dir = Path(path)
        artifact_dir = load_dir / "artifacts"
        
        for artifact_spec in self.metadata.artifacts:
            if artifact_spec.name == 'training_data':
                training_data_path = artifact_dir / artifact_spec.filename
                self.training_data = ArtifactStore.load(training_data_path, artifact_spec.artifact_type)
