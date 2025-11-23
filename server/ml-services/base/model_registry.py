"""
Model Registry for version management and model lifecycle
Tracks all trained models, versions, and performance metrics
"""

from typing import Dict, List, Optional, Any
from pathlib import Path
import json
from datetime import datetime
from .ml_model_base import ModelMetadata


class ModelRegistry:
    """
    Central registry for all ML models
    Handles versioning, deployment, and A/B testing
    """
    
    def __init__(self, registry_path: str = "models/registry.json"):
        self.registry_path = Path(registry_path)
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)
        self.registry = self._load_registry()
    
    def _load_registry(self) -> Dict[str, Any]:
        """Load registry from disk"""
        if self.registry_path.exists():
            with open(self.registry_path, 'r') as f:
                return json.load(f)
        return {'models': {}, 'deployments': {}, 'experiments': {}}
    
    def _save_registry(self) -> None:
        """Save registry to disk"""
        with open(self.registry_path, 'w') as f:
            json.dump(self.registry, f, indent=2, default=str)
    
    def register_model(
        self,
        model_id: str,
        model_type: str,
        version: str,
        metadata: ModelMetadata,
        model_path: str
    ) -> None:
        """Register a trained model"""
        if model_type not in self.registry['models']:
            self.registry['models'][model_type] = {}
        
        if model_id not in self.registry['models'][model_type]:
            self.registry['models'][model_type][model_id] = {'versions': []}
        
        version_info = {
            'version': version,
            'model_path': model_path,
            'created_at': datetime.now().isoformat(),
            'trained_at': metadata.trained_at.isoformat() if metadata.trained_at else None,
            'performance_metrics': metadata.performance_metrics,
            'hyperparameters': metadata.hyperparameters,
            'training_samples': metadata.training_samples,
            'status': metadata.status
        }
        
        self.registry['models'][model_type][model_id]['versions'].append(version_info)
        self._save_registry()
    
    def get_model_info(self, model_type: str, model_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a model"""
        if model_type in self.registry['models']:
            return self.registry['models'][model_type].get(model_id)
        return None
    
    def get_latest_version(self, model_type: str, model_id: str) -> Optional[Dict[str, Any]]:
        """Get latest version of a model"""
        model_info = self.get_model_info(model_type, model_id)
        if model_info and model_info['versions']:
            return model_info['versions'][-1]
        return None
    
    def list_models(self, model_type: Optional[str] = None) -> Dict[str, Any]:
        """List all models, optionally filtered by type"""
        if model_type:
            return {model_type: self.registry['models'].get(model_type, {})}
        return self.registry['models']
    
    def deploy_model(
        self,
        model_type: str,
        model_id: str,
        version: str,
        deployment_name: str = 'production'
    ) -> bool:
        """Deploy a specific model version"""
        model_info = self.get_model_info(model_type, model_id)
        if not model_info:
            return False
        
        # Find version
        version_info = None
        for v in model_info['versions']:
            if v['version'] == version:
                version_info = v
                break
        
        if not version_info:
            return False
        
        # Deploy
        if deployment_name not in self.registry['deployments']:
            self.registry['deployments'][deployment_name] = {}
        
        self.registry['deployments'][deployment_name][model_type] = {
            'model_id': model_id,
            'version': version,
            'deployed_at': datetime.now().isoformat(),
            'model_path': version_info['model_path']
        }
        
        self._save_registry()
        return True
    
    def get_deployed_model(
        self,
        model_type: str,
        deployment_name: str = 'production'
    ) -> Optional[Dict[str, Any]]:
        """Get currently deployed model for a type"""
        if deployment_name in self.registry['deployments']:
            return self.registry['deployments'][deployment_name].get(model_type)
        return None
    
    def create_experiment(
        self,
        experiment_name: str,
        model_type: str,
        variants: List[Dict[str, str]]  # [{'model_id': 'x', 'version': 'y'}, ...]
    ) -> str:
        """Create A/B test experiment"""
        experiment_id = f"{experiment_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        self.registry['experiments'][experiment_id] = {
            'name': experiment_name,
            'model_type': model_type,
            'variants': variants,
            'created_at': datetime.now().isoformat(),
            'status': 'active',
            'results': []
        }
        
        self._save_registry()
        return experiment_id
    
    def record_experiment_result(
        self,
        experiment_id: str,
        variant_id: str,
        metric_name: str,
        metric_value: float
    ) -> None:
        """Record experiment result"""
        if experiment_id in self.registry['experiments']:
            self.registry['experiments'][experiment_id]['results'].append({
                'variant_id': variant_id,
                'metric_name': metric_name,
                'metric_value': metric_value,
                'timestamp': datetime.now().isoformat()
            })
            self._save_registry()
    
    def get_experiment_results(self, experiment_id: str) -> Optional[Dict[str, Any]]:
        """Get experiment results"""
        return self.registry['experiments'].get(experiment_id)


# Global registry instance
_registry = None

def get_registry() -> ModelRegistry:
    """Get global model registry instance"""
    global _registry
    if _registry is None:
        _registry = ModelRegistry()
    return _registry
