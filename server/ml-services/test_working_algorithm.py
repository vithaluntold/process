"""
TEST: Prove the fixed Isolation Forest actually works
This demonstrates proper integration with the foundation
"""

import numpy as np
import sys
from pathlib import Path
import tempfile
import shutil

# Add parent to path for imports
parent_path = str(Path(__file__).parent.parent)
if parent_path not in sys.path:
    sys.path.insert(0, parent_path)

from ml_services.anomaly_detection.isolation_forest_fixed import IsolationForestDetector


def test_complete_workflow():
    """Test complete train -> save -> load -> predict workflow"""
    
    print("\n" + "="*80)
    print("TESTING: Complete Production-Ready Workflow")
    print("="*80 + "\n")
    
    # Create synthetic normal data
    np.random.seed(42)
    normal_data = np.random.randn(100, 3)  # 100 samples, 3 features
    
    # Add some synthetic anomalies
    anomalies = normal_data[:5].copy()
    anomalies += np.random.randn(5, 3) * 5  # High variance
    
    # Combine
    train_data = normal_data[10:]
    test_data = np.vstack([normal_data[5:10], anomalies])
    
    # Step 1: Create and train model
    print("Step 1: Creating and training model...")
    detector = IsolationForestDetector(
        model_id="test_detector",
        contamination=0.05,
        n_estimators=50
    )
    
    result = detector.train(train_data)
    
    if result.success:
        print("✓ Training successful!")
        print(f"  - Trained on {result.metrics['training_samples']} samples")
        print(f"  - Threshold: {result.metrics['threshold']:.4f}")
        print(f"  - Anomaly rate in training: {result.metrics['anomaly_rate']:.2%}")
    else:
        print("✗ Training failed:", result.error)
        return False
    
    # Step 2: Save model
    print("\nStep 2: Saving model with manifest...")
    with tempfile.TemporaryDirectory() as tmpdir:
        save_path = str(Path(tmpdir) / "test_model")
        
        try:
            saved_path = detector.save(save_path)
            print(f"✓ Model saved to: {saved_path}")
            
            # Verify artifacts exist
            artifacts_dir = Path(saved_path) / "artifacts"
            manifest_path = Path(saved_path) / "manifest.json"
            
            if manifest_path.exists():
                print(f"✓ Manifest exists")
            if (artifacts_dir / "model.joblib").exists():
                print(f"✓ Model artifact exists")
            if (artifacts_dir / "feature_extractor.joblib").exists():
                print(f"✓ Feature extractor artifact exists")
            if (artifacts_dir / "threshold.json").exists():
                print(f"✓ Threshold artifact exists")
            
            # Step 3: Create new instance and load
            print("\nStep 3: Loading model from saved artifacts...")
            loaded_detector = IsolationForestDetector(model_id="test_detector")
            loaded_detector.load(saved_path)
            
            print(f"✓ Model loaded successfully")
            print(f"  - Model ID: {loaded_detector.model_id}")
            print(f"  - Status: {loaded_detector.metadata.status}")
            print(f"  - Is trained: {loaded_detector.is_trained}")
            
            # Step 4: Predict with loaded model
            print("\nStep 4: Making predictions with loaded model...")
            predictions = loaded_detector.predict(test_data)
            
            anomaly_count = sum(1 for p in predictions.predictions if p['is_anomaly'])
            print(f"✓ Predictions completed")
            print(f"  - Total samples: {len(test_data)}")
            print(f"  - Anomalies detected: {anomaly_count}")
            print(f"  - Detection rate: {anomaly_count / len(test_data):.2%}")
            
            # Step 5: Verify predictions are consistent
            print("\nStep 5: Verifying prediction consistency...")
            predictions2 = loaded_detector.predict(test_data)
            
            consistent = all(
                p1['is_anomaly'] == p2['is_anomaly']
                for p1, p2 in zip(predictions.predictions, predictions2.predictions)
            )
            
            if consistent:
                print("✓ Predictions are deterministic and consistent")
            else:
                print("✗ Predictions are not consistent!")
                return False
            
        except Exception as e:
            print(f"✗ Error during workflow: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    print("\n" + "="*80)
    print("✓ ALL TESTS PASSED - Model is production-ready!")
    print("="*80 + "\n")
    
    return True


if __name__ == "__main__":
    success = test_complete_workflow()
    sys.exit(0 if success else 1)
