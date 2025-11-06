import { pgTable, text, serial, timestamp, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
}));
