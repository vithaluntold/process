"""
Production-Ready ML Model Base with Versioned Lifecycle Management
- Artifact/metadata separation
- Manifest validation with checksums
- Typed error hierarchy
- Lifecycle hooks
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union, Callable
from dataclasses import dataclass, asdict, field
from datetime import datetime
from enum import Enum
from pathlib import Path
import json
import pickle
import hashlib
import joblib


class ModelErrorCode(Enum):
    """Standardized error codes"""
    TRAINING_FAILED = "TRAINING_FAILED"
    PREDICTION_FAILED = "PREDICTION_FAILED"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    PERSISTENCE_ERROR = "PERSISTENCE_ERROR"
    LIFECYCLE_ERROR = "LIFECYCLE_ERROR"
    INCOMPATIBLE_VERSION = "INCOMPATIBLE_VERSION"
    MISSING_ARTIFACT = "MISSING_ARTIFACT"
    CHECKSUM_MISMATCH = "CHECKSUM_MISMATCH"


class ModelError(Exception):
    """Base exception for all model errors"""
    def __init__(self, message: str, code: ModelErrorCode, context: Optional[Dict] = None):
        self.message = message
        self.code = code
        self.context = context or {}
        super().__init__(f"[{code.value}] {message}")


class TrainingError(ModelError):
    """Errors during training"""
    def __init__(self, message: str, context: Optional[Dict] = None):
        super().__init__(message, ModelErrorCode.TRAINING_FAILED, context)


class PredictionError(ModelError):
    """Errors during prediction"""
    def __init__(self, message: str, context: Optional[Dict] = None):
        super().__init__(message, ModelErrorCode.PREDICTION_FAILED, context)


class ValidationError(ModelError):
    """Errors during validation"""
    def __init__(self, message: str, context: Optional[Dict] = None):
        super().__init__(message, ModelErrorCode.VALIDATION_ERROR, context)


class PersistenceError(ModelError):
    """Errors during save/load"""
    def __init__(self, message: str, code: ModelErrorCode = ModelErrorCode.PERSISTENCE_ERROR, context: Optional[Dict] = None):
        super().__init__(message, code, context)


class LifecycleError(ModelError):
    """Errors during lifecycle transitions"""
    def __init__(self, message: str, context: Optional[Dict] = None):
        super().__init__(message, ModelErrorCode.LIFECYCLE_ERROR, context)


@dataclass
class ArtifactSpec:
    """Specification for a model artifact"""
    name: str
    filename: str
    checksum: str
    size_bytes: int
    artifact_type: str  # 'pickle', 'joblib', 'json', 'weights'


@dataclass
class ModelManifest:
    """Versioned manifest for model persistence"""
    schema_version: str = "1.0.0"
    model_id: str = ""
    model_type: str = ""
    version: str = "1.0.0"
    created_at: str = ""
    trained_at: Optional[str] = None
    hyperparameters: Dict[str, Any] = field(default_factory=dict)
    performance_metrics: Dict[str, float] = field(default_factory=dict)
    training_samples: int = 0
    status: str = "initialized"
    artifacts: List[ArtifactSpec] = field(default_factory=list)
    dependencies: Dict[str, str] = field(default_factory=dict)
    input_schema_version: str = "1.0.0"


class ManifestValidator:
    """Validates model manifests"""
    
    REQUIRED_FIELDS = {'schema_version', 'model_id', 'model_type', 'version', 'status'}
    SUPPORTED_SCHEMA_VERSIONS = {'1.0.0'}
    
    @classmethod
    def validate(cls, manifest: ModelManifest, artifact_dir: Path) -> None:
        """
        Validate manifest completeness and artifact integrity
        
        Raises:
            ValidationError: If validation fails
        """
        # Check required fields
        manifest_dict = asdict(manifest)
        missing_fields = cls.REQUIRED_FIELDS - set(manifest_dict.keys())
        if missing_fields:
            raise ValidationError(
                f"Missing required fields: {missing_fields}",
                context={'manifest': manifest_dict}
            )
        
        # Check schema version
        if manifest.schema_version not in cls.SUPPORTED_SCHEMA_VERSIONS:
            raise PersistenceError(
                f"Unsupported schema version: {manifest.schema_version}",
                code=ModelErrorCode.INCOMPATIBLE_VERSION,
                context={'supported': list(cls.SUPPORTED_SCHEMA_VERSIONS)}
            )
        
        # Validate artifacts exist and checksums match
        for artifact_spec in manifest.artifacts:
            artifact_path = artifact_dir / artifact_spec.filename
            
            if not artifact_path.exists():
                raise PersistenceError(
                    f"Missing artifact: {artifact_spec.filename}",
                    code=ModelErrorCode.MISSING_ARTIFACT,
                    context={'artifact': artifact_spec.name}
                )
            
            # Verify checksum
            actual_checksum = cls._calculate_checksum(artifact_path)
            if actual_checksum != artifact_spec.checksum:
                raise PersistenceError(
                    f"Checksum mismatch for {artifact_spec.filename}",
                    code=ModelErrorCode.CHECKSUM_MISMATCH,
                    context={
                        'expected': artifact_spec.checksum,
                        'actual': actual_checksum
                    }
                )
    
    @staticmethod
    def _calculate_checksum(file_path: Path) -> str:
        """Calculate SHA256 checksum of file"""
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                sha256.update(chunk)
        return sha256.hexdigest()


@dataclass
class LifecycleContext:
    """Immutable context passed to lifecycle hooks"""
    model_id: str
    model_type: str
    operation: str
    timestamp: datetime
    data: Optional[Dict[str, Any]] = None


@dataclass
class TrainingResult:
    """Standardized training result"""
    success: bool
    metrics: Dict[str, float]
    metadata: ModelManifest
    error: Optional[ModelError] = None


@dataclass
class PredictionResult:
    """Standardized prediction result"""
    predictions: Union[List[Any], Dict[str, Any]]
    confidence: Optional[Dict[str, float]] = None
    metadata: Optional[Dict[str, Any]] = None


class ArtifactStore:
    """Manages artifact persistence"""
    
    @staticmethod
    def save(obj: Any, path: Path, artifact_type: str = 'joblib', *, name: Optional[str] = None) -> ArtifactSpec:
        """
        Save artifact and return spec with checksum
        
        Args:
            obj: Object to save
            path: Save path
            artifact_type: 'joblib', 'pickle', or 'json'
            name: Optional explicit artifact name (defaults to path.stem)
        
        Returns:
            ArtifactSpec with checksum
        """
        path.parent.mkdir(parents=True, exist_ok=True)
        
        if artifact_type == 'joblib':
            joblib.dump(obj, path)
        elif artifact_type == 'pickle':
            with open(path, 'wb') as f:
                pickle.dump(obj, f)
        elif artifact_type == 'json':
            with open(path, 'w') as f:
                json.dump(obj, f, default=str)
        else:
            raise ValueError(f"Unsupported artifact type: {artifact_type}")
        
        # Calculate checksum
        checksum = ManifestValidator._calculate_checksum(path)
        size = path.stat().st_size
        
        return ArtifactSpec(
            name=name or path.stem,  # Use explicit name if provided, else path.stem
            filename=path.name,
            checksum=checksum,
            size_bytes=size,
            artifact_type=artifact_type
        )
    
    @staticmethod
    def load(path: Path, artifact_type: str = 'joblib') -> Any:
        """Load artifact"""
        if artifact_type == 'joblib':
            return joblib.load(path)
        elif artifact_type == 'pickle':
            with open(path, 'rb') as f:
                return pickle.load(f)
        elif artifact_type == 'json':
            with open(path, 'r') as f:
                return json.load(f)
        else:
            raise ValueError(f"Unsupported artifact type: {artifact_type}")


class MLModelBase(ABC):
    """
    Production-ready base class for all ML models
    - Versioned manifest with artifact/metadata separation
    - Lifecycle hooks for extensibility
    - Typed error handling
    """
    
    def __init__(self, model_id: str, model_type: str, version: str = "1.0.0"):
        self.model_id = model_id
        self.model_type = model_type
        self.version = version
        
        # Initialize manifest
        self.metadata = ModelManifest(
            model_id=model_id,
            model_type=model_type,
            version=version,
            created_at=datetime.now().isoformat(),
            status='initialized'
        )
        
        self.model = None
        self.is_trained = False
        
        # Model directory structure: models/{type}/{id}/{version}/
        self.model_dir = Path(f"models/{model_type}/{model_id}/{version}")
        self.artifact_dir = self.model_dir / "artifacts"
        
    # Lifecycle hooks (subclasses can override)
    def before_train(self, context: LifecycleContext) -> None:
        """Called before training starts"""
        pass
    
    def after_train(self, context: LifecycleContext) -> None:
        """Called after training completes"""
        pass
    
    def before_predict(self, context: LifecycleContext) -> None:
        """Called before prediction"""
        pass
    
    def after_predict(self, context: LifecycleContext) -> None:
        """Called after prediction"""
        pass
    
    def before_save(self, context: LifecycleContext) -> None:
        """Called before saving"""
        pass
    
    def after_load(self, context: LifecycleContext) -> None:
        """Called after loading"""
        pass
    
    def on_rollback(self, context: LifecycleContext) -> None:
        """Called during rollback"""
        pass
    
    @abstractmethod
    def train(self, data: Any, **kwargs) -> TrainingResult:
        """Train the model"""
        pass
    
    @abstractmethod
    def predict(self, data: Any, **kwargs) -> PredictionResult:
        """Make predictions"""
        pass
    
    @abstractmethod
    def evaluate(self, data: Any, labels: Any, **kwargs) -> Dict[str, float]:
        """Evaluate model performance"""
        pass
    
    def save(self, path: Optional[str] = None) -> str:
        """
        Save model with manifest validation
        
        Returns:
            Path to saved model directory
        """
        if not self.is_trained:
            raise PersistenceError("Cannot save untrained model")
        
        # Lifecycle hook
        context = LifecycleContext(
            model_id=self.model_id,
            model_type=self.model_type,
            operation='save',
            timestamp=datetime.now()
        )
        self.before_save(context)
        
        try:
            save_dir = Path(path) if path else self.model_dir
            artifact_dir = save_dir / "artifacts"
            artifact_dir.mkdir(parents=True, exist_ok=True)
            
            # Save model artifact
            model_path = artifact_dir / "model.joblib"
            artifact_spec = ArtifactStore.save(self.model, model_path, 'joblib')
            
            # Update manifest
            self.metadata.artifacts = [artifact_spec]
            self.metadata.trained_at = datetime.now().isoformat()
            
            # Save manifest
            manifest_path = save_dir / "manifest.json"
            with open(manifest_path, 'w') as f:
                json.dump(asdict(self.metadata), f, indent=2, default=str)
            
            return str(save_dir)
            
        except Exception as e:
            raise PersistenceError(f"Failed to save model: {str(e)}", context={'error': str(e)})
    
    def load(self, path: str) -> None:
        """
        Load model with manifest validation
        
        Args:
            path: Path to model directory
        """
        try:
            load_dir = Path(path)
            manifest_path = load_dir / "manifest.json"
            artifact_dir = load_dir / "artifacts"
            
            # Load manifest
            with open(manifest_path, 'r') as f:
                manifest_dict = json.load(f)
            
            # Convert to dataclass
            manifest_dict['artifacts'] = [
                ArtifactSpec(**a) for a in manifest_dict.get('artifacts', [])
            ]
            self.metadata = ModelManifest(**manifest_dict)
            
            # Validate manifest
            ManifestValidator.validate(self.metadata, artifact_dir)
            
            # Load artifacts
            for artifact_spec in self.metadata.artifacts:
                artifact_path = artifact_dir / artifact_spec.filename
                if artifact_spec.name == 'model':
                    self.model = ArtifactStore.load(artifact_path, artifact_spec.artifact_type)
            
            self.is_trained = True
            self.version = self.metadata.version
            
            # Lifecycle hook
            context = LifecycleContext(
                model_id=self.model_id,
                model_type=self.model_type,
                operation='load',
                timestamp=datetime.now()
            )
            self.after_load(context)
            
        except Exception as e:
            if isinstance(e, ModelError):
                raise
            raise PersistenceError(f"Failed to load model: {str(e)}", context={'path': path, 'error': str(e)})
    
    def get_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            'model_id': self.model_id,
            'model_type': self.model_type,
            'version': self.version,
            'is_trained': self.is_trained,
            'status': self.metadata.status,
            'created_at': self.metadata.created_at,
            'trained_at': self.metadata.trained_at,
            'training_samples': self.metadata.training_samples,
            'hyperparameters': self.metadata.hyperparameters,
            'performance_metrics': self.metadata.performance_metrics
        }


class AnomalyDetectorBase(MLModelBase):
    """Base class for anomaly detection models"""
    
    def __init__(self, model_id: str, model_type: str, contamination: float = 0.05):
        super().__init__(model_id, f"anomaly_{model_type}")
        self.contamination = contamination
        self.threshold = None
        self.metadata.hyperparameters['contamination'] = contamination
    
    @abstractmethod
    def detect_anomalies(self, data: Any) -> List[Dict[str, Any]]:
        """Detect and return anomalous records"""
        pass


class ForecasterBase(MLModelBase):
    """Base class for forecasting models"""
    
    def __init__(self, model_id: str, model_type: str, horizon: int = 30):
        super().__init__(model_id, f"forecaster_{model_type}")
        self.horizon = horizon
        self.metadata.hyperparameters['horizon'] = horizon
    
    @abstractmethod
    def forecast(self, historical_data: Any, horizon: Optional[int] = None) -> Dict[str, Any]:
        """Generate forecast"""
        pass
