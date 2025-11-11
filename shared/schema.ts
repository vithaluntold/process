import { pgTable, text, serial, timestamp, integer, real, boolean, jsonb, primaryKey, varchar, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const processes = pgTable("processes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  source: text("source").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("processes_user_id_idx").on(table.userId),
  userIdCreatedAtIdx: index("processes_user_id_created_at_idx").on(table.userId, table.createdAt),
}));

export const eventLogs = pgTable("event_logs", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  caseId: text("case_id").notNull(),
  activity: text("activity").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  resource: text("resource"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  processIdTimestampIdx: index("event_logs_process_id_timestamp_idx").on(table.processId, table.timestamp),
}));

export const processModels = pgTable("process_models", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  name: text("name").notNull(),
  modelData: jsonb("model_data").notNull(),
  variants: integer("variants").notNull().default(0),
  activities: integer("activities").notNull().default(0),
  avgDuration: real("avg_duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  name: text("name").notNull(),
  frequency: integer("frequency").notNull().default(0),
  avgDuration: real("avg_duration"),
  automationPotential: real("automation_potential"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  period: text("period").notNull(),
  cycleTime: real("cycle_time"),
  throughput: integer("throughput"),
  reworkRate: real("rework_rate"),
  conformanceRate: real("conformance_rate"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  processIdIdx: index("performance_metrics_process_id_idx").on(table.processId),
}));

export const deviations = pgTable("deviations", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  frequency: integer("frequency").notNull().default(0),
  impact: text("impact").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const automationOpportunities = pgTable("automation_opportunities", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  taskName: text("task_name").notNull(),
  frequency: integer("frequency").notNull(),
  duration: real("duration").notNull(),
  automationPotential: real("automation_potential").notNull(),
  savingsEstimate: real("savings_estimate"),
  recommendedSolution: text("recommended_solution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  processIdIdx: index("automation_opportunities_process_id_idx").on(table.processId),
}));

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  size: text("size").notNull(),
  path: text("path").notNull(),
  status: text("status").notNull().default("uploaded"),
  extractedProcesses: integer("extracted_processes").default(0),
  activities: integer("activities").default(0),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
});

export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("disconnected"),
  config: jsonb("config"),
  lastSync: timestamp("last_sync"),
  recordCount: integer("record_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const discoveredModels = pgTable("discovered_models", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  algorithm: text("algorithm").notNull(),
  version: integer("version").notNull().default(1),
  modelData: jsonb("model_data").notNull(),
  activities: jsonb("activities").notNull(),
  transitions: jsonb("transitions").notNull(),
  startActivities: jsonb("start_activities").notNull(),
  endActivities: jsonb("end_activities").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  recommendations: jsonb("recommendations"),
  impact: text("impact"),
  confidence: real("confidence"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conformanceResults = pgTable("conformance_results", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  modelId: integer("model_id").references(() => discoveredModels.id),
  caseId: text("case_id").notNull(),
  conformant: boolean("conformant").notNull(),
  deviationType: text("deviation_type"),
  deviationDetails: jsonb("deviation_details"),
  fitness: real("fitness"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const simulationScenarios = pgTable("simulation_scenarios", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  parameters: jsonb("parameters").notNull(),
  results: jsonb("results"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const kpiMetrics = pgTable("kpi_metrics", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  metricType: text("metric_type").notNull(),
  value: real("value").notNull(),
  unit: text("unit"),
  calculationMethod: text("calculation_method"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const processesRelations = relations(processes, ({ many, one }) => ({
  eventLogs: many(eventLogs),
  processModels: many(processModels),
  activities: many(activities),
  performanceMetrics: many(performanceMetrics),
  deviations: many(deviations),
  automationOpportunities: many(automationOpportunities),
  user: one(users, {
    fields: [processes.userId],
    references: [users.id],
  }),
}));

export const eventLogsRelations = relations(eventLogs, ({ one }) => ({
  process: one(processes, {
    fields: [eventLogs.processId],
    references: [processes.id],
  }),
}));

export const processModelsRelations = relations(processModels, ({ one }) => ({
  process: one(processes, {
    fields: [processModels.processId],
    references: [processes.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  process: one(processes, {
    fields: [activities.processId],
    references: [processes.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  process: one(processes, {
    fields: [performanceMetrics.processId],
    references: [processes.id],
  }),
}));

export const deviationsRelations = relations(deviations, ({ one }) => ({
  process: one(processes, {
    fields: [deviations.processId],
    references: [processes.id],
  }),
}));

export const automationOpportunitiesRelations = relations(automationOpportunities, ({ one }) => ({
  process: one(processes, {
    fields: [automationOpportunities.processId],
    references: [processes.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const userConsents = pgTable("user_consents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  consentType: text("consent_type").notNull(),
  accepted: boolean("accepted").notNull().default(false),
  acceptedAt: timestamp("accepted_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userConsentsRelations = relations(userConsents, ({ one }) => ({
  user: one(users, {
    fields: [userConsents.userId],
    references: [users.id],
  }),
}));

export const taskSessions = pgTable("task_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionName: text("session_name"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  deviceType: text("device_type"),
  osType: text("os_type"),
  status: text("status").notNull().default("active"),
  totalActivities: integer("total_activities").default(0),
  automationPotential: real("automation_potential"),
  privacyConsent: boolean("privacy_consent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => taskSessions.id).notNull(),
  activityType: text("activity_type").notNull(),
  application: text("application"),
  windowTitle: text("window_title"),
  action: text("action").notNull(),
  targetElement: text("target_element"),
  inputData: text("input_data"),
  timestamp: timestamp("timestamp").notNull(),
  duration: integer("duration"),
  screenshot: text("screenshot"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index("user_activities_session_idx").on(table.sessionId),
  timestampIdx: index("user_activities_timestamp_idx").on(table.timestamp),
}));

export const applicationUsage = pgTable("application_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: integer("session_id").references(() => taskSessions.id),
  applicationName: text("application_name").notNull(),
  category: text("category"),
  timeSpent: integer("time_spent").notNull(),
  interactions: integer("interactions").notNull().default(0),
  productivityScore: real("productivity_score"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index("app_usage_user_date_idx").on(table.userId, table.date),
}));

export const taskPatterns = pgTable("task_patterns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  patternName: text("pattern_name").notNull(),
  description: text("description"),
  frequency: integer("frequency").notNull().default(1),
  avgDuration: real("avg_duration"),
  steps: jsonb("steps").notNull(),
  automationPotential: real("automation_potential").notNull(),
  timeSavingsEstimate: real("time_savings_estimate"),
  lastOccurrence: timestamp("last_occurrence"),
  status: text("status").notNull().default("identified"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const taskAutomations = pgTable("task_automations", {
  id: serial("id").primaryKey(),
  patternId: integer("pattern_id").references(() => taskPatterns.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  automationType: text("automation_type").notNull(),
  script: text("script"),
  configuration: jsonb("configuration"),
  estimatedSavings: real("estimated_savings"),
  status: text("status").notNull().default("recommended"),
  implementedAt: timestamp("implemented_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const taskSessionsRelations = relations(taskSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [taskSessions.userId],
    references: [users.id],
  }),
  activities: many(userActivities),
  applicationUsage: many(applicationUsage),
}));

export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  session: one(taskSessions, {
    fields: [userActivities.sessionId],
    references: [taskSessions.id],
  }),
}));

export const applicationUsageRelations = relations(applicationUsage, ({ one }) => ({
  user: one(users, {
    fields: [applicationUsage.userId],
    references: [users.id],
  }),
  session: one(taskSessions, {
    fields: [applicationUsage.sessionId],
    references: [taskSessions.id],
  }),
}));

export const taskPatternsRelations = relations(taskPatterns, ({ one, many }) => ({
  user: one(users, {
    fields: [taskPatterns.userId],
    references: [users.id],
  }),
  automations: many(taskAutomations),
}));

export const taskAutomationsRelations = relations(taskAutomations, ({ one }) => ({
  pattern: one(taskPatterns, {
    fields: [taskAutomations.patternId],
    references: [taskPatterns.id],
  }),
  user: one(users, {
    fields: [taskAutomations.userId],
    references: [users.id],
  }),
}));

// Real-Time Monitoring Tables
export const processInstances = pgTable("process_instances", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  caseId: text("case_id").notNull(),
  status: text("status").notNull().default("running"),
  currentActivity: text("current_activity"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  slaStatus: text("sla_status").default("on_track"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const processAlerts = pgTable("process_alerts", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("active"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const processHealthScores = pgTable("process_health_scores", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  healthScore: real("health_score").notNull(),
  performanceScore: real("performance_score").notNull(),
  complianceScore: real("compliance_score").notNull(),
  efficiencyScore: real("efficiency_score").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Advanced Reporting Tables
export const generatedReports = pgTable("generated_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  processId: integer("process_id").references(() => processes.id),
  title: text("title").notNull(),
  type: text("type").notNull(),
  format: text("format").notNull(),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  status: text("status").notNull().default("generating"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cost Analysis Tables
export const costMetrics = pgTable("cost_metrics", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  activityName: text("activity_name").notNull(),
  resourceCost: real("resource_cost").notNull(),
  timeCost: real("time_cost").notNull(),
  totalCost: real("total_cost").notNull(),
  currency: text("currency").notNull().default("USD"),
  frequency: integer("frequency").notNull(),
  costPerExecution: real("cost_per_execution").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roiCalculations = pgTable("roi_calculations", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  currentCost: real("current_cost").notNull(),
  optimizedCost: real("optimized_cost").notNull(),
  savings: real("savings").notNull(),
  savingsPercentage: real("savings_percentage").notNull(),
  timeToRoi: integer("time_to_roi"),
  implementationCost: real("implementation_cost"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Collaboration Tables
export const processComments = pgTable("process_comments", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  mentionedUsers: jsonb("mentioned_users"),
  attachments: jsonb("attachments"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Custom KPI Tables
export const customKpis = pgTable("custom_kpis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  processId: integer("process_id").references(() => processes.id),
  name: text("name").notNull(),
  description: text("description"),
  metric: text("metric").notNull(),
  calculation: text("calculation").notNull(),
  threshold: real("threshold"),
  currentValue: real("current_value"),
  unit: text("unit"),
  status: text("status").notNull().default("active"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kpiAlerts = pgTable("kpi_alerts", {
  id: serial("id").primaryKey(),
  kpiId: integer("kpi_id").references(() => customKpis.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("active"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
});

export const agentApiKeys = pgTable("agent_api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  keyPrefix: varchar("key_prefix", { length: 12 }).notNull(),
  hashedKey: text("hashed_key").notNull(),
  label: text("label"),
  status: text("status").notNull().default("active"),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("agent_api_keys_user_idx").on(table.userId),
  prefixIdx: index("agent_api_keys_prefix_idx").on(table.keyPrefix),
  statusIdx: index("agent_api_keys_status_idx").on(table.status),
}));

export const agentEncryptionKeys = pgTable("agent_encryption_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  encryptedAESKey: text("encrypted_aes_key").notNull(),
  algorithm: text("algorithm").notNull().default("aes-256-gcm"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userLlmSettings = pgTable("user_llm_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  defaultProvider: text("default_provider").notNull().default("replit"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const llmProviders = pgTable("llm_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  providerId: text("provider_id").notNull().unique(),
  description: text("description"),
  category: text("category").notNull().default("llm"),
  authType: text("auth_type").notNull().default("bearer"),
  baseUrl: text("base_url").notNull(),
  defaultHeaders: jsonb("default_headers"),
  compatibilityType: text("compatibility_type").notNull().default("openai_compatible"),
  isBuiltin: boolean("is_builtin").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  validationEndpoint: text("validation_endpoint"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  providerIdIdx: index("llm_providers_provider_id_idx").on(table.providerId),
  categoryIdx: index("llm_providers_category_idx").on(table.category),
}));

export const llmProviderModels = pgTable("llm_provider_models", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => llmProviders.id).notNull(),
  modelId: text("model_id").notNull(),
  displayName: text("display_name").notNull(),
  contextWindow: integer("context_window"),
  capabilities: jsonb("capabilities"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  providerModelIdx: index("llm_provider_models_provider_model_idx").on(table.providerId, table.modelId),
}));

export const llmProviderKeys = pgTable("llm_provider_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  provider: text("provider").notNull(),
  encryptedApiKey: text("encrypted_api_key").notNull(),
  label: text("label"),
  status: text("status").notNull().default("active"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userProviderIdx: index("llm_provider_keys_user_provider_idx").on(table.userId, table.provider),
}));

export const agentApiKeysRelations = relations(agentApiKeys, ({ one }) => ({
  user: one(users, {
    fields: [agentApiKeys.userId],
    references: [users.id],
  }),
}));

export const agentEncryptionKeysRelations = relations(agentEncryptionKeys, ({ one }) => ({
  user: one(users, {
    fields: [agentEncryptionKeys.userId],
    references: [users.id],
  }),
}));

export const userLlmSettingsRelations = relations(userLlmSettings, ({ one }) => ({
  user: one(users, {
    fields: [userLlmSettings.userId],
    references: [users.id],
  }),
}));

export const llmProvidersRelations = relations(llmProviders, ({ many, one }) => ({
  models: many(llmProviderModels),
  createdByUser: one(users, {
    fields: [llmProviders.createdBy],
    references: [users.id],
  }),
}));

export const llmProviderModelsRelations = relations(llmProviderModels, ({ one }) => ({
  provider: one(llmProviders, {
    fields: [llmProviderModels.providerId],
    references: [llmProviders.id],
  }),
}));

export const llmProviderKeysRelations = relations(llmProviderKeys, ({ one }) => ({
  user: one(users, {
    fields: [llmProviderKeys.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  processes: many(processes),
  documents: many(documents),
  integrations: many(integrations),
  auditLogs: many(auditLogs),
  taskSessions: many(taskSessions),
  taskPatterns: many(taskPatterns),
  taskAutomations: many(taskAutomations),
  processAlerts: many(processAlerts),
  generatedReports: many(generatedReports),
  roiCalculations: many(roiCalculations),
  processComments: many(processComments),
  customKpis: many(customKpis),
  kpiAlerts: many(kpiAlerts),
  agentApiKeys: many(agentApiKeys),
  llmProviderKeys: many(llmProviderKeys),
  llmSettings: one(userLlmSettings, {
    fields: [users.id],
    references: [userLlmSettings.userId],
  }),
}));
