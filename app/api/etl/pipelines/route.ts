import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { z } from 'zod';
import { createPipeline, type PipelineConfig, type PipelineContext, defaultPipelineConfig } from '@/lib/etl/pipeline';
import type { NormalizedEvent } from '@/lib/connectors/types';

const transformStepSchema = z.object({
  id: z.string(),
  operation: z.enum(['map', 'filter', 'aggregate', 'join', 'sort', 'deduplicate', 'enrich', 'validate', 'split', 'merge']),
  config: z.record(z.unknown()),
  enabled: z.boolean().default(true),
});

const pipelineConfigSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  steps: z.array(transformStepSchema),
  errorHandling: z.enum(['skip', 'fail', 'retry']).default('skip'),
  batchSize: z.number().min(1).max(10000).default(1000),
  parallelism: z.number().min(1).max(16).default(4),
});

const runPipelineSchema = z.object({
  pipeline: pipelineConfigSchema,
  data: z.array(z.object({
    sourceId: z.string(),
    sourceObject: z.string(),
    caseId: z.string(),
    activity: z.string(),
    timestamp: z.string(),
    resource: z.string().optional(),
    additionalData: z.record(z.unknown()).optional(),
  })),
  variables: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = runPipelineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { pipeline: pipelineConfig, data, variables } = parsed.data;

    const normalizedData: NormalizedEvent[] = data.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));

    const context: PipelineContext = {
      pipelineId: pipelineConfig.id,
      runId: crypto.randomUUID(),
      organizationId: user.organizationId,
      variables: variables || {},
      logger: {
        debug: (msg, data) => console.debug(`[ETL:${pipelineConfig.id}] ${msg}`, data),
        info: (msg, data) => console.info(`[ETL:${pipelineConfig.id}] ${msg}`, data),
        warn: (msg, data) => console.warn(`[ETL:${pipelineConfig.id}] ${msg}`, data),
        error: (msg, data) => console.error(`[ETL:${pipelineConfig.id}] ${msg}`, data),
      },
    };

    const pipeline = createPipeline({
      ...defaultPipelineConfig,
      ...pipelineConfig,
    } as PipelineConfig);

    const result = await pipeline.execute(normalizedData, context);

    return NextResponse.json({
      success: result.success,
      metrics: {
        inputCount: result.inputCount,
        outputCount: result.outputCount,
        errorCount: result.errorCount,
        durationMs: result.metrics.durationMs,
        throughput: result.metrics.throughput,
      },
      errors: result.errors.slice(0, 10),
    });
  } catch (error) {
    console.error('ETL pipeline error:', error);
    return NextResponse.json(
      { error: 'Pipeline execution failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      availableOperations: [
        {
          id: 'map',
          name: 'Map',
          description: 'Transform fields using mappings or expressions',
          configSchema: {
            mappings: 'Record<string, string> - Maps target field to source field path',
            expression: 'string - JavaScript expression that returns transformed data',
          },
        },
        {
          id: 'filter',
          name: 'Filter',
          description: 'Filter records based on conditions',
          configSchema: {
            conditions: 'Array<{field, operator, value}> - Filter conditions to apply',
            expression: 'string - JavaScript expression that returns boolean',
          },
        },
        {
          id: 'aggregate',
          name: 'Aggregate',
          description: 'Group and aggregate records',
          configSchema: {
            groupBy: 'string[] - Fields to group by',
            aggregations: 'Array<{field, function, as}> - Aggregation definitions (count, sum, avg, min, max)',
          },
        },
        {
          id: 'join',
          name: 'Join',
          description: 'Join records with lookup data',
          configSchema: {
            lookupData: 'Record<string, unknown>[] - Data to join with',
            joinKey: 'string - Field in records to match',
            lookupKey: 'string - Field in lookup data to match',
            joinType: '"inner" | "left" | "outer" - Join type',
            selectFields: 'string[] - Fields to select from lookup',
          },
        },
        {
          id: 'sort',
          name: 'Sort',
          description: 'Sort records by fields',
          configSchema: {
            sortBy: 'Array<{field, order}> - Sort definitions',
          },
        },
        {
          id: 'deduplicate',
          name: 'Deduplicate',
          description: 'Remove duplicate records',
          configSchema: {
            keyFields: 'string[] - Fields to use for deduplication',
            keepFirst: 'boolean - Keep first or last occurrence',
          },
        },
        {
          id: 'enrich',
          name: 'Enrich',
          description: 'Add fields to records',
          configSchema: {
            enrichments: 'Array<{field, value, type}> - Enrichment definitions (static, variable, computed)',
          },
        },
        {
          id: 'validate',
          name: 'Validate',
          description: 'Validate records against rules',
          configSchema: {
            rules: 'Array<{field, rule, params}> - Validation rules (required, type, range, regex)',
            onInvalid: '"skip" | "flag" | "fail" - Action for invalid records',
          },
        },
        {
          id: 'split',
          name: 'Split',
          description: 'Split records into multiple records',
          configSchema: {
            splitField: 'string - Field containing value to split',
            delimiter: 'string - Delimiter for splitting strings',
          },
        },
        {
          id: 'merge',
          name: 'Merge',
          description: 'Merge multiple records into one',
          configSchema: {
            mergeKey: 'string - Field to group records by',
            mergeFields: 'string[] - Fields to concatenate',
            separator: 'string - Separator for merged values',
          },
        },
      ],
      defaultConfig: defaultPipelineConfig,
    });
  } catch (error) {
    console.error('Error fetching ETL operations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ETL operations' },
      { status: 500 }
    );
  }
}
