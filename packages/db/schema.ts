import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  uuid,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// RBAC Enums
export enum UserRole {
  DEVELOPER = "developer",
  SYSTEM_ADMIN = "system_admin",
  ORG_ADMIN = "org_admin",
  CUSTOMER = "customer",
  DEMO = "demo",
}

export enum ModuleType {
  K12 = "k12",
  POST_SECONDARY = "post_secondary",
  TUTORING = "tutoring",
}

// Organizations table for multi-tenancy
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(), // UUID or custom ID
  name: text("name").notNull(),
  customerId: text("customer_id").notNull().unique(), // Backward compatibility
  assignedModules: jsonb("assigned_modules")
    .notNull()
    .default(["post_secondary"]),
  maxUsers: integer("max_users").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),

  // RBAC fields (replacing environment logic)
  role: text("role").notNull().default("customer"), // UserRole enum
  assignedModules: jsonb("assigned_modules").default(["post_secondary"]), // ModuleType[]

  // Organization fields (replacing customerId)
  organizationId: text("organization_id"), // References organizations table

  // Legacy customer management fields (for backward compatibility during migration)
  customerId: text("customer_id").notNull().default("system"),
  customerName: text("customer_name"),

  // Report management
  reportCount: integer("report_count").notNull().default(0),
  maxReports: integer("max_reports").notNull().default(-1), // -1 = unlimited, 5 for demo

  // Status fields
  isActive: boolean("is_active").notNull().default(true),

  // Authentication fields
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),
  registrationToken: text("registration_token"),

  // Legacy demo permissions (will be removed after migration)
  demoPermissions: jsonb("demo_permissions").default({}),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastLogin: timestamp("last_login", { withTimezone: true }),
});

// Sessions table for express-session with connect-pg-simple
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { withTimezone: true }).notNull(),
});

// AI Configuration
export const aiConfig = pgTable("ai_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  configKey: text("config_key").notNull().unique(),
  modelName: text("model_name").notNull(),
  temperature: text("temperature").notNull(),
  maxTokens: integer("max_tokens").notNull(),
  timeoutSeconds: integer("timeout_seconds").notNull(),
  moduleType: text("module_type").notNull().default("post_secondary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

// Assessment Cases
export const assessmentCases = pgTable("assessment_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseId: text("case_id").notNull().unique(),
  moduleType: text("module_type").notNull(),
  gradeBand: text("grade_band"),
  documentNames: jsonb("document_names").default([]),
  status: text("status").notNull().default("pending"),
  reportData: jsonb("report_data"),
  itemMasterData: jsonb("item_master_data"),
  displayName: text("display_name").notNull(),

  // New assessment form fields
  uniqueId: text("unique_id"), // Student's unique identifier
  programMajor: text("program_major"), // Student's program/major
  reportAuthor: text("report_author"), // Person creating the report
  dateIssued: timestamp("date_issued", { withTimezone: true }), // Date the report was issued

  // Customer isolation
  customerId: text("customer_id").notNull().default("system"),
  createdByUserId: integer("created_by_user_id"),

  // JSON-first architecture
  reportDataJson: jsonb("report_data_json"), // Structured JSON data
  qcMetadata: jsonb("qc_metadata"), // Confidence scores, uncertainty flags, etc.

  // Version tracking fields
  currentVersion: text("current_version").notNull().default("1.0"),
  finalizedVersions: jsonb("finalized_versions").default([]), // Array of {version, content, timestamp, changes}
  isFinalized: boolean("is_finalized").notNull().default(false),

  // Sharing fields
  shareToken: uuid("share_token"),
  isShared: boolean("is_shared").notNull().default(false),
  sharedAt: timestamp("shared_at", { withTimezone: true }),

  createdDate: timestamp("created_date", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

// Prompt Sections
export const promptSections = pgTable("prompt_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionKey: text("section_key").notNull(),
  sectionName: text("section_name").notNull(),
  content: text("content").notNull(),
  version: text("version").notNull().default("1.0"),
  moduleType: text("module_type").notNull().default("post_secondary"),
  promptType: text("prompt_type").notNull().default("system"), // 'system' or 'report_format'
  pathwayType: text("pathway_type").notNull().default("simple"), // 'simple' or 'complex'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

// Lookup Tables
export const lookupTables = pgTable("lookup_tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableKey: text("table_key").notNull(),
  tableName: text("table_name").notNull(),
  content: jsonb("content").notNull(),
  moduleType: text("module_type").notNull().default("post_secondary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

// Mapping Configurations
export const mappingConfigurations = pgTable("mapping_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  mappingKey: text("mapping_key").notNull(),
  mappingName: text("mapping_name").notNull(),
  mappingRules: jsonb("mapping_rules").notNull(),
  moduleType: text("module_type").notNull().default("post_secondary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

// Plain Language Mappings
export const plainLanguageMappings = pgTable("plain_language_mappings", {
  id: uuid("id").primaryKey().defaultRandom(),
  canonicalKey: text("canonical_key").notNull(),
  plainLanguageText: text("plain_language_text").notNull(),
  moduleType: text("module_type").notNull().default("post_secondary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

// Inference Triggers
export const inferenceTriggers = pgTable("inference_triggers", {
  id: uuid("id").primaryKey().defaultRandom(),
  canonicalKey: text("canonical_key").notNull(),
  synonymList: text("synonym_list").array(),
  moduleType: text("module_type").notNull().default("post_secondary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

// Barrier Glossary
export const barrierGlossary = pgTable("barrier_glossary", {
  id: uuid("id").primaryKey().defaultRandom(),
  canonicalKey: text("canonical_key").notNull(),
  oneSentenceDefinition: text("one_sentence_definition").notNull(),
  moduleType: text("module_type").notNull().default("post_secondary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

// Assessment Findings - stores AI-identified strengths/weaknesses before canonical matching
export const assessmentFindings = pgTable("assessment_findings", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentCaseId: uuid("assessment_case_id").references(
    () => assessmentCases.id
  ),
  findingType: text("finding_type").notNull(), // 'strength' or 'weakness'
  description: text("description").notNull(), // Raw AI-identified finding
  relevanceScore: integer("relevance_score").notNull(), // 1-10 scale
  classroomImpact: text("classroom_impact"), // How it affects classroom performance
  rankOrder: integer("rank_order"), // 1-4 for strengths, 1-3 for weaknesses

  // Added after AI Handler processing
  canonicalKey: text("canonical_key"), // Matched canonical ID
  matchingMethod: text("matching_method"), // 'exact', 'semantic', 'expert_inference'
  itemMasterId: uuid("item_master_id"), // Link to final item master record

  moduleType: text("module_type").notNull().default("k12"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

// K-12 specific tables
export const barrierGlossaryK12 = pgTable("barrier_glossary_k12", {
  id: uuid("id").primaryKey().defaultRandom(),
  canonicalKey: text("canonical_key").notNull().unique(),
  barrierCategory: text("barrier_category").notNull(),
  parentFriendlyLabel: text("parent_friendly_label").notNull(),
  academicDescription: text("academic_description"),
  behavioralIndicators: text("behavioral_indicators"),
  interventionSuggestions: text("intervention_suggestions"),
  moduleType: text("module_type").notNull().default("k12"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

export const inferenceTriggersK12 = pgTable("inference_triggers_k12", {
  id: uuid("id").primaryKey().defaultRandom(),
  canonicalKey: text("canonical_key").notNull().unique(),
  parentFriendlyLabel: text("parent_friendly_label").notNull(),
  synonymList: text("synonym_list"),
  notes: text("notes"),
  moduleType: text("module_type").notNull().default("k12"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

export const itemMaster = pgTable("item_master", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentCaseId: uuid("assessment_case_id").references(
    () => assessmentCases.id
  ),
  canonicalKey: text("canonical_key").notNull(),
  itemLabel: text("item_label").notNull(),
  gradeBand: text("grade_band").notNull(),
  parentFriendlyLabel: text("parent_friendly_label"),
  classroomObservation: text("classroom_observation"),
  support1: text("support_1"),
  support2: text("support_2"),
  cautionNote: text("caution_note"),
  evidenceBasis: text("evidence_basis"),

  // Quality Control Flags for Cascade Inference
  validationStatus: text("validation_status"), // 'validated', 'partial_inference', 'full_inference', 'needs_review'
  inferenceLevel: text("inference_level"), // 'none', 'partial', 'complete'
  sourceFindingId: uuid("source_finding_id").references(
    () => assessmentFindings.id
  ), // Link back to original finding

  qcFlag: text("qc_flag"),
  source: text("source").notNull(),
  moduleType: text("module_type").notNull().default("k12"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

export const supportLookup = pgTable("support_lookup", {
  id: uuid("id").primaryKey().defaultRandom(),
  canonicalKey: text("canonical_key").notNull(),
  gradeBand: text("grade_band").notNull(),
  supportType: text("support_type").notNull(),
  description: text("description").notNull(),
  implementationDetails: text("implementation_details"),
  moduleType: text("module_type").notNull().default("k12"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

export const cautionLookup = pgTable("caution_lookup", {
  id: uuid("id").primaryKey().defaultRandom(),
  canonicalKey: text("canonical_key").notNull(),
  gradeBand: text("grade_band").notNull(),
  cautionType: text("caution_type").notNull(),
  description: text("description").notNull(),
  warningDetails: text("warning_details"),
  moduleType: text("module_type").notNull().default("k12"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

export const observationTemplate = pgTable("observation_template", {
  id: uuid("id").primaryKey().defaultRandom(),
  canonicalKey: text("canonical_key").notNull(),
  gradeBand: text("grade_band").notNull(),
  observationType: text("observation_type").notNull(),
  templateContent: text("template_content").notNull(),
  observationDetails: text("observation_details"),
  moduleType: text("module_type").notNull().default("k12"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

// Post-secondary specific tables
export const postSecondaryItemMaster = pgTable("post_secondary_item_master", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentCaseId: uuid("assessment_case_id").references(
    () => assessmentCases.id
  ),
  canonicalKey: text("canonical_key").notNull(),
  itemLabel: text("item_label").notNull(),
  plainLanguageLabel: text("plain_language_label"),
  evidenceBasis: text("evidence_basis"),
  accommodations: text("accommodations"),
  cautionNote: text("caution_note"),
  qcFlag: text("qc_flag"),
  source: text("source").notNull(),
  moduleType: text("module_type").notNull().default("post_secondary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

export const postSecondaryAccommodations = pgTable(
  "post_secondary_accommodations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    canonicalKey: text("canonical_key").notNull(),
    accommodation: text("accommodation").notNull(),
    category: text("category"),
    moduleType: text("module_type").notNull().default("post_secondary"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
  }
);

// Demo permissions type definition
export const demoPermissionsSchema = z.object({
  "post-secondary-demo": z.boolean().optional(),
  "k12-demo": z.boolean().optional(),
  "tutoring-demo": z.boolean().optional(),
});

export type DemoPermissions = z.infer<typeof demoPermissionsSchema>;

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  createdAt: true,
  lastUpdated: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  assignedModules: true,
  organizationId: true,
  customerId: true,
  customerName: true,
  reportCount: true,
  maxReports: true,
  isActive: true,
  resetToken: true,
  resetTokenExpiry: true,
  registrationToken: true,
  demoPermissions: true,
});

export const insertAiConfigSchema = createInsertSchema(aiConfig).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertAssessmentCaseSchema = createInsertSchema(
  assessmentCases
).omit({
  id: true,
  createdDate: true,
  lastUpdated: true,
});

export const insertPromptSectionSchema = createInsertSchema(
  promptSections
).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertLookupTableSchema = createInsertSchema(lookupTables).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertMappingConfigurationSchema = createInsertSchema(
  mappingConfigurations
).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertPlainLanguageMappingSchema = createInsertSchema(
  plainLanguageMappings
).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertInferenceTriggerSchema = createInsertSchema(
  inferenceTriggers
).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertBarrierGlossarySchema = createInsertSchema(
  barrierGlossary
).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertAssessmentFindingsSchema = createInsertSchema(
  assessmentFindings
).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertItemMasterSchema = createInsertSchema(itemMaster).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

// Type exports
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAiConfig = z.infer<typeof insertAiConfigSchema>;
export type AiConfig = typeof aiConfig.$inferSelect;

export type InsertAssessmentCase = z.infer<typeof insertAssessmentCaseSchema>;
export type AssessmentCase = typeof assessmentCases.$inferSelect;

export type InsertPromptSection = z.infer<typeof insertPromptSectionSchema>;
export type PromptSection = typeof promptSections.$inferSelect;

export type InsertLookupTable = z.infer<typeof insertLookupTableSchema>;
export type LookupTable = typeof lookupTables.$inferSelect;

export type InsertMappingConfiguration = z.infer<
  typeof insertMappingConfigurationSchema
>;
export type MappingConfiguration = typeof mappingConfigurations.$inferSelect;

export type InsertPlainLanguageMapping = z.infer<
  typeof insertPlainLanguageMappingSchema
>;
export type PlainLanguageMapping = typeof plainLanguageMappings.$inferSelect;

export type InsertInferenceTrigger = z.infer<
  typeof insertInferenceTriggerSchema
>;
export type InferenceTrigger = typeof inferenceTriggers.$inferSelect;

export type InsertBarrierGlossary = z.infer<typeof insertBarrierGlossarySchema>;
export type BarrierGlossary = typeof barrierGlossary.$inferSelect;

export type InsertAssessmentFindings = z.infer<
  typeof insertAssessmentFindingsSchema
>;
export type AssessmentFindings = typeof assessmentFindings.$inferSelect;

export type InsertItemMaster = z.infer<typeof insertItemMasterSchema>;
export type ItemMaster = typeof itemMaster.$inferSelect;

export type BarrierGlossaryK12 = typeof barrierGlossaryK12.$inferSelect;
export type InferenceTriggersK12 = typeof inferenceTriggersK12.$inferSelect;
export type SupportLookup = typeof supportLookup.$inferSelect;
export type CautionLookup = typeof cautionLookup.$inferSelect;
export type ObservationTemplate = typeof observationTemplate.$inferSelect;
export type PostSecondaryItemMaster =
  typeof postSecondaryItemMaster.$inferSelect;
export type PostSecondaryAccommodations =
  typeof postSecondaryAccommodations.$inferSelect;
