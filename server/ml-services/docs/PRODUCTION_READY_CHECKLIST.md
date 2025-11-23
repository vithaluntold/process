# Production-Ready ML Algorithm Checklist

This checklist ensures all ML algorithms follow the validated production-ready pattern established by LSTM Autoencoder.

## ✅ REQUIRED COMPONENTS

### 1. **Preprocessing** 
- [ ] Use `StandardScaler` for time series/numerical data (NOT FeatureExtractor)
- [ ] Import: `from base.preprocessing import StandardScaler`
- [ ] Attribute: `self.scaler: Optional[StandardScaler] = None`
- [ ] Fit in train(): `self.scaler = StandardScaler(); scaled_data = self.scaler.fit_transform(data)`
- [ ] Transform in predict(): `scaled_data = self.scaler.transform(data)`

### 2. **Lifecycle Hooks**
- [ ] All hooks use fresh `LifecycleContext` with timestamp
- [ ] `before_train(context)` - Called at start of train()
- [ ] `after_train(context)` - Called after successful training
- [ ] `before_predict(context)` - Called at start of predict()
- [ ] `after_predict(context)` - Called after successful prediction
- [ ] `before_save(context)` - Called at start of save()
- [ ] `after_save(context)` - Called after successful save

### 3. **Artifact Persistence**
- [ ] Use `ArtifactStore.save()` and `ArtifactStore.load()` for ALL artifacts
- [ ] Explicit artifact names:
  - Model: `name='model'`
  - Scaler: `name='scaler'` (filename: `scaler.joblib`)
  - Threshold/params: `name='threshold'` or appropriate name
- [ ] ArtifactStore types:
  - TensorFlow models: `'tensorflow'` (saves as `.keras`)
  - sklearn models: `'joblib'` (saves as `.joblib`)
  - Parameters: `'json'` (saves as `.json`)

### 4. **Manifest Validation**
- [ ] Call `ManifestValidator.validate(manifest_data)` in `load()` before processing
- [ ] Check manifest exists and is valid format
- [ ] Verify artifact specs match expected structure

### 5. **Artifact Verification (load method)**
```python
# After loading all artifacts:
if self.model is None:
    raise PersistenceError("Failed to load model artifact")
if self.scaler is None:
    raise PersistenceError("Failed to load scaler artifact")
if self.threshold is None:
    raise PersistenceError("Failed to load threshold artifact")

# ONLY set is_trained=True AFTER all artifacts verified
self.is_trained = True
```

### 6. **Input Validation**
- [ ] Check data shape in train() and predict()
- [ ] For sequence models: validate `len(data) >= sequence_length`
- [ ] Raise clear `PredictionError` or `TrainingError` with helpful messages

### 7. **Error Handling**
```python
# In predict():
if len(data) < self.sequence_length:
    from base.ml_model_base import PredictionError
    raise PredictionError(
        f"Insufficient data: need at least {self.sequence_length} samples, got {len(data)}. "
        f"Provide more historical data."
    )
```

### 8. **Metadata Updates**
- [ ] `self.metadata.status = 'training'` at start of train()
- [ ] `self.metadata.status = 'trained'` after successful train()
- [ ] `self.metadata.training_samples = len(data)` or similar
- [ ] `self.metadata.artifacts = [model_spec, scaler_spec, threshold_spec]`
- [ ] `self.metadata.trained_at = datetime.now().isoformat()`

## 📝 SAVE METHOD TEMPLATE

```python
def save(self, save_dir: str) -> str:
    """Save model with all artifacts"""
    save_dir = Path(save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)
    artifact_dir = save_dir / "artifacts"
    artifact_dir.mkdir(parents=True, exist_ok=True)
    
    # Lifecycle hook
    from datetime import datetime
    context = LifecycleContext(
        model_id=self.model_id,
        model_type=self.model_type,
        operation='save',
        timestamp=datetime.now()
    )
    self.before_save(context)
    
    # Save model
    model_path = artifact_dir / "model.keras"  # or .joblib
    model_spec = ArtifactStore.save(
        self.model, model_path, 'tensorflow', name='model'  # or 'joblib'
    )
    
    # Save scaler
    scaler_path = artifact_dir / "scaler.joblib"
    scaler_spec = ArtifactStore.save(
        self.scaler, scaler_path, 'joblib', name='scaler'
    )
    
    # Save threshold/params
    threshold_path = artifact_dir / "threshold.json"
    threshold_spec = ArtifactStore.save(
        {'threshold': self.threshold}, threshold_path, 'json', name='threshold'
    )
    
    # Update metadata
    self.metadata.artifacts = [model_spec, scaler_spec, threshold_spec]
    self.metadata.trained_at = datetime.now().isoformat()
    
    # Save manifest
    manifest_path = save_dir / "manifest.json"
    with open(manifest_path, 'w') as f:
        json.dump(asdict(self.metadata), f, indent=2, default=str)
    
    self.after_save(context)
    return str(save_dir)
```

## 📥 LOAD METHOD TEMPLATE

```python
def load(self, load_dir: str):
    """Load model with all artifacts"""
    load_dir = Path(load_dir)
    manifest_path = load_dir / "manifest.json"
    
    if not manifest_path.exists():
        raise PersistenceError(f"Manifest not found: {manifest_path}")
    
    with open(manifest_path, 'r') as f:
        manifest_data = json.load(f)
    
    # CRITICAL: Validate manifest before processing
    ManifestValidator.validate(manifest_data)
    
    self.metadata = ModelMetadata(**manifest_data)
    artifact_dir = load_dir / "artifacts"
    
    # Load artifacts
    for artifact_spec in self.metadata.artifacts:
        artifact_path = artifact_dir / artifact_spec.filename
        if artifact_spec.name == 'model':
            self.model = ArtifactStore.load(artifact_path, artifact_spec.artifact_type)
        elif artifact_spec.name == 'scaler':
            self.scaler = ArtifactStore.load(artifact_path, artifact_spec.artifact_type)
        elif artifact_spec.name == 'threshold':
            threshold_data = ArtifactStore.load(artifact_path, artifact_spec.artifact_type)
            self.threshold = threshold_data['threshold']
    
    # CRITICAL: Verify all artifacts loaded before setting is_trained
    if self.model is None:
        raise PersistenceError("Failed to load model artifact")
    if self.scaler is None:
        raise PersistenceError("Failed to load scaler artifact")
    if self.threshold is None:
        raise PersistenceError("Failed to load threshold artifact")
    
    # Only set after verification
    self.is_trained = True
```

## 🧪 REGRESSION TEST TEMPLATE

Every algorithm MUST have a regression test proving train→save→load→predict works:

```python
def test_algorithm_train_save_load_predict():
    # 1. Generate test data
    # 2. Train model
    # 3. Make predictions before save
    # 4. Save model
    # 5. Load into new instance
    # 6. Make predictions after load
    # 7. Verify predictions match (within tolerance)
```

## ✅ VALIDATION CRITERIA

An algorithm is production-ready when:
1. ✅ Regression test passes
2. ✅ All 8 checklist items above are satisfied
3. ✅ Architect approves the implementation
4. ✅ No hallucinated features or mock data
5. ✅ Clear error messages for all failure modes

## 📊 STATUS TRACKING

| Algorithm | Status | Regression Test | Architect Approved |
|-----------|--------|----------------|-------------------|
| LSTM-AE | ✅ Complete | ✅ Passing | ✅ Yes |
| DBSCAN | ✅ Complete | ⏳ Pending | ⏳ Pending |
| One-Class SVM | ✅ Complete | ⏳ Pending | ⏳ Pending |
| ARIMA | ✅ Complete | ⏳ Pending | ⏳ Pending |
| XGBoost | ✅ Complete | ⏳ Pending | ⏳ Pending |
| VAE | ⏳ In Progress | ❌ Not Started | ❌ No |
| LSTM Forecasting | ⏳ In Progress | ❌ Not Started | ❌ No |
| GRU Forecasting | ⏳ In Progress | ❌ Not Started | ❌ No |
| Prophet | ⏳ In Progress | ❌ Not Started | ❌ No |
| ARIMA-LSTM Hybrid | ⏳ In Progress | ❌ Not Started | ❌ No |
| Isolation Forest | ⏳ In Progress | ❌ Not Started | ❌ No |
