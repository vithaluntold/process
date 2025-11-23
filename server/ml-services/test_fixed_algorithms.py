"""
TEST: Prove the fixed algorithms actually work with complete save/load cycle
Tests DBSCAN, One-Class SVM, ARIMA, XGBoost
"""

import numpy as np
import sys
from pathlib import Path
import tempfile
import shutil

# Add paths for imports
parent_path = str(Path(__file__).parent.parent)
if parent_path not in sys.path:
    sys.path.insert(0, parent_path)

from ml_services.anomaly_detection.dbscan_prod import DBSCANAnomalyDetector
from ml_services.anomaly_detection.oneclass_svm_prod import OneClassSVMAnomalyDetector
from ml_services.forecasting.arima_prod import ARIMAForecaster
from ml_services.forecasting.xgboost_prod import XGBoostForecaster


def test_algorithm_save_load(name, create_fn, train_data, predict_data):
    """Generic test for train->save->load->predict cycle"""
    print(f"\n{'='*80}")
    print(f"TESTING: {name}")
    print('='*80)
    
    # Step 1: Train
    print(f"\n1. Training {name}...")
    model = create_fn()
    result = model.train(train_data)
    
    if not result.success:
        print(f"✗ Training failed: {result.error}")
        return False
    
    print(f"✓ Training successful - {result.metrics.get('training_samples', 0)} samples")
    
    # Step 2: Save
    print(f"\n2. Saving {name} with all artifacts...")
    with tempfile.TemporaryDirectory() as tmpdir:
        save_path = str(Path(tmpdir) / "test_model")
        
        try:
            saved_path = model.save(save_path)
            print(f"✓ Model saved to: {saved_path}")
            
            # Verify manifest and artifacts
            manifest_path = Path(saved_path) / "manifest.json"
            artifacts_dir = Path(saved_path) / "artifacts"
            
            if not manifest_path.exists():
                print("✗ Manifest not found!")
                return False
            
            # Check artifact count
            import json
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
            
            artifact_count = len(manifest.get('artifacts', []))
            print(f"✓ Manifest contains {artifact_count} artifacts")
            
            # List all artifacts
            for artifact in manifest.get('artifacts', []):
                print(f"  - {artifact['name']}: {artifact['filename']} ({artifact['size_bytes']} bytes)")
            
            # Step 3: Load in new instance
            print(f"\n3. Loading {name} from saved artifacts...")
            loaded_model = create_fn()
            loaded_model.load(saved_path)
            
            print(f"✓ Model loaded successfully")
            print(f"  - Model ID: {loaded_model.model_id}")
            print(f"  - Is trained: {loaded_model.is_trained}")
            print(f"  - Status: {loaded_model.metadata.status}")
            
            # Step 4: Predict with loaded model
            print(f"\n4. Making predictions with loaded model...")
            pred_result = loaded_model.predict(predict_data)
            
            print(f"✓ Predictions completed")
            
            # Verify predictions are deterministic
            print(f"\n5. Verifying deterministic predictions...")
            pred_result2 = loaded_model.predict(predict_data)
            
            # For anomaly detection, check if same indices are flagged
            # For forecasting, check if values match
            if hasattr(pred_result.predictions, '__iter__') and isinstance(pred_result.predictions, list):
                # Anomaly detection
                anomalies1 = [p['index'] for p in pred_result.predictions if p.get('is_anomaly')]
                anomalies2 = [p['index'] for p in pred_result2.predictions if p.get('is_anomaly')]
                consistent = (anomalies1 == anomalies2)
            else:
                # Forecasting
                forecast1 = pred_result.predictions.get('forecast', [])
                forecast2 = pred_result2.predictions.get('forecast', [])
                consistent = np.allclose(forecast1, forecast2, rtol=1e-6)
            
            if consistent:
                print("✓ Predictions are deterministic and consistent")
            else:
                print("✗ Predictions are NOT consistent!")
                return False
            
            print(f"\n{'='*80}")
            print(f"✓ {name} PASSED ALL TESTS")
            print('='*80)
            return True
            
        except Exception as e:
            print(f"✗ Error during testing: {str(e)}")
            import traceback
            traceback.print_exc()
            return False


def main():
    """Run all algorithm tests"""
    np.random.seed(42)
    
    # Generate test data
    normal_data = np.random.randn(100, 3)
    anomalies = normal_data[:5].copy() + np.random.randn(5, 3) * 5
    anomaly_train_data = normal_data[10:]
    anomaly_test_data = np.vstack([normal_data[5:10], anomalies])
    
    time_series = np.sin(np.linspace(0, 20, 100)) + np.random.randn(100) * 0.1
    ts_train = time_series[:80]
    ts_test = time_series[70:]
    
    results = {}
    
    # Test DBSCAN
    results['DBSCAN'] = test_algorithm_save_load(
        "DBSCAN Anomaly Detector",
        lambda: DBSCANAnomalyDetector(model_id="test_dbscan", eps=1.0, min_samples=3),
        anomaly_train_data,
        anomaly_test_data
    )
    
    # Test One-Class SVM
    results['One-Class SVM'] = test_algorithm_save_load(
        "One-Class SVM Anomaly Detector",
        lambda: OneClassSVMAnomalyDetector(model_id="test_svm", nu=0.1),
        anomaly_train_data,
        anomaly_test_data
    )
    
    # Test ARIMA
    results['ARIMA'] = test_algorithm_save_load(
        "ARIMA Forecaster",
        lambda: ARIMAForecaster(model_id="test_arima", horizon=10),
        ts_train,
        ts_test
    )
    
    # Test XGBoost
    results['XGBoost'] = test_algorithm_save_load(
        "XGBoost Forecaster",
        lambda: XGBoostForecaster(model_id="test_xgboost", horizon=10, n_lags=5, n_estimators=50),
        ts_train,
        ts_test
    )
    
    # Summary
    print("\n" + "="*80)
    print("SUMMARY OF ALL TESTS")
    print("="*80)
    
    for name, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{name}: {status}")
    
    all_passed = all(results.values())
    if all_passed:
        print("\n" + "="*80)
        print("✓ ALL 4 ALGORITHMS ARE PRODUCTION-READY!")
        print("="*80 + "\n")
    else:
        print("\n" + "="*80)
        print("✗ SOME TESTS FAILED - REVIEW REQUIRED")
        print("="*80 + "\n")
    
    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
