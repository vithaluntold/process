/**
 * TypeScript Client for Python ML Services API
 * Bridges the Next.js application with Python ML algorithms
 */

interface EventLog {
  case_id: string;
  activity: string;
  timestamp: string;
  resource?: string;
  duration?: number;
}

interface AnomalyDetectionRequest {
  events: EventLog[];
  algorithm?: 'isolation_forest' | 'statistical_zscore' | 'dbscan';
  contamination?: number;
}

interface AnomalyResult {
  index: number;
  case_id: string;
  activity: string;
  timestamp: string;
  anomaly_score?: number;
  z_score?: number;
  cluster?: number;
  severity: string;
}

interface AnomalyDetectionResponse {
  success: boolean;
  algorithm: string;
  total_events: number;
  anomalies_detected: number;
  anomaly_rate: number;
  anomalies: AnomalyResult[];
  model_metrics: Record<string, any>;
}

interface ForecastRequest {
  values: number[];
  timestamps?: string[];
  horizon?: number;
  algorithm?: 'holt_winters' | 'linear_regression' | 'moving_average';
}

interface ForecastPoint {
  step: number;
  value: number;
  lower: number;
  upper: number;
}

interface ForecastResponse {
  success: boolean;
  algorithm: string;
  forecast: ForecastPoint[];
  metrics: Record<string, any>;
  confidence_intervals: Record<string, any>;
}

interface SimulationRequest {
  process_model: Record<string, any>;
  parameters: Record<string, any>;
  num_simulations?: number;
  algorithm?: 'monte_carlo' | 'parameter_based';
}

interface SimulationResponse {
  success: boolean;
  algorithm: string;
  num_simulations: number;
  results: Record<string, any>;
  statistics: Record<string, any>;
}

interface HealthResponse {
  status: string;
  algorithms_available: Record<string, string[]>;
  version: string;
}

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

class MLClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = ML_API_URL, timeout: number = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('ML API request timed out');
      }
      throw error;
    }
  }

  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }

  async detectAnomalies(request: AnomalyDetectionRequest): Promise<AnomalyDetectionResponse> {
    return this.request<AnomalyDetectionResponse>('/anomaly-detection', {
      method: 'POST',
      body: JSON.stringify({
        events: request.events,
        algorithm: request.algorithm || 'isolation_forest',
        contamination: request.contamination || 0.05,
      }),
    });
  }

  async generateForecast(request: ForecastRequest): Promise<ForecastResponse> {
    return this.request<ForecastResponse>('/forecast', {
      method: 'POST',
      body: JSON.stringify({
        values: request.values,
        timestamps: request.timestamps,
        horizon: request.horizon || 30,
        algorithm: request.algorithm || 'holt_winters',
      }),
    });
  }

  async runSimulation(request: SimulationRequest): Promise<SimulationResponse> {
    return this.request<SimulationResponse>('/simulation', {
      method: 'POST',
      body: JSON.stringify({
        process_model: request.process_model,
        parameters: request.parameters,
        num_simulations: request.num_simulations || 1000,
        algorithm: request.algorithm || 'monte_carlo',
      }),
    });
  }
}

let mlClientInstance: MLClient | null = null;

export function getMLClient(): MLClient {
  if (!mlClientInstance) {
    mlClientInstance = new MLClient();
  }
  return mlClientInstance;
}

export async function detectAnomaliesWithML(
  events: Array<{
    caseId: string;
    activity: string;
    timestamp: Date | string;
    resource?: string;
  }>,
  options: {
    algorithm?: 'isolation_forest' | 'statistical_zscore' | 'dbscan';
    contamination?: number;
  } = {}
): Promise<AnomalyDetectionResponse | null> {
  const client = getMLClient();
  
  try {
    const isAvailable = await client.isAvailable();
    if (!isAvailable) {
      console.warn('ML API not available, falling back to statistical methods');
      return null;
    }

    const formattedEvents: EventLog[] = events.map(e => ({
      case_id: e.caseId,
      activity: e.activity,
      timestamp: typeof e.timestamp === 'string' ? e.timestamp : e.timestamp.toISOString(),
      resource: e.resource,
    }));

    return await client.detectAnomalies({
      events: formattedEvents,
      algorithm: options.algorithm,
      contamination: options.contamination,
    });
  } catch (error) {
    console.error('ML anomaly detection failed:', error);
    return null;
  }
}

export async function generateForecastWithML(
  values: number[],
  options: {
    timestamps?: string[];
    horizon?: number;
    algorithm?: 'holt_winters' | 'linear_regression' | 'moving_average';
  } = {}
): Promise<ForecastResponse | null> {
  const client = getMLClient();
  
  try {
    const isAvailable = await client.isAvailable();
    if (!isAvailable) {
      console.warn('ML API not available, falling back to basic methods');
      return null;
    }

    return await client.generateForecast({
      values,
      timestamps: options.timestamps,
      horizon: options.horizon,
      algorithm: options.algorithm,
    });
  } catch (error) {
    console.error('ML forecasting failed:', error);
    return null;
  }
}

export async function runSimulationWithML(
  processModel: Record<string, any>,
  parameters: Record<string, any>,
  options: {
    numSimulations?: number;
    algorithm?: 'monte_carlo' | 'parameter_based';
  } = {}
): Promise<SimulationResponse | null> {
  const client = getMLClient();
  
  try {
    const isAvailable = await client.isAvailable();
    if (!isAvailable) {
      console.warn('ML API not available');
      return null;
    }

    return await client.runSimulation({
      process_model: processModel,
      parameters,
      num_simulations: options.numSimulations,
      algorithm: options.algorithm,
    });
  } catch (error) {
    console.error('ML simulation failed:', error);
    return null;
  }
}

export type {
  EventLog,
  AnomalyDetectionRequest,
  AnomalyDetectionResponse,
  AnomalyResult,
  ForecastRequest,
  ForecastResponse,
  ForecastPoint,
  SimulationRequest,
  SimulationResponse,
  HealthResponse,
};

export { MLClient };
