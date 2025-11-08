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
});

export const eventLogs = pgTable("event_logs", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id).notNull(),
  caseId: text("case_id").notNull(),
  activity: text("activity").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  resource: text("resource"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
});

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
});

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

export const usersRelations = relations(users, ({ many }) => ({
  processes: many(processes),
  documents: many(documents),
  integrations: many(integrations),
  auditLogs: many(auditLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
