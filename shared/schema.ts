import { pgTable, text, serial, timestamp, integer, real, boolean, jsonb, primaryKey, varchar, index, unique } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ===================================
// MULTI-TENANT ORGANIZATIONS
// ===================================

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  adminToken: text("admin_token").unique(), // Random UUID for super admin management (non-reversible)
  domain: text("domain"),
  logo: text("logo"),
  industry: text("industry"),
  size: text("size"), // small, medium, large, enterprise
  status: text("status").notNull().default("active"), // active, suspended, trial, canceled
  billingEmail: text("billing_email"),
  settings: jsonb("settings"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  slugIdx: index("organizations_slug_idx").on(table.slug),
  adminTokenIdx: index("organizations_admin_token_idx").on(table.adminToken),
}));

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id"), // Removed .references() temporarily for migration
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("employee"), // super_admin, admin, employee
  status: text("status").notNull().default("active"), // active, inactive, suspended
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("users_organization_id_idx").on(table.organizationId),
  roleIdx: index("users_role_idx").on(table.role),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ===================================
// PASSWORD RESET TOKENS
// ===================================

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index("password_reset_tokens_token_idx").on(table.token),
  userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
  expiresAtIdx: index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
}));

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// ===================================
// TEAM HIERARCHY & INVITATIONS
// ===================================

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  managerId: integer("manager_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status").notNull().default("active"), // active, inactive
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("teams_organization_id_idx").on(table.organizationId),
  managerIdIdx: index("teams_manager_id_idx").on(table.managerId),
}));

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // manager, member
  permissions: jsonb("permissions"), // Additional team-specific permissions
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
  teamIdIdx: index("team_members_team_id_idx").on(table.teamId),
  userIdIdx: index("team_members_user_id_idx").on(table.userId),
  teamUserIdx: index("team_members_team_user_idx").on(table.teamId, table.userId),
}));

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ===================================
// SSO/SAML CONFIGURATION
// ===================================

export const samlConfigurations = pgTable("saml_configurations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(false),
  
  // Identity Provider (IdP) Configuration
  idpEntityId: text("idp_entity_id").notNull(), // IdP issuer/entity ID
  idpSsoUrl: text("idp_sso_url").notNull(), // IdP Single Sign-On URL (HTTP-Redirect or HTTP-POST)
  idpSloUrl: text("idp_slo_url"), // IdP Single Logout URL (optional)
  idpCertificate: text("idp_certificate").notNull(), // X.509 certificate from IdP (PEM format)
  
  // Service Provider (SP) Configuration
  spEntityId: text("sp_entity_id").notNull(), // Our SP entity ID (usually app URL)
  spAssertionConsumerServiceUrl: text("sp_acs_url").notNull(), // Where IdP sends SAML response
  spSingleLogoutUrl: text("sp_slo_url"), // Our SLO endpoint (optional)
  spPrivateKey: text("sp_private_key"), // SP private key for signing AuthnRequests (PEM format, optional)
  spCertificate: text("sp_certificate"), // SP X.509 signing certificate for metadata (PEM format, optional)
  spDecryptionPrivateKey: text("sp_decryption_private_key"), // Separate private key for decrypting assertions (PEM format, optional)
  spEncryptionCertificate: text("sp_encryption_certificate"), // Separate public certificate for encryption (PEM format, optional)
  
  // SAML Settings
  wantAssertionsSigned: boolean("want_assertions_signed").notNull().default(true),
  wantAuthnResponseSigned: boolean("want_authn_response_signed").notNull().default(false),
  signatureAlgorithm: text("signature_algorithm").notNull().default("sha256"), // sha1, sha256, sha512
  digestAlgorithm: text("digest_algorithm").notNull().default("sha256"),
  
  // Attribute Mapping (map SAML attributes to user fields)
  attributeMapping: jsonb("attribute_mapping").notNull().default(sql`'{
    "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "firstName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
    "lastName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
  }'::jsonb`),
  
  // Auto-Provisioning Settings
  autoProvisionUsers: boolean("auto_provision_users").notNull().default(false), // Create users on first SSO login
  defaultRole: text("default_role").notNull().default("employee"), // Default role for auto-provisioned users
  defaultTeamId: integer("default_team_id").references(() => teams.id, { onDelete: "set null" }), // Optional default team
  
  // Advanced Settings
  forceAuthn: boolean("force_authn").notNull().default(false), // Force IdP to re-authenticate
  allowUnencryptedAssertion: boolean("allow_unencrypted_assertion").notNull().default(false),
  clockTolerance: integer("clock_tolerance").notNull().default(300), // Clock skew tolerance in seconds (5 min default)
  
  // Metadata
  metadata: jsonb("metadata"), // Additional custom configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  lastTestedAt: timestamp("last_tested_at"), // Last successful SAML test
}, (table) => ({
  orgIdIdx: index("saml_configurations_organization_id_idx").on(table.organizationId),
  enabledIdx: index("saml_configurations_enabled_idx").on(table.enabled),
  uniqueOrgId: unique("saml_configurations_organization_id_unique").on(table.organizationId), // One SAML config per org
}));

export type SamlConfiguration = typeof samlConfigurations.$inferSelect;
export type InsertSamlConfiguration = typeof samlConfigurations.$inferInsert;

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  role: text("role").notNull().default("employee"), // admin, employee
  teamId: integer("team_id").references(() => teams.id, { onDelete: "set null" }),
  invitedBy: integer("invited_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, accepted, expired, revoked
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  metadata: jsonb("metadata"), // Can store firstName, lastName, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index("invitations_token_idx").on(table.token),
  emailIdx: index("invitations_email_idx").on(table.email),
  orgIdIdx: index("invitations_organization_id_idx").on(table.organizationId),
  statusIdx: index("invitations_status_idx").on(table.status),
}));

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

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
  teamId: integer("team_id").references(() => teams.id, { onDelete: "set null" }),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  source: text("source").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("processes_user_id_idx").on(table.userId),
  teamIdIdx: index("processes_team_id_idx").on(table.teamId),
  orgIdIdx: index("processes_organization_id_idx").on(table.organizationId),
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

// ===================================
// TICKET MANAGEMENT SYSTEM
// ===================================

export const ticketCategories = pgTable("ticket_categories", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id), // NULL = global/platform-wide
  name: text("name").notNull(),
  description: text("description"),
  slaHours: integer("sla_hours").notNull().default(24),
  priority: text("priority").notNull().default("medium"),
  color: text("color"),
  icon: text("icon"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  isActiveIdx: index("ticket_categories_is_active_idx").on(table.isActive),
  organizationIdIdx: index("ticket_categories_organization_id_idx").on(table.organizationId),
}));

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  ticketNumber: text("ticket_number").notNull().unique(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  assigneeId: integer("assignee_id").references(() => users.id),
  categoryId: integer("category_id").references(() => ticketCategories.id),
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed, waiting
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  resolution: text("resolution"),
  dueDate: timestamp("due_date"),
  source: text("source").notNull().default("web"), // web, email, api
  tags: jsonb("tags"),
  metadata: jsonb("metadata"),
  externalRef: text("external_ref"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  resolvedAt: timestamp("resolved_at"),
  firstResponseAt: timestamp("first_response_at"),
}, (table) => ({
  orgIdIdx: index("tickets_organization_id_idx").on(table.organizationId),
  ticketNumberIdx: index("tickets_ticket_number_idx").on(table.ticketNumber),
  statusIdx: index("tickets_status_idx").on(table.status),
  priorityIdx: index("tickets_priority_idx").on(table.priority),
  categoryIdx: index("tickets_category_id_idx").on(table.categoryId),
  assigneeIdx: index("tickets_assignee_id_idx").on(table.assigneeId),
  requesterIdx: index("tickets_requester_id_idx").on(table.requesterId),
  createdAtIdx: index("tickets_created_at_idx").on(table.createdAt),
}));

export const ticketMessages = pgTable("ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  body: text("body").notNull(),
  visibility: text("visibility").notNull().default("public"), // public, internal
  attachments: jsonb("attachments"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  ticketIdIdx: index("ticket_messages_ticket_id_idx").on(table.ticketId),
  orgIdIdx: index("ticket_messages_organization_id_idx").on(table.organizationId),
  createdAtIdx: index("ticket_messages_created_at_idx").on(table.createdAt),
}));

export const ticketAttachments = pgTable("ticket_attachments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  messageId: integer("message_id").references(() => ticketMessages.id),
  uploaderId: integer("uploader_id").references(() => users.id).notNull(),
  storagePath: text("storage_path").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  ticketIdIdx: index("ticket_attachments_ticket_id_idx").on(table.ticketId),
  orgIdIdx: index("ticket_attachments_organization_id_idx").on(table.organizationId),
}));

export const ticketWatchers = pgTable("ticket_watchers", {
  ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.ticketId, table.userId] }),
  orgIdIdx: index("ticket_watchers_organization_id_idx").on(table.organizationId),
}));

export const ticketActivityLog = pgTable("ticket_activity_log", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  actorId: integer("actor_id").references(() => users.id),
  actionType: text("action_type").notNull(), // created, status_changed, assigned, commented, etc.
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  ticketIdIdx: index("ticket_activity_log_ticket_id_idx").on(table.ticketId),
  orgIdIdx: index("ticket_activity_log_organization_id_idx").on(table.organizationId),
  createdAtIdx: index("ticket_activity_log_created_at_idx").on(table.createdAt),
}));

// ===================================
// SUBSCRIPTION & BILLING SYSTEM
// ===================================

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  stripePriceId: text("stripe_price_id").unique(),
  name: text("name").notNull(),
  tier: text("tier").notNull(), // free, pro, enterprise
  monthlyPrice: integer("monthly_price").notNull(), // in cents
  yearlyPrice: integer("yearly_price"), // in cents, if available
  featureLimits: jsonb("feature_limits").notNull(), // { tickets: 100, storage: 10GB, etc. }
  features: jsonb("features").notNull(), // array of feature descriptions
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tierIdx: index("subscription_plans_tier_idx").on(table.tier),
}));

export const organizationSubscriptions = pgTable("organization_subscriptions", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull().unique(),
  planId: integer("plan_id").references(() => subscriptionPlans.id).notNull(),
  status: text("status").notNull().default("active"), // active, past_due, canceled, incomplete, trialing
  billingCycle: text("billing_cycle").notNull().default("monthly"), // monthly, yearly
  seats: integer("seats").notNull().default(1),
  seatsUsed: integer("seats_used").notNull().default(0),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  cancelledAt: timestamp("cancelled_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  paymentGateway: text("payment_gateway"),
  gatewaySubscriptionId: text("gateway_subscription_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  organizationIdIdx: index("organization_subscriptions_organization_id_idx").on(table.organizationId),
  statusIdx: index("organization_subscriptions_status_idx").on(table.status),
}));

export const subscriptionUsage = pgTable("subscription_usage", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").references(() => organizationSubscriptions.id).notNull(),
  metricKey: text("metric_key").notNull(), // tickets_created, storage_used, etc.
  currentValue: integer("current_value").notNull().default(0),
  limitValue: integer("limit_value"),
  resetAt: timestamp("reset_at"), // when the counter resets
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  subscriptionMetricIdx: index("subscription_usage_subscription_metric_idx").on(table.subscriptionId, table.metricKey),
}));

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull(), // succeeded, pending, failed, completed
  paymentGateway: text("payment_gateway"),
  gatewayTransactionId: text("gateway_transaction_id"),
  paymentMethod: text("payment_method"),
  description: text("description"),
  paidAt: timestamp("paid_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("payments_organization_id_idx").on(table.organizationId),
  createdAtIdx: index("payments_created_at_idx").on(table.createdAt),
  statusIdx: index("payments_status_idx").on(table.status),
}));

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => organizationSubscriptions.id),
  invoiceNumber: text("invoice_number"),
  amountSubtotal: integer("amount_subtotal").notNull(),
  amountTax: integer("amount_tax").notNull().default(0),
  amountTotal: integer("amount_total").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull(), // draft, open, paid, void, uncollectible
  paymentGateway: text("payment_gateway"),
  gatewayInvoiceId: text("gateway_invoice_id"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  lineItems: jsonb("line_items"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("invoices_organization_id_idx").on(table.organizationId),
  createdAtIdx: index("invoices_created_at_idx").on(table.createdAt),
  statusIdx: index("invoices_status_idx").on(table.status),
}));

export const paymentEvents = pgTable("payment_events", {
  id: serial("id").primaryKey(),
  paymentGateway: text("payment_gateway"),
  eventType: text("event_type").notNull(),
  eventId: text("event_id").notNull(),
  payload: jsonb("payload").notNull(),
  processed: boolean("processed").notNull().default(false),
  processedAt: timestamp("processed_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index("payment_events_event_id_idx").on(table.eventId),
  createdAtIdx: index("payment_events_created_at_idx").on(table.createdAt),
}));

// ===================================
// USER PROFILES & ROLES
// ===================================

export const userProfiles = pgTable("user_profiles", {
  userId: integer("user_id").primaryKey().references(() => users.id),
  phone: text("phone"),
  title: text("title"),
  timezone: text("timezone").default("UTC"),
  avatarUrl: text("avatar_url"),
  notificationPreferences: jsonb("notification_preferences"),
  bio: text("bio"),
  company: text("company"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roleAssignments = pgTable("role_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull(), // admin, agent, customer, super_admin, employee
  resourceType: text("resource_type"), // organization, global, category, team
  resourceId: integer("resource_id"),
  grantedBy: integer("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
}, (table) => ({
  userRoleIdx: index("role_assignments_user_role_idx").on(table.userId, table.role),
}));

// ===================================
// RELATIONS
// ===================================

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  requester: one(users, {
    fields: [tickets.requesterId],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [tickets.assigneeId],
    references: [users.id],
  }),
  category: one(ticketCategories, {
    fields: [tickets.categoryId],
    references: [ticketCategories.id],
  }),
  messages: many(ticketMessages),
  attachments: many(ticketAttachments),
  activityLogs: many(ticketActivityLog),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketMessages.ticketId],
    references: [tickets.id],
  }),
  author: one(users, {
    fields: [ticketMessages.authorId],
    references: [users.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  users: many(users),
  tickets: many(tickets),
  subscription: one(organizationSubscriptions, {
    fields: [organizations.id],
    references: [organizationSubscriptions.organizationId],
  }),
  payments: many(payments),
  invoices: many(invoices),
}));

export const organizationSubscriptionsRelations = relations(organizationSubscriptions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [organizationSubscriptions.organizationId],
    references: [organizations.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [organizationSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  usage: many(subscriptionUsage),
  invoices: many(invoices),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
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
  tickets: many(tickets),
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  roleAssignments: many(roleAssignments),
}));
