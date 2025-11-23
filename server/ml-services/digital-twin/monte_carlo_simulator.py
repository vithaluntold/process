"""
Monte Carlo Simulation for Digital Twin
Probabilistic simulation with risk quantification and confidence intervals
"""

import numpy as np
from typing import List, Dict, Any, Callable
from concurrent.futures import ProcessPoolExecutor, as_completed


class MonteCarloSimulator:
    """
    Monte Carlo simulation for process digital twin
    Runs thousands of simulations to understand outcome distributions
    """
    
    def __init__(self, n_runs: int = 1000):
        """
        Initialize Monte Carlo Simulator
        
        Args:
            n_runs: Number of simulation runs
        """
        self.n_runs = n_runs
        self.results = None
        
    def run_simulation(
        self,
        simulation_func: Callable,
        param_distributions: Dict[str, Dict[str, Any]],
        parallel: bool = True
    ) -> Dict[str, Any]:
        """
        Run Monte Carlo simulation
        
        Args:
            simulation_func: Simulation function to run
            param_distributions: Parameter distributions (mean, std, type)
            parallel: Use parallel processing
            
        Returns:
            Statistical results
        """
        results = []
        
        if parallel and self.n_runs >= 100:
            # Parallel execution
            with ProcessPoolExecutor() as executor:
                futures = []
                for _ in range(self.n_runs):
                    sampled_params = self._sample_parameters(param_distributions)
                    futures.append(executor.submit(simulation_func, **sampled_params))
                
                for future in as_completed(futures):
                    try:
                        results.append(future.result())
                    except Exception as e:
                        pass  # Skip failed runs
        else:
            # Sequential execution
            for _ in range(self.n_runs):
                sampled_params = self._sample_parameters(param_distributions)
                try:
                    result = simulation_func(**sampled_params)
                    results.append(result)
                except Exception as e:
                    pass  # Skip failed runs
        
        self.results = results
        return self._analyze_results(results)
    
    def _sample_parameters(self, param_distributions: Dict[str, Dict[str, Any]]) -> Dict[str, float]:
        """Sample parameters from distributions"""
        sampled = {}
        
        for param_name, dist_config in param_distributions.items():
            dist_type = dist_config.get('type', 'normal')
            
            if dist_type == 'normal':
                mean = dist_config.get('mean', 0)
                std = dist_config.get('std', 1)
                sampled[param_name] = float(np.random.normal(mean, std))
                
            elif dist_type == 'uniform':
                low = dist_config.get('low', 0)
                high = dist_config.get('high', 1)
                sampled[param_name] = float(np.random.uniform(low, high))
                
            elif dist_type == 'poisson':
                lam = dist_config.get('lambda', 1)
                sampled[param_name] = float(np.random.poisson(lam))
                
            elif dist_type == 'beta':
                alpha = dist_config.get('alpha', 2)
                beta = dist_config.get('beta', 2)
                sampled[param_name] = float(np.random.beta(alpha, beta))
                
            else:
                # Default to normal
                sampled[param_name] = float(np.random.normal(1, 0.1))
        
        return sampled
    
    def _analyze_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze simulation results"""
        if not results:
            return {'error': 'No successful simulation runs'}
        
        # Extract metrics
        metrics = {}
        for key in results[0].keys():
            values = [r.get(key, 0) for r in results if key in r]
            if values:
                metrics[key] = {
                    'mean': float(np.mean(values)),
                    'median': float(np.median(values)),
                    'std': float(np.std(values)),
                    'min': float(np.min(values)),
                    'max': float(np.max(values)),
                    'p5': float(np.percentile(values, 5)),
                    'p25': float(np.percentile(values, 25)),
                    'p75': float(np.percentile(values, 75)),
                    'p95': float(np.percentile(values, 95)),
                    'confidence_interval_95': {
                        'lower': float(np.percentile(values, 2.5)),
                        'upper': float(np.percentile(values, 97.5))
                    }
                }
        
        return {
            'runs_completed': len(results),
            'runs_requested': self.n_runs,
            'success_rate': len(results) / self.n_runs,
            'metrics': metrics
        }
    
    def calculate_risk_metrics(self, threshold: float, metric_name: str = 'cycle_time') -> Dict[str, Any]:
        """
        Calculate risk metrics
        
        Args:
            threshold: SLA threshold
            metric_name: Metric to analyze
            
        Returns:
            Risk analysis
        """
        if not self.results:
            return {'error': 'No simulation results available'}
        
        values = [r.get(metric_name, 0) for r in self.results if metric_name in r]
        
        if not values:
            return {'error': f'Metric {metric_name} not found in results'}
        
        violations = [v for v in values if v > threshold]
        
        return {
            'threshold': threshold,
            'probability_of_violation': len(violations) / len(values),
            'expected_value': float(np.mean(values)),
            'worst_case_p95': float(np.percentile(values, 95)),
            'best_case_p5': float(np.percentile(values, 5)),
            'value_at_risk_95': float(np.percentile(values, 95) - np.percentile(values, 50)),
            'expected_shortfall': float(np.mean([v for v in values if v > np.percentile(values, 95)])) if any(v > np.percentile(values, 95) for v in values) else 0
        }


def run_monte_carlo_process_simulation(
    process_model: Dict[str, Any],
    scenario_params: Dict[str, Any],
    n_runs: int = 1000,
    sla_threshold: float = None
) -> Dict[str, Any]:
    """
    Run Monte Carlo simulation for process
    
    Args:
        process_model: Process model definition
        scenario_params: Scenario parameter distributions
        n_runs: Number of Monte Carlo runs
        sla_threshold: SLA threshold for risk analysis
        
    Returns:
        Comprehensive statistical analysis
    """
    def simulate_single_run(**params):
        """Single simulation run"""
        # Extract parameters
        duration = params.get('duration', 100)
        resource_count = params.get('resource_count', 5)
        arrival_rate = params.get('arrival_rate', 10)
        
        # Simple process simulation
        cycle_time = duration / resource_count + np.random.exponential(10)
        throughput = arrival_rate * resource_count / duration
        cost = resource_count * 100 + duration * 10
        quality = max(0.85, min(0.99, 0.95 - (resource_count - 5) * 0.02))
        
        return {
            'cycle_time': cycle_time,
            'throughput': throughput,
            'cost': cost,
            'quality': quality,
            'resource_utilization': min(0.95, arrival_rate / (resource_count * 10))
        }
    
    # Define parameter distributions
    param_distributions = {
        'duration': {
            'type': 'normal',
            'mean': scenario_params.get('duration_mean', 100),
            'std': scenario_params.get('duration_std', 10)
        },
        'resource_count': {
            'type': 'poisson',
            'lambda': scenario_params.get('resource_lambda', 5)
        },
        'arrival_rate': {
            'type': 'poisson',
            'lambda': scenario_params.get('arrival_lambda', 10)
        }
    }
    
    # Run Monte Carlo simulation
    simulator = MonteCarloSimulator(n_runs=n_runs)
    results = simulator.run_simulation(
        simulate_single_run,
        param_distributions,
        parallel=False  # Set to True for production
    )
    
    # Calculate risk metrics if threshold provided
    risk_analysis = None
    if sla_threshold:
        risk_analysis = simulator.calculate_risk_metrics(sla_threshold, 'cycle_time')
    
    return {
        'simulation_type': 'Monte_Carlo',
        'runs': n_runs,
        'statistical_analysis': results,
        'risk_analysis': risk_analysis,
        'interpretation': {
            'confidence': '95%',
            'variability': 'Accounts for parameter uncertainty',
            'use_case': 'Risk quantification and worst/best case analysis'
        }
    }


class SensitivityAnalyzer:
    """Sensitivity analysis for process parameters"""
    
    def analyze_parameter_impact(
        self,
        simulation_func: Callable,
        base_params: Dict[str, float],
        vary_param: str,
        vary_range: List[float]
    ) -> Dict[str, Any]:
        """
        Analyze impact of varying a single parameter
        
        Args:
            simulation_func: Simulation function
            base_params: Base parameter values
            vary_param: Parameter to vary
            vary_range: Range of values to test
            
        Returns:
            Sensitivity analysis results
        """
        results = []
        
        for value in vary_range:
            params = base_params.copy()
            params[vary_param] = value
            
            try:
                result = simulation_func(**params)
                result['parameter_value'] = value
                results.append(result)
            except:
                pass
        
        return {
            'parameter': vary_param,
            'range_tested': vary_range,
            'results': results,
            'sensitivity': self._calculate_sensitivity(results)
        }
    
    def _calculate_sensitivity(self, results: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate sensitivity metrics"""
        if len(results) < 2:
            return {}
        
        param_values = [r['parameter_value'] for r in results]
        
        sensitivity = {}
        for key in results[0].keys():
            if key != 'parameter_value':
                metric_values = [r.get(key, 0) for r in results]
                
                # Calculate elasticity (% change in metric / % change in parameter)
                if len(param_values) >= 2 and param_values[0] != 0:
                    param_change_pct = (param_values[-1] - param_values[0]) / param_values[0]
                    metric_change_pct = (metric_values[-1] - metric_values[0]) / (metric_values[0] + 1e-10)
                    
                    elasticity = metric_change_pct / (param_change_pct + 1e-10)
                    sensitivity[key] = float(elasticity)
        
        return sensitivity
