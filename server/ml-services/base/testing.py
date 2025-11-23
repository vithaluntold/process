"""
Automated testing harness for ML models
Persistence testing, backtesting, and evaluation framework
"""

import numpy as np
from typing import Any, Dict, List, Callable, Optional, Tuple
from pathlib import Path
import tempfile
import json


class PersistenceTest:
    """Test model save/load cycle"""
    
    @staticmethod
    def test_save_load(model: Any, test_data: Any) -> Dict[str, Any]:
        """
        Test that model saves and loads correctly
        
        Args:
            model: Trained model instance
            test_data: Test data for prediction
        
        Returns:
            Test results with pass/fail status
        """
        results = {
            'test_name': 'save_load',
            'passed': False,
            'errors': []
        }
        
        try:
            # Get predictions before save
            pred_before = model.predict(test_data)
            
            # Save model
            with tempfile.TemporaryDirectory() as tmpdir:
                save_path = Path(tmpdir) / 'test_model.pkl'
                model.save(str(save_path))
                
                # Verify file exists
                if not save_path.exists():
                    results['errors'].append("Model file not created")
                    return results
                
                # Create new instance and load
                model_class = type(model)
                loaded_model = model_class.__new__(model_class)
                loaded_model.load(str(save_path))
                
                # Get predictions after load
                pred_after = loaded_model.predict(test_data)
                
                # Compare predictions
                if hasattr(pred_before, 'predictions'):
                    before_vals = pred_before.predictions
                    after_vals = pred_after.predictions
                else:
                    before_vals = pred_before
                    after_vals = pred_after
                
                # Check if predictions match
                if isinstance(before_vals, (list, np.ndarray)):
                    before_array = np.array(before_vals)
                    after_array = np.array(after_vals)
                    
                    if before_array.shape != after_array.shape:
                        results['errors'].append(
                            f"Shape mismatch: {before_array.shape} vs {after_array.shape}"
                        )
                        return results
                    
                    # Allow small numerical differences
                    if not np.allclose(before_array, after_array, rtol=1e-5, atol=1e-8):
                        max_diff = np.max(np.abs(before_array - after_array))
                        results['errors'].append(
                            f"Predictions differ after load (max diff: {max_diff})"
                        )
                        return results
                
                results['passed'] = True
                
        except Exception as e:
            results['errors'].append(f"Exception during save/load: {str(e)}")
        
        return results


class BacktestFramework:
    """Backtesting framework for time series models"""
    
    @staticmethod
    def rolling_window_backtest(
        model_class: type,
        data: np.ndarray,
        window_size: int,
        horizon: int,
        n_splits: int = 5
    ) -> Dict[str, Any]:
        """
        Perform rolling window backtesting
        
        Args:
            model_class: Model class to instantiate
            data: Full time series
            window_size: Size of training window
            horizon: Forecast horizon
            n_splits: Number of test splits
        
        Returns:
            Backtest results with metrics
        """
        if len(data) < window_size + horizon * n_splits:
            raise ValueError("Insufficient data for backtesting")
        
        predictions = []
        actuals = []
        errors = []
        
        for i in range(n_splits):
            start_idx = i * horizon
            train_end = start_idx + window_size
            test_end = train_end + horizon
            
            if test_end > len(data):
                break
            
            # Split data
            train_data = data[start_idx:train_end]
            test_data = data[train_end:test_end]
            
            try:
                # Train model
                model = model_class(model_id=f"backtest_{i}")
                result = model.train(train_data)
                
                if not result.success:
                    errors.append(f"Split {i}: Training failed - {result.error}")
                    continue
                
                # Forecast
                forecast = model.forecast(train_data, horizon=len(test_data))
                pred_values = forecast.get('forecast', []) if isinstance(forecast, dict) else forecast
                
                predictions.extend(pred_values)
                actuals.extend(test_data.tolist())
                
            except Exception as e:
                errors.append(f"Split {i}: {str(e)}")
        
        # Calculate overall metrics
        if predictions and actuals:
            predictions = np.array(predictions)
            actuals = np.array(actuals)
            
            mae = float(np.mean(np.abs(predictions - actuals)))
            rmse = float(np.sqrt(np.mean((predictions - actuals) ** 2)))
            mape = float(np.mean(np.abs((predictions - actuals) / (actuals + 1e-10))) * 100)
            
            return {
                'passed': len(errors) == 0,
                'n_splits': n_splits,
                'successful_splits': n_splits - len(errors),
                'metrics': {
                    'mae': mae,
                    'rmse': rmse,
                    'mape': mape
                },
                'errors': errors
            }
        else:
            return {
                'passed': False,
                'errors': errors + ["No successful predictions"]
            }


class AnomalyDetectionEvaluator:
    """Evaluation framework for anomaly detection"""
    
    @staticmethod
    def evaluate_with_synthetic_anomalies(
        detector: Any,
        normal_data: np.ndarray,
        contamination_rate: float = 0.1
    ) -> Dict[str, float]:
        """
        Evaluate detector using synthetic anomalies
        
        Args:
            detector: Trained anomaly detector
            normal_data: Normal samples
            contamination_rate: Fraction of data to corrupt
        
        Returns:
            Evaluation metrics
        """
        n_anomalies = int(len(normal_data) * contamination_rate)
        
        # Create synthetic anomalies (add noise)
        anomalies = normal_data[:n_anomalies].copy()
        noise_scale = 3 * np.std(normal_data, axis=0)
        anomalies += np.random.randn(*anomalies.shape) * noise_scale
        
        # Combine and create labels
        test_data = np.vstack([normal_data[n_anomalies:], anomalies])
        labels = np.array([0] * (len(normal_data) - n_anomalies) + [1] * n_anomalies)
        
        # Shuffle
        indices = np.random.permutation(len(test_data))
        test_data = test_data[indices]
        labels = labels[indices]
        
        # Evaluate
        metrics = detector.evaluate(test_data, labels)
        
        return metrics
    
    @staticmethod
    def stability_test(
        detector_class: type,
        data: np.ndarray,
        n_runs: int = 5
    ) -> Dict[str, Any]:
        """
        Test stability of detector across multiple runs
        
        Args:
            detector_class: Detector class
            data: Training data
            n_runs: Number of runs
        
        Returns:
            Stability metrics
        """
        predictions_list = []
        
        for run in range(n_runs):
            detector = detector_class(model_id=f"stability_test_{run}")
            result = detector.train(data)
            
            if result.success:
                pred_result = detector.predict(data)
                predictions_list.append(pred_result.predictions)
        
        if len(predictions_list) < 2:
            return {
                'passed': False,
                'error': 'Insufficient successful runs for stability test'
            }
        
        # Compare predictions across runs
        # Check if anomalies detected are consistent
        anomaly_indices_list = []
        for preds in predictions_list:
            anomaly_indices = [i for i, p in enumerate(preds) if p.get('is_anomaly', False)]
            anomaly_indices_list.append(set(anomaly_indices))
        
        # Calculate Jaccard similarity between runs
        similarities = []
        for i in range(len(anomaly_indices_list)):
            for j in range(i + 1, len(anomaly_indices_list)):
                intersection = len(anomaly_indices_list[i] & anomaly_indices_list[j])
                union = len(anomaly_indices_list[i] | anomaly_indices_list[j])
                similarity = intersection / union if union > 0 else 1.0
                similarities.append(similarity)
        
        avg_similarity = np.mean(similarities) if similarities else 0.0
        
        return {
            'passed': avg_similarity > 0.8,  # 80% consistency threshold
            'avg_similarity': float(avg_similarity),
            'n_runs': n_runs,
            'successful_runs': len(predictions_list)
        }


class ModelTestSuite:
    """Complete test suite for ML models"""
    
    def __init__(self, model: Any, test_data: Any = None):
        self.model = model
        self.test_data = test_data
        self.results = {}
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all applicable tests"""
        # Persistence test
        if self.test_data is not None:
            self.results['persistence'] = PersistenceTest.test_save_load(
                self.model,
                self.test_data
            )
        
        return {
            'model_id': self.model.model_id,
            'model_type': self.model.model_type,
            'tests': self.results,
            'all_passed': all(r.get('passed', False) for r in self.results.values())
        }
