"""
Production-Ready ARIMA/SARIMA Forecaster
Statistical time series forecasting
FIXED: Uses lifecycle hooks, proper error handling, artifact storage
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


class ARIMAForecaster(ForecasterBase):
    """ARIMA/SARIMA forecaster with auto-parameter selection and production-ready lifecycle"""
    
    def __init__(
        self,
        model_id: str = "arima_default",
        horizon: int = 30,
        seasonal: bool = False,
        m: int = 7  # Seasonal period
    ):
        super().__init__(model_id, "arima", horizon)
        self.seasonal = seasonal
        self.m = m
        self.order = None
        
        self.metadata.hyperparameters.update({
            'seasonal': seasonal,
            'seasonal_period': m
        })
    
    def before_train(self, context: LifecycleContext) -> None:
        """Lifecycle hook before training"""
        print(f"[{self.model_id}] Starting ARIMA training at {context.timestamp}")
        self.metadata.status = 'training'
    
    def after_train(self, context: LifecycleContext) -> None:
        """Lifecycle hook after training"""
        print(f"[{self.model_id}] ARIMA training completed")
        self.metadata.status = 'trained'
    
    def train(self, data: Any, timestamps: Optional[List[datetime]] = None, **kwargs) -> TrainingResult:
        """Train ARIMA model with auto parameter selection and proper lifecycle"""
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
                from pmdarima import auto_arima
            except ImportError:
                raise TrainingError(
                    "pmdarima not available. Install with: pip install pmdarima",
                    context={'dependency': 'pmdarima'}
                )
            
            if isinstance(data, list):
                data = np.array(data)
            
            if len(data) < 10:
                raise TrainingError(
                    f"Insufficient training data: need at least 10 samples, got {len(data)}",
                    context={'samples': len(data)}
                )
            
            self.metadata.training_samples = len(data)
            
            # Auto ARIMA with proper error handling
            try:
                self.model = auto_arima(
                    data,
                    seasonal=self.seasonal,
                    m=self.m if self.seasonal else 1,
                    stepwise=True,
                    suppress_warnings=True,
                    error_action='ignore',
                    max_p=5,
                    max_q=5,
                    max_P=2,
                    max_Q=2,
                    trace=False,
                    n_jobs=-1
                )
                
                self.order = self.model.order
                
            except Exception as e:
                raise TrainingError(f"ARIMA fitting failed: {str(e)}", context={'error': str(e)})
            
            self.is_trained = True
            
            # In-sample performance
            fitted_values = self.model.predict_in_sample()
            mae = float(np.mean(np.abs(data - fitted_values)))
            rmse = float(np.sqrt(np.mean((data - fitted_values) ** 2)))
            mape = float(np.mean(np.abs((data - fitted_values) / (data + 1e-8))) * 100)
            
            metrics = {
                'training_samples': len(data),
                'order': str(self.order),
                'mae': mae,
                'rmse': rmse,
                'mape': mape,
                'seasonal': self.seasonal
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
            h = horizon or self.horizon
            
            # Forecast with confidence intervals
            forecast_values, conf_int = self.model.predict(n_periods=h, return_conf_int=True)
            
            results = {
                'forecast': forecast_values.tolist(),
                'confidence_intervals': {
                    '95%': {
                        'lower': conf_int[:, 0].tolist(),
                        'upper': conf_int[:, 1].tolist()
                    }
                },
                'horizon': h,
                'model_order': str(self.order)
            }
            
            # Invoke after_predict hook
            self.after_predict(context)
            
            return PredictionResult(
                predictions=results,
                metadata={
                    'model_type': 'arima',
                    'order': str(self.order),
                    'horizon': h,
                    'seasonal': self.seasonal
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
        
        # Call parent save (handles ARIMA model and creates base manifest)
        save_dir = super().save(path)
        save_dir_path = Path(save_dir)
        artifact_dir = save_dir_path / "artifacts"
        
        # Get the model artifact from parent save
        model_artifact = self.metadata.artifacts[0]
        
        # Save order for reference
        order_path = artifact_dir / "model_order.json"
        order_spec = ArtifactStore.save({
            'order': str(self.order),
            'seasonal': self.seasonal,
            'm': self.m
        }, order_path, 'json', name='model_order')
        
        # Replace artifacts list with complete set (prevents accumulation on repeated saves)
        self.metadata.artifacts = [model_artifact, order_spec]
        
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
        
        # ALSO load order
        load_dir = Path(path)
        artifact_dir = load_dir / "artifacts"
        
        for artifact_spec in self.metadata.artifacts:
            if artifact_spec.name == 'model_order':
                order_path = artifact_dir / artifact_spec.filename
                order_data = ArtifactStore.load(order_path, artifact_spec.artifact_type)
                self.order = order_data.get('order')
                self.seasonal = order_data.get('seasonal', False)
                self.m = order_data.get('m', 7)
