"""
Production-Ready Prophet Forecaster
Complete implementation with persistence, evaluation, and proper error handling
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from base.ml_model_base import ForecasterBase, TrainingResult, PredictionResult
from base.schemas import ForecastingInput, ForecastingOutput
from base.model_registry import get_registry


class ProphetForecaster(ForecasterBase):
    """
    Production-ready Facebook Prophet forecaster
    Business-level time series forecasting with seasonality
    """
    
    def __init__(
        self,
        model_id: str = "prophet_default",
        horizon: int = 30,
        daily_seasonality: bool = True,
        weekly_seasonality: bool = True,
        yearly_seasonality: bool = False,
        changepoint_prior_scale: float = 0.05
    ):
        super().__init__(model_id, "prophet", horizon)
        self.daily_seasonality = daily_seasonality
        self.weekly_seasonality = weekly_seasonality
        self.yearly_seasonality = yearly_seasonality
        self.changepoint_prior_scale = changepoint_prior_scale
        
        # Update hyperparameters
        self.metadata.hyperparameters.update({
            'daily_seasonality': daily_seasonality,
            'weekly_seasonality': weekly_seasonality,
            'yearly_seasonality': yearly_seasonality,
            'changepoint_prior_scale': changepoint_prior_scale
        })
    
    def train(self, data: Any, timestamps: Optional[List[datetime]] = None, **kwargs) -> TrainingResult:
        """
        Train Prophet model
        
        Args:
            data: Time series values (list or numpy array)
            timestamps: Optional timestamps for data
            **kwargs: Additional parameters
        
        Returns:
            TrainingResult with success status and metrics
        """
        try:
            # Import Prophet
            try:
                from prophet import Prophet
                import logging
                logging.getLogger('prophet').setLevel(logging.ERROR)
                logging.getLogger('cmdstanpy').setLevel(logging.ERROR)
            except ImportError:
                error_msg = "Prophet not available. Install with: pip install prophet"
                self.metadata.status = 'failed'
                return TrainingResult(
                    success=False,
                    metrics={},
                    metadata=self.metadata,
                    error=error_msg
                )
            
            # Convert to numpy array
            if isinstance(data, list):
                data = np.array(data)
            
            # Validate data
            if len(data) < 2:
                raise ValueError(f"Insufficient training data: need at least 2 samples, got {len(data)}")
            
            # Create timestamps if not provided
            if timestamps is None:
                end_date = datetime.now()
                timestamps = [end_date - timedelta(days=len(data) - i - 1) for i in range(len(data))]
            
            # Prepare DataFrame in Prophet format (ds, y)
            df = pd.DataFrame({
                'ds': pd.to_datetime(timestamps),
                'y': data
            })
            
            # Update training samples count
            self.metadata.training_samples = len(df)
            self.metadata.status = 'training'
            
            # Determine yearly seasonality based on data length
            use_yearly = self.yearly_seasonality and len(data) >= 730  # 2 years
            
            # Create and fit model
            self.model = Prophet(
                daily_seasonality=self.daily_seasonality,
                weekly_seasonality=self.weekly_seasonality,
                yearly_seasonality=use_yearly,
                changepoint_prior_scale=self.changepoint_prior_scale
            )
            
            self.model.fit(df)
            
            # Mark as trained
            self.is_trained = True
            self.metadata.status = 'trained'
            self.metadata.trained_at = datetime.now()
            
            # Calculate in-sample performance
            future = self.model.make_future_dataframe(periods=0)
            forecast = self.model.predict(future)
            
            # Calculate MAE and RMSE
            predictions = forecast['yhat'].values
            actuals = df['y'].values
            mae = np.mean(np.abs(predictions - actuals))
            rmse = np.sqrt(np.mean((predictions - actuals) ** 2))
            
            metrics = {
                'training_samples': len(df),
                'mae': float(mae),
                'rmse': float(rmse),
                'components': {
                    'trend': True,
                    'daily': self.daily_seasonality,
                    'weekly': self.weekly_seasonality,
                    'yearly': use_yearly
                }
            }
            
            self.metadata.performance_metrics = metrics
            
            return TrainingResult(
                success=True,
                metrics=metrics,
                metadata=self.metadata
            )
            
        except Exception as e:
            self.metadata.status = 'failed'
            return TrainingResult(
                success=False,
                metrics={},
                metadata=self.metadata,
                error=str(e)
            )
    
    def predict(self, data: Any, horizon: Optional[int] = None, **kwargs) -> PredictionResult:
        """
        Generate forecast
        
        Args:
            data: Historical time series (not used for Prophet, included for interface consistency)
            horizon: Forecast horizon (uses self.horizon if not specified)
        
        Returns:
            PredictionResult with forecast
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction. Call train() first.")
        
        h = horizon or self.horizon
        
        # Create future dataframe
        future = self.model.make_future_dataframe(periods=h, freq='D')
        
        # Predict
        forecast = self.model.predict(future)
        
        # Extract forecast values (last h rows)
        forecast_values = forecast['yhat'].tail(h).values
        lower_bound = forecast['yhat_lower'].tail(h).values
        upper_bound = forecast['yhat_upper'].tail(h).values
        
        # Extract components
        trend = forecast['trend'].tail(h).values
        
        results = {
            'forecast': forecast_values.tolist(),
            'confidence_intervals': {
                '95%': {
                    'lower': lower_bound.tolist(),
                    'upper': upper_bound.tolist()
                }
            },
            'components': {
                'trend': trend.tolist()
            }
        }
        
        # Add seasonality components if available
        if 'weekly' in forecast.columns:
            results['components']['weekly'] = forecast['weekly'].tail(h).values.tolist()
        if 'yearly' in forecast.columns:
            results['components']['yearly'] = forecast['yearly'].tail(h).values.tolist()
        
        return PredictionResult(
            predictions=results,
            metadata={
                'model_type': 'prophet',
                'horizon': h
            }
        )
    
    def forecast(self, historical_data: Any, horizon: Optional[int] = None) -> Dict[str, Any]:
        """
        Generate forecast (convenience method)
        
        Args:
            historical_data: Historical values (not used, kept for interface)
            horizon: Forecast horizon
        
        Returns:
            Forecast results
        """
        pred_result = self.predict(historical_data, horizon)
        return pred_result.predictions
    
    def evaluate(self, data: Any, labels: Any, **kwargs) -> Dict[str, float]:
        """
        Evaluate forecasting performance
        
        Args:
            data: Historical data (for context)
            labels: Actual future values
        
        Returns:
            Performance metrics
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before evaluation")
        
        # Generate forecast
        horizon = len(labels)
        forecast_result = self.predict(data, horizon=horizon)
        predictions = np.array(forecast_result.predictions['forecast'])
        labels = np.array(labels)
        
        # Calculate metrics
        mae = float(np.mean(np.abs(predictions - labels)))
        rmse = float(np.sqrt(np.mean((predictions - labels) ** 2)))
        mape = float(np.mean(np.abs((predictions - labels) / (labels + 1e-10))) * 100)
        
        metrics = {
            'mae': mae,
            'rmse': rmse,
            'mape': mape
        }
        
        # Update metadata
        self.metadata.performance_metrics.update(metrics)
        
        return metrics
    
    def save_to_registry(self) -> str:
        """Save model and register in model registry"""
        model_path = self.save()
        
        registry = get_registry()
        registry.register_model(
            model_id=self.model_id,
            model_type=self.model_type,
            version=self.version,
            metadata=self.metadata,
            model_path=model_path
        )
        
        return model_path


def train_prophet_forecaster(
    historical_values: List[float],
    timestamps: Optional[List[datetime]] = None,
    model_id: str = "prophet_default",
    horizon: int = 30
) -> Dict[str, Any]:
    """
    Convenience function to train Prophet forecaster
    
    Args:
        historical_values: Historical time series values
        timestamps: Optional timestamps
        model_id: Unique model identifier
        horizon: Forecast horizon
    
    Returns:
        Training results with model info
    """
    # Create forecaster
    forecaster = ProphetForecaster(
        model_id=model_id,
        horizon=horizon
    )
    
    # Train
    result = forecaster.train(historical_values, timestamps)
    
    if result.success:
        # Save to registry
        model_path = forecaster.save_to_registry()
        
        return {
            'success': True,
            'model_id': model_id,
            'model_path': model_path,
            'metrics': result.metrics,
            'model_info': forecaster.get_info()
        }
    else:
        return {
            'success': False,
            'error': result.error
        }


def forecast_with_prophet(
    historical_values: List[float],
    horizon: int = 30,
    timestamps: Optional[List[datetime]] = None,
    model_id: str = "prophet_default",
    train_if_not_exists: bool = True
) -> ForecastingOutput:
    """
    Generate forecast using Prophet
    
    Args:
        historical_values: Historical metric values
        horizon: Forecast horizon
        timestamps: Optional timestamps
        model_id: Model to use
        train_if_not_exists: Train new model if not found
    
    Returns:
        ForecastingOutput with forecast
    """
    # Try to load from registry
    registry = get_registry()
    deployed = registry.get_deployed_model('prophet', 'production')
    
    forecaster = ProphetForecaster(model_id=model_id, horizon=horizon)
    
    if deployed and deployed['model_id'] == model_id:
        # Load deployed model
        forecaster.load(deployed['model_path'])
    elif train_if_not_exists:
        # Train new model
        result = forecaster.train(historical_values, timestamps)
        if not result.success:
            raise ValueError(f"Training failed: {result.error}")
    else:
        raise ValueError(f"Model {model_id} not found and train_if_not_exists=False")
    
    # Generate forecast
    forecast_result = forecaster.forecast(historical_values, horizon)
    
    return ForecastingOutput(
        forecast=forecast_result['forecast'],
        horizon=horizon,
        confidence_intervals=forecast_result['confidence_intervals'],
        model_type='prophet',
        performance_metrics=forecaster.metadata.performance_metrics,
        components=forecast_result.get('components')
    )
