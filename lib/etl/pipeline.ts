import type { NormalizedEvent } from '@/lib/connectors/types';

export type TransformOperation = 
  | 'map'
  | 'filter'
  | 'aggregate'
  | 'join'
  | 'sort'
  | 'deduplicate'
  | 'enrich'
  | 'validate'
  | 'split'
  | 'merge';

export interface TransformStep {
  id: string;
  operation: TransformOperation;
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface PipelineConfig {
  id: string;
  name: string;
  description?: string;
  steps: TransformStep[];
  errorHandling: 'skip' | 'fail' | 'retry';
  batchSize: number;
  parallelism: number;
}

export interface PipelineResult {
  success: boolean;
  inputCount: number;
  outputCount: number;
  errorCount: number;
  errors: { step: string; error: string; record?: unknown }[];
  metrics: {
    startTime: Date;
    endTime: Date;
    durationMs: number;
    throughput: number;
  };
}

export interface PipelineContext {
  pipelineId: string;
  runId: string;
  organizationId: number;
  variables: Record<string, unknown>;
  logger: {
    debug: (msg: string, data?: Record<string, unknown>) => void;
    info: (msg: string, data?: Record<string, unknown>) => void;
    warn: (msg: string, data?: Record<string, unknown>) => void;
    error: (msg: string, data?: Record<string, unknown>) => void;
  };
}

export class ETLPipeline {
  private config: PipelineConfig;
  private transformers: Map<TransformOperation, TransformFunction>;

  constructor(config: PipelineConfig) {
    this.config = config;
    this.transformers = this.initializeTransformers();
  }

  private initializeTransformers(): Map<TransformOperation, TransformFunction> {
    const transformers = new Map<TransformOperation, TransformFunction>();
    
    transformers.set('map', this.mapTransform.bind(this));
    transformers.set('filter', this.filterTransform.bind(this));
    transformers.set('aggregate', this.aggregateTransform.bind(this));
    transformers.set('join', this.joinTransform.bind(this));
    transformers.set('sort', this.sortTransform.bind(this));
    transformers.set('deduplicate', this.deduplicateTransform.bind(this));
    transformers.set('enrich', this.enrichTransform.bind(this));
    transformers.set('validate', this.validateTransform.bind(this));
    transformers.set('split', this.splitTransform.bind(this));
    transformers.set('merge', this.mergeTransform.bind(this));
    
    return transformers;
  }

  async execute(
    records: NormalizedEvent[],
    context: PipelineContext
  ): Promise<PipelineResult> {
    const startTime = new Date();
    const errors: PipelineResult['errors'] = [];
    let currentRecords = [...records];

    context.logger.info('Starting ETL pipeline', {
      pipelineId: this.config.id,
      inputCount: records.length,
      steps: this.config.steps.length,
    });

    for (const step of this.config.steps) {
      if (!step.enabled) {
        context.logger.debug('Skipping disabled step', { stepId: step.id });
        continue;
      }

      try {
        const transformer = this.transformers.get(step.operation);
        if (!transformer) {
          throw new Error(`Unknown transform operation: ${step.operation}`);
        }

        const result = await this.processStep(
          step,
          transformer,
          currentRecords,
          context
        );

        currentRecords = result.records;
        errors.push(...result.errors);

        context.logger.debug('Step completed', {
          stepId: step.id,
          operation: step.operation,
          inputCount: result.inputCount,
          outputCount: result.records.length,
          errorCount: result.errors.length,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        context.logger.error('Step failed', {
          stepId: step.id,
          error: errorMsg,
        });

        if (this.config.errorHandling === 'fail') {
          const endTime = new Date();
          return {
            success: false,
            inputCount: records.length,
            outputCount: 0,
            errorCount: 1,
            errors: [{ step: step.id, error: errorMsg }],
            metrics: {
              startTime,
              endTime,
              durationMs: endTime.getTime() - startTime.getTime(),
              throughput: 0,
            },
          };
        }

        errors.push({ step: step.id, error: errorMsg });
      }
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    return {
      success: errors.length === 0,
      inputCount: records.length,
      outputCount: currentRecords.length,
      errorCount: errors.length,
      errors,
      metrics: {
        startTime,
        endTime,
        durationMs,
        throughput: durationMs > 0 ? (records.length / durationMs) * 1000 : 0,
      },
    };
  }

  private async processStep(
    step: TransformStep,
    transformer: TransformFunction,
    records: NormalizedEvent[],
    context: PipelineContext
  ): Promise<{ records: NormalizedEvent[]; inputCount: number; errors: PipelineResult['errors'] }> {
    const errors: PipelineResult['errors'] = [];
    const outputRecords: NormalizedEvent[] = [];
    const inputCount = records.length;

    const batches = this.createBatches(records, this.config.batchSize);

    for (const batch of batches) {
      try {
        const result = await transformer(batch, step.config, context);
        outputRecords.push(...result);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        if (this.config.errorHandling === 'skip') {
          errors.push({ step: step.id, error: errorMsg, record: batch[0] });
        } else if (this.config.errorHandling === 'retry') {
          try {
            const result = await transformer(batch, step.config, context);
            outputRecords.push(...result);
          } catch (retryError) {
            errors.push({
              step: step.id,
              error: retryError instanceof Error ? retryError.message : 'Retry failed',
              record: batch[0],
            });
          }
        } else {
          throw error;
        }
      }
    }

    return { records: outputRecords, inputCount, errors };
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async mapTransform(
    records: NormalizedEvent[],
    config: Record<string, unknown>,
    context: PipelineContext
  ): Promise<NormalizedEvent[]> {
    const mappings = config.mappings as Record<string, string>;
    const expression = config.expression as string | undefined;

    return records.map(record => {
      const mapped = { ...record };

      if (mappings) {
        for (const [target, source] of Object.entries(mappings)) {
          const value = this.getNestedValue(record.additionalData || {}, source);
          if (value !== undefined) {
            if (!mapped.additionalData) mapped.additionalData = {};
            mapped.additionalData[target] = value;
          }
        }
      }

      if (expression) {
        try {
          const fn = new Function('record', `return ${expression}`);
          const result = fn(record);
          if (typeof result === 'object') {
            Object.assign(mapped.additionalData || {}, result);
          }
        } catch {
        }
      }

      return mapped;
    });
  }

  private async filterTransform(
    records: NormalizedEvent[],
    config: Record<string, unknown>,
    context: PipelineContext
  ): Promise<NormalizedEvent[]> {
    const conditions = config.conditions as { field: string; operator: string; value: unknown }[];
    const expression = config.expression as string | undefined;

    return records.filter(record => {
      if (conditions) {
        for (const condition of conditions) {
          const fieldValue = this.getFieldValue(record, condition.field);
          if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
            return false;
          }
        }
      }

      if (expression) {
        try {
          const fn = new Function('record', `return ${expression}`);
          return fn(record);
        } catch {
          return true;
        }
      }

      return true;
    });
  }

  private async aggregateTransform(
    records: NormalizedEvent[],
    config: Record<string, unknown>,
    context: PipelineContext
  ): Promise<NormalizedEvent[]> {
    const groupBy = config.groupBy as string[];
    const aggregations = config.aggregations as { field: string; function: 'count' | 'sum' | 'avg' | 'min' | 'max'; as: string }[];

    const groups = new Map<string, NormalizedEvent[]>();

    for (const record of records) {
      const key = groupBy.map(field => String(this.getFieldValue(record, field))).join('|');
      const group = groups.get(key) || [];
      group.push(record);
      groups.set(key, group);
    }

    return Array.from(groups.entries()).map(([key, groupRecords]) => {
      const baseRecord = groupRecords[0];
      const aggregatedData: Record<string, unknown> = {};

      for (const agg of aggregations) {
        const values = groupRecords
          .map(r => this.getFieldValue(r, agg.field))
          .filter(v => v !== undefined && v !== null)
          .map(v => Number(v));

        switch (agg.function) {
          case 'count':
            aggregatedData[agg.as] = groupRecords.length;
            break;
          case 'sum':
            aggregatedData[agg.as] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            aggregatedData[agg.as] = values.length > 0
              ? values.reduce((a, b) => a + b, 0) / values.length
              : 0;
            break;
          case 'min':
            aggregatedData[agg.as] = values.length > 0 ? Math.min(...values) : null;
            break;
          case 'max':
            aggregatedData[agg.as] = values.length > 0 ? Math.max(...values) : null;
            break;
        }
      }

      return {
        ...baseRecord,
        additionalData: {
          ...baseRecord.additionalData,
          ...aggregatedData,
          _groupKey: key,
          _groupCount: groupRecords.length,
        },
      };
    });
  }

  private async joinTransform(
    records: NormalizedEvent[],
    config: Record<string, unknown>,
    context: PipelineContext
  ): Promise<NormalizedEvent[]> {
    const lookupData = config.lookupData as Record<string, unknown>[];
    const joinKey = config.joinKey as string;
    const lookupKey = config.lookupKey as string;
    const joinType = (config.joinType as 'inner' | 'left' | 'outer') || 'left';
    const selectFields = config.selectFields as string[] | undefined;

    const lookupMap = new Map<string, Record<string, unknown>>();
    for (const item of lookupData) {
      const key = String(item[lookupKey]);
      lookupMap.set(key, item);
    }

    const result: NormalizedEvent[] = [];

    for (const record of records) {
      const key = String(this.getFieldValue(record, joinKey));
      const lookupRecord = lookupMap.get(key);

      if (lookupRecord) {
        const enrichedData = selectFields
          ? Object.fromEntries(selectFields.map(f => [f, lookupRecord[f]]))
          : lookupRecord;

        result.push({
          ...record,
          additionalData: {
            ...record.additionalData,
            ...enrichedData,
          },
        });
      } else if (joinType === 'left' || joinType === 'outer') {
        result.push(record);
      }
    }

    return result;
  }

  private async sortTransform(
    records: NormalizedEvent[],
    config: Record<string, unknown>,
    context: PipelineContext
  ): Promise<NormalizedEvent[]> {
    const sortBy = config.sortBy as { field: string; order: 'asc' | 'desc' }[];

    return [...records].sort((a, b) => {
      for (const sort of sortBy) {
        const aValue = this.getFieldValue(a, sort.field);
        const bValue = this.getFieldValue(b, sort.field);

        let comparison = 0;
        const aStr = String(aValue ?? '');
        const bStr = String(bValue ?? '');
        if (aStr < bStr) comparison = -1;
        else if (aStr > bStr) comparison = 1;

        if (comparison !== 0) {
          return sort.order === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  private async deduplicateTransform(
    records: NormalizedEvent[],
    config: Record<string, unknown>,
    context: PipelineContext
  ): Promise<NormalizedEvent[]> {
    const keyFields = config.keyFields as string[];
    const keepFirst = (config.keepFirst as boolean) !== false;

    const seen = new Map<string, NormalizedEvent>();

    for (const record of records) {
      const key = keyFields.map(field => String(this.getFieldValue(record, field))).join('|');

      if (!seen.has(key)) {
        seen.set(key, record);
      } else if (!keepFirst) {
        seen.set(key, record);
      }
    }

    return Array.from(seen.values());
  }

  private async enrichTransform(
    records: NormalizedEvent[],
    config: Record<string, unknown>,
    context: PipelineContext
  ): Promise<NormalizedEvent[]> {
    const enrichments = config.enrichments as { field: string; value: unknown; type: 'static' | 'variable' | 'computed' }[];

    return records.map(record => {
      const enrichedData: Record<string, unknown> = {};

      for (const enrichment of enrichments) {
        switch (enrichment.type) {
          case 'static':
            enrichedData[enrichment.field] = enrichment.value;
            break;
          case 'variable':
            enrichedData[enrichment.field] = context.variables[enrichment.value as string];
            break;
          case 'computed':
            try {
              const fn = new Function('record', 'context', `return ${enrichment.value}`);
              enrichedData[enrichment.field] = fn(record, context);
            } catch {
              enrichedData[enrichment.field] = null;
            }
            break;
        }
      }

      return {
        ...record,
        additionalData: {
          ...record.additionalData,
          ...enrichedData,
        },
      };
    });
  }

  private async validateTransform(
    records: NormalizedEvent[],
    config: Record<string, unknown>,
    context: PipelineContext
  ): Promise<NormalizedEvent[]> {
    const rules = config.rules as { field: string; rule: 'required' | 'type' | 'range' | 'regex'; params?: unknown }[];
    const onInvalid = (config.onInvalid as 'skip' | 'flag' | 'fail') || 'flag';

    return records.filter(record => {
      let isValid = true;
      const validationErrors: string[] = [];

      for (const rule of rules) {
        const value = this.getFieldValue(record, rule.field);
        let ruleValid = true;

        switch (rule.rule) {
          case 'required':
            ruleValid = value !== undefined && value !== null && value !== '';
            break;
          case 'type':
            ruleValid = typeof value === rule.params;
            break;
          case 'range':
            const { min, max } = rule.params as { min?: number; max?: number };
            const numValue = Number(value);
            ruleValid = (!min || numValue >= min) && (!max || numValue <= max);
            break;
          case 'regex':
            ruleValid = new RegExp(rule.params as string).test(String(value));
            break;
        }

        if (!ruleValid) {
          isValid = false;
          validationErrors.push(`${rule.field}: failed ${rule.rule}`);
        }
      }

      if (!isValid) {
        if (onInvalid === 'skip') {
          return false;
        } else if (onInvalid === 'flag') {
          record.additionalData = {
            ...record.additionalData,
            _validationErrors: validationErrors,
            _isValid: false,
          };
        } else if (onInvalid === 'fail') {
          throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }
      }

      return true;
    });
  }

  private async splitTransform(
    records: NormalizedEvent[],
    config: Record<string, unknown>,
    context: PipelineContext
  ): Promise<NormalizedEvent[]> {
    const splitField = config.splitField as string;
    const delimiter = (config.delimiter as string) || ',';

    const result: NormalizedEvent[] = [];

    for (const record of records) {
      const value = this.getFieldValue(record, splitField);

      if (typeof value === 'string') {
        const parts = value.split(delimiter);
        for (const part of parts) {
          result.push({
            ...record,
            additionalData: {
              ...record.additionalData,
              [splitField]: part.trim(),
              _splitIndex: parts.indexOf(part),
              _splitTotal: parts.length,
            },
          });
        }
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          result.push({
            ...record,
            additionalData: {
              ...record.additionalData,
              [splitField]: value[i],
              _splitIndex: i,
              _splitTotal: value.length,
            },
          });
        }
      } else {
        result.push(record);
      }
    }

    return result;
  }

  private async mergeTransform(
    records: NormalizedEvent[],
    config: Record<string, unknown>,
    context: PipelineContext
  ): Promise<NormalizedEvent[]> {
    const mergeKey = config.mergeKey as string;
    const mergeFields = config.mergeFields as string[];
    const separator = (config.separator as string) || ', ';

    const groups = new Map<string, NormalizedEvent[]>();

    for (const record of records) {
      const key = String(this.getFieldValue(record, mergeKey));
      const group = groups.get(key) || [];
      group.push(record);
      groups.set(key, group);
    }

    return Array.from(groups.entries()).map(([key, groupRecords]) => {
      const baseRecord = groupRecords[0];
      const mergedData: Record<string, unknown> = {};

      for (const field of mergeFields) {
        const values = groupRecords
          .map(r => this.getFieldValue(r, field))
          .filter(v => v !== undefined && v !== null);

        mergedData[field] = values.join(separator);
      }

      return {
        ...baseRecord,
        additionalData: {
          ...baseRecord.additionalData,
          ...mergedData,
          _mergeCount: groupRecords.length,
        },
      };
    });
  }

  private getFieldValue(record: NormalizedEvent, field: string): unknown {
    if (field in record) {
      return record[field as keyof NormalizedEvent];
    }
    return this.getNestedValue(record.additionalData || {}, field);
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  private evaluateCondition(value: unknown, operator: string, compareValue: unknown): boolean {
    switch (operator) {
      case 'eq':
      case '=':
      case '==':
        return value === compareValue;
      case 'ne':
      case '!=':
      case '<>':
        return value !== compareValue;
      case 'gt':
      case '>':
        return Number(value) > Number(compareValue);
      case 'gte':
      case '>=':
        return Number(value) >= Number(compareValue);
      case 'lt':
      case '<':
        return Number(value) < Number(compareValue);
      case 'lte':
      case '<=':
        return Number(value) <= Number(compareValue);
      case 'contains':
        return String(value).includes(String(compareValue));
      case 'startsWith':
        return String(value).startsWith(String(compareValue));
      case 'endsWith':
        return String(value).endsWith(String(compareValue));
      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(value);
      case 'notIn':
        return Array.isArray(compareValue) && !compareValue.includes(value);
      case 'isNull':
        return value === null || value === undefined;
      case 'isNotNull':
        return value !== null && value !== undefined;
      case 'regex':
        return new RegExp(String(compareValue)).test(String(value));
      default:
        return true;
    }
  }
}

type TransformFunction = (
  records: NormalizedEvent[],
  config: Record<string, unknown>,
  context: PipelineContext
) => Promise<NormalizedEvent[]>;

export function createPipeline(config: PipelineConfig): ETLPipeline {
  return new ETLPipeline(config);
}

export const defaultPipelineConfig: Partial<PipelineConfig> = {
  errorHandling: 'skip',
  batchSize: 1000,
  parallelism: 4,
};
