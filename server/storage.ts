import { users, type User, type InsertUser, lookupTables, barrierGlossary } from "@shared/schema";
import { db, pool } from './db';
import { eq } from 'drizzle-orm';
import { isReadOnlyEnvironment, isControlledAccessMode, isDemoEnvironment, getDatabaseConnectionInfo } from './config/database';
import { createLogger } from './reliability-improvements';

// Create conditional logger based on environment
const logger = createLogger(process.env.NODE_ENV === 'development');

/**
 * SECURITY: Demo operation validation functions
 */
class DemoSecurityValidator {
  
  /**
   * Validates that demo operations only access demo customer data
   */
  static validateDemoDataAccess(operation: string, data: any): void {
    if (!isDemoEnvironment()) return; // Only validate in demo environments
    
    // Check for non-demo customer IDs
    if (data?.customerId && data.customerId !== 'demo-customer') {
      throw new Error(
        `SECURITY VIOLATION: Demo operation '${operation}' attempted to access customer '${data.customerId}'. ` +
        `Demo operations are restricted to 'demo-customer' only.`
      );
    }
    
    // Check for nested customer references
    if (data?.customer?.id && data.customer.id !== 'demo-customer') {
      throw new Error(
        `SECURITY VIOLATION: Demo operation '${operation}' attempted to access customer '${data.customer.id}'. ` +
        `Demo operations are restricted to 'demo-customer' only.`
      );
    }
    
    // Check assessment cases
    if (data?.assessmentCase?.customerId && data.assessmentCase.customerId !== 'demo-customer') {
      throw new Error(
        `SECURITY VIOLATION: Demo operation '${operation}' attempted to access assessment case for customer '${data.assessmentCase.customerId}'. ` +
        `Demo operations are restricted to 'demo-customer' only.`
      );
    }
  }
  
  /**
   * Validates that database writes are allowed in current configuration
   * Supports controlled access mode for demo operations on shared databases
   */
  static validateWritePermissions(operation: string): void {
    const isControlledAccess = isControlledAccessMode();
    const isDemoEnv = isDemoEnvironment();
    
    // Allow writes in controlled access mode for demo operations
    if (isDemoEnv && isControlledAccess) {
      logger.debug(`🔒 CONTROLLED ACCESS: Storage write operation approved for demo environment`, {
        operation,
        mode: 'controlled_access',
        timestamp: new Date().toISOString(),
        reason: 'Enhanced security with customer isolation enforced'
      });
      return; // Allow the operation
    }
    
    // Apply standard read-only environment checks for non-controlled access
    if (isReadOnlyEnvironment()) {
      const connInfo = getDatabaseConnectionInfo();
      throw new Error(
        `SECURITY VIOLATION: Write operation '${operation}' blocked in read-only environment. ` +
        `Environment: ${connInfo.environment}, IsDemo: ${connInfo.isDemoEnvironment}. ` +
        `Consider enabling controlled access mode for demo operations.`
      );
    }
  }
  
  /**
   * Forces demo customer ID for all demo operations
   */
  static ensureDemoCustomer(data: any): any {
    if (!isDemoEnvironment()) return data; // Only modify in demo environments
    
    const demoData = { ...data };
    
    // Force demo customer ID
    demoData.customerId = 'demo-customer';
    
    // Force demo customer in nested objects
    if (demoData.customer) {
      demoData.customer.id = 'demo-customer';
    }
    
    if (demoData.assessmentCase) {
      demoData.assessmentCase.customerId = 'demo-customer';
    }
    
    return demoData;
  }
}

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Password reset functionality
  setPasswordResetToken(email: string, token: string, expiry: Date): Promise<boolean>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  resetUserPassword(token: string, newPassword: string): Promise<boolean>;
  
  // Assessment Cases
  getAssessmentCases(moduleType: string, customerId?: string): Promise<any[]>;
  getAssessmentCase(id: string): Promise<any>;
  createAssessmentCase(assessmentCase: any): Promise<any>;
  updateAssessmentCase(id: string, data: any): Promise<any>;
  
  // Version Management
  finalizeReport(id: string, finalizedContent: string, changesSummary: any[]): Promise<any>;
  getReportVersions(id: string): Promise<any>;
  switchToVersion(id: string, version: string): Promise<any>;
  
  // Item Master Data
  getItemMasterData?(caseId: string, moduleType: string): Promise<any[]>;
  getPostSecondaryItemMaster?(): Promise<any[]>;
  insertItemMasterRecord?(record: any): Promise<any>;
  
  // AI Configuration
  getAiConfig(): Promise<any>;
  updateAiConfig(config: any): Promise<any>;
  
  // Prompts
  getPromptSections(moduleType: string, promptType?: string, pathwayType?: string): Promise<any[]>;
  updatePromptSection(sectionKey: string, content: string, promptType?: string): Promise<any>;
  
  // Lookup Tables
  getLookupTables(moduleType: string): Promise<any[]>;
  updateLookupTable(tableKey: string, content: any): Promise<any>;
  
  // Mapping Configurations
  getMappingConfigurations(moduleType: string): Promise<any[]>;
  updateMappingConfiguration(mappingKey: string, mappingRules: any): Promise<any>;
  
  // Plain Language Mappings
  getPlainLanguageMappings(moduleType: string): Promise<any[]>;
  updatePlainLanguageMapping(id: string, data: any): Promise<any>;
  
  // Inference Triggers
  getInferenceTriggers(moduleType: string): Promise<any[]>;
  updateInferenceTrigger(id: string, data: any): Promise<any>;
  
  // Barrier Glossary
  getBarrierGlossary(moduleType: string): Promise<any[]>;
  updateBarrierGlossary(id: string, data: any): Promise<any>;
  
  // Assessment Findings
  createAssessmentFinding?(finding: any): Promise<any>;
  getAssessmentFindings?(caseId: string): Promise<any[]>;
  updateAssessmentFinding?(id: string, data: any): Promise<any>;
  
  // K-12 Lookup Tables
  getBarrierGlossaryK12?(): Promise<any[]>;
  getSupportLookup?(canonicalKey: string, gradeBand: string): Promise<any[]>;
  getCautionLookup?(canonicalKey: string, gradeBand: string): Promise<any[]>;
  getObservationTemplate?(canonicalKey: string, gradeBand: string): Promise<any[]>;
  
  // Report Sharing
  getSharedReport(shareToken: string): Promise<any>;
  enableReportSharing(caseId: string, customerId?: string): Promise<string | null>;
  disableReportSharing(caseId: string, customerId?: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async setPasswordResetToken(email: string, token: string, expiry: Date): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user) return false;
    
    const updatedUser = { 
      ...user, 
      resetToken: token, 
      resetTokenExpiry: expiry 
    };
    this.users.set(user.id, updatedUser);
    return true;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const now = new Date();
    return Array.from(this.users.values()).find(
      (user) => user.resetToken === token && 
                user.resetTokenExpiry && 
                user.resetTokenExpiry > now
    );
  }

  async resetUserPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.getUserByResetToken(token);
    if (!user) return false;
    
    const updatedUser = { 
      ...user, 
      password: newPassword, // Note: This should be hashed in real implementation
      resetToken: null, 
      resetTokenExpiry: null 
    };
    this.users.set(user.id, updatedUser);
    return true;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      customerId: insertUser.customerId || 'system',
      customerName: insertUser.customerName ?? null,
      role: insertUser.role || 'tutor',
      isActive: insertUser.isActive ?? true,
      reportCount: insertUser.reportCount || 0,
      maxReports: insertUser.maxReports || 5,
      resetToken: insertUser.resetToken ?? null,
      resetTokenExpiry: insertUser.resetTokenExpiry ?? null,
      registrationToken: insertUser.registrationToken ?? null,
      demoPermissions: insertUser.demoPermissions ?? {},
      createdAt: new Date(),
      lastLogin: null,
    };
    this.users.set(id, user);
    return user;
  }

  // Stub implementations for other methods
  async getAssessmentCases(moduleType: string, customerId?: string): Promise<any[]> { return []; }
  async getAssessmentCase(): Promise<any> { return undefined; }
  async createAssessmentCase(): Promise<any> { throw new Error('Not implemented'); }
  async updateAssessmentCase(): Promise<any> { throw new Error('Not implemented'); }
  async getAiConfig(): Promise<any> { return undefined; }
  async updateAiConfig(): Promise<any> { throw new Error('Not implemented'); }
  async getPromptSections(moduleType: string, promptType?: string, pathwayType?: string): Promise<any[]> { return []; }
  async updatePromptSection(): Promise<any> { throw new Error('Not implemented'); }
  async getLookupTables(): Promise<any[]> { return []; }
  async updateLookupTable(): Promise<any> { throw new Error('Not implemented'); }
  async getMappingConfigurations(): Promise<any[]> { return []; }
  async updateMappingConfiguration(): Promise<any> { throw new Error('Not implemented'); }
  async getPlainLanguageMappings(): Promise<any[]> { return []; }
  async updatePlainLanguageMapping(): Promise<any> { throw new Error('Not implemented'); }
  async getInferenceTriggers(): Promise<any[]> { return []; }
  async updateInferenceTrigger(): Promise<any> { throw new Error('Not implemented'); }
  async getBarrierGlossary(): Promise<any[]> { return []; }
  async updateBarrierGlossary(): Promise<any> { throw new Error('Not implemented'); }
  
  // Version Management Methods (stubs for MemStorage)
  async finalizeReport(id: string, finalizedContent: string, changesSummary: any[]): Promise<any> {
    throw new Error('Version management not implemented for MemStorage');
  }
  
  async getReportVersions(id: string): Promise<any> {
    throw new Error('Version management not implemented for MemStorage');
  }
  
  async switchToVersion(id: string, version: string): Promise<any> {
    throw new Error('Version management not implemented for MemStorage');
  }

  // Report Sharing Methods (stubs for MemStorage)
  async getSharedReport(shareToken: string): Promise<any> {
    throw new Error('Report sharing not implemented for MemStorage');
  }

  async enableReportSharing(caseId: string, customerId?: string): Promise<string | null> {
    throw new Error('Report sharing not implemented for MemStorage');
  }

  async disableReportSharing(caseId: string, customerId?: string): Promise<boolean> {
    throw new Error('Report sharing not implemented for MemStorage');
  }
}

// DatabaseStorage class using Neon PostgreSQL (Replit standard)
export class DatabaseStorage implements IStorage {
  /**
   * ENHANCED SECURITY: Comprehensive write permissions check with demo validation
   * - Validates write permissions for read-only environments
   * - Enforces demo customer isolation when in demo environments
   * - Uses DemoSecurityValidator for all demo operations
   */
  private checkWritePermissions(operation: string, data?: any): void {
    // STEP 1: Standard write permission check
    DemoSecurityValidator.validateWritePermissions(operation);
    
    // STEP 2: Demo environment additional validations
    if (isDemoEnvironment()) {
      console.log(`🔒 DEMO SECURITY: Validating ${operation} in demo environment`);
      
      // STEP 3: Validate demo data access if data is provided
      if (data) {
        DemoSecurityValidator.validateDemoDataAccess(operation, data);
        
        // STEP 4: Force demo customer ID for safety
        if (data.customerId || data.customer?.id || data.assessmentCase?.customerId) {
          const originalData = JSON.stringify(data);
          data = DemoSecurityValidator.ensureDemoCustomer(data);
          
          if (originalData !== JSON.stringify(data)) {
            console.log(`🔒 DEMO SECURITY: Forced demo customer for ${operation}`, {
              operation,
              originalCustomer: JSON.parse(originalData).customerId,
              enforcedCustomer: data.customerId
            });
          }
        }
      }
      
      // STEP 5: Log demo operation for audit trail
      console.log(`🎯 DEMO STORAGE OPERATION: ${operation}`, {
        operation,
        timestamp: new Date().toISOString(),
        hasData: !!data,
        environment: getDatabaseConnectionInfo().environment
      });
    }
  }

  /**
   * SECURITY: Enhanced demo-aware data validation
   * Ensures data conforms to demo customer isolation requirements
   */
  private validateAndPrepareData(operation: string, data: any): any {
    // Always validate write permissions first
    this.checkWritePermissions(operation, data);
    
    // In demo environments, ensure demo customer enforcement
    if (isDemoEnvironment()) {
      data = DemoSecurityValidator.ensureDemoCustomer(data);
    }
    
    return data;
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async setPasswordResetToken(email: string, token: string, expiry: Date): Promise<boolean> {
    try {
      this.checkWritePermissions('setPasswordResetToken', { email });
      const result = await db
        .update(users)
        .set({
          resetToken: token,
          resetTokenExpiry: expiry,
        })
        .where(eq(users.email, email))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error setting password reset token:', error);
      return false;
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const now = new Date();
    const result = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token));
    
    const [user] = result;
    
    // Check if token is valid and not expired
    if (user && user.resetTokenExpiry && user.resetTokenExpiry > now) {
      return user;
    }
    return undefined;
  }

  async resetUserPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      this.checkWritePermissions('resetUserPassword', { token });
      const user = await this.getUserByResetToken(token);
      if (!user) return false;

      const result = await db
        .update(users)
        .set({
          password: newPassword, // Note: Should be hashed
          resetToken: null,
          resetTokenExpiry: null,
        })
        .where(eq(users.resetToken, token))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // SECURITY: Enhanced validation with demo customer enforcement
    const validatedData = this.validateAndPrepareData('createUser', insertUser);
    const [user] = await db.insert(users).values(validatedData).returning();
    return user;
  }

  // For now, delegate complex queries to the existing raw SQL implementation
  async getAssessmentCases(moduleType: string, customerId?: string): Promise<any[]> {
    console.log(`\n🔍 DatabaseStorage.getAssessmentCases called`);
    console.log(`📋 Module Type Requested: "${moduleType}"`);
    console.log(`👤 Customer ID Filter: "${customerId || 'NONE - ADMIN MODE'}"`);
    console.log(`🗄️  Database URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
    
    // First, let's check ALL cases in the database to debug
    try {
      const allCasesQuery = `SELECT module_type, status, COUNT(*) as count, COUNT(CASE WHEN report_data IS NOT NULL THEN 1 END) as with_report FROM assessment_cases GROUP BY module_type, status ORDER BY module_type, status`;
      const allCasesResult = await pool.query(allCasesQuery);
      console.log(`\n📊 ALL Cases in Database:`);
      allCasesResult.rows.forEach(row => {
        console.log(`   - ${row.module_type} (${row.status}): ${row.count} total, ${row.with_report} with report_data`);
      });
    } catch (e) {
      console.error('All cases check failed:', e);
    }
    
    // Now check specifically for the requested module type
    try {
      let checkQuery = `SELECT COUNT(*) as total, COUNT(CASE WHEN report_data IS NOT NULL THEN 1 END) as with_report FROM assessment_cases WHERE module_type = $1 AND status = 'completed'`;
      const checkParams = [moduleType];
      
      if (customerId) {
        checkQuery += ` AND customer_id = $2`;
        checkParams.push(customerId);
      }
      
      const checkResult = await pool.query(checkQuery, checkParams);
      console.log(`\n✅ Specific check for "${moduleType}" module${customerId ? ` (customer: ${customerId})` : ''}:`);
      console.log(`   - Total completed: ${checkResult.rows[0].total}`);
      console.log(`   - With report_data: ${checkResult.rows[0].with_report}`);
    } catch (e) {
      console.error('Specific module check failed:', e);
    }
    
    let query = `SELECT * FROM assessment_cases WHERE module_type = $1 AND status = 'completed' AND report_data IS NOT NULL`;
    const params = [moduleType];
    
    // Add customer filter if provided
    if (customerId) {
      query += ` AND customer_id = $2`;
      params.push(customerId);
    }
    
    query += ` ORDER BY created_date DESC`;
    console.log(`\n🔎 Executing query for "${moduleType}"${customerId ? ` with customer filter "${customerId}"` : ''}...`);
    
    try {
      const result = await pool.query(query, params);
      console.log(`✅ Query returned ${result.rows.length} rows for "${moduleType}"${customerId ? ` and customer "${customerId}"` : ''}`);
      
      if (result.rows.length > 0) {
        console.log(`📄 First case ID: ${result.rows[0].id}`);
      }
      
      // Add analysis_result field for compatibility and ensure case_id is used as the primary identifier
      const cases = result.rows.map(row => ({
        ...row,
        id: row.case_id, // Use case_id as the primary identifier for frontend
        analysis_result: row.report_data
      }));
      
      return cases;
    } catch (error) {
      console.error('DatabaseStorage.getAssessmentCases error:', error);
      return [];
    }
  }

  // Helper function to detect UUID format
  private isUUIDFormat(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  async getAssessmentCase(id: string): Promise<any> {
    // Check if ID is UUID format (K-12/post-secondary) or string format (tutoring)
    let query: string;
    if (this.isUUIDFormat(id)) {
      // UUID format: query by id column (K-12/post-secondary cases)
      query = `SELECT * FROM assessment_cases WHERE id = $1`;
    } else {
      // String format: query by case_id column (tutoring cases)  
      query = `SELECT * FROM assessment_cases WHERE case_id = $1`;
    }
    
    const result = await pool.query(query, [id]);
    const caseData = result.rows[0];
    
    // Debug: Check if report_data needs JSON parsing
    if (caseData && caseData.report_data && typeof caseData.report_data === 'string') {
      console.log('🔍 DEBUG: Parsing report_data from JSON string');
      try {
        caseData.report_data = JSON.parse(caseData.report_data);
      } catch (e) {
        console.error('❌ Failed to parse report_data JSON:', e);
        caseData.report_data = null;
      }
    }
    
    return caseData;
  }

  async createAssessmentCase(assessmentCase: any): Promise<any> {
    // SECURITY: Enhanced validation with demo customer enforcement
    const validatedAssessmentCase = this.validateAndPrepareData('createAssessmentCase', assessmentCase);
    
    // Handle both camelCase and snake_case field naming for compatibility
    const caseData = {
      id: validatedAssessmentCase.id,
      caseId: validatedAssessmentCase.caseId || validatedAssessmentCase.case_id || validatedAssessmentCase.id,
      moduleType: validatedAssessmentCase.moduleType || validatedAssessmentCase.module_type,
      status: validatedAssessmentCase.status || 'pending',
      displayName: validatedAssessmentCase.displayName || validatedAssessmentCase.display_name || `Assessment ${new Date().toLocaleDateString()}`,
      documentNames: validatedAssessmentCase.documentNames || validatedAssessmentCase.document_names || [],
      reportData: validatedAssessmentCase.reportData || validatedAssessmentCase.report_data,
      customerId: validatedAssessmentCase.customerId || 'demo-customer', // Force demo-customer in demo environments
      createdByUserId: validatedAssessmentCase.createdByUserId || null,
      reportDataJson: validatedAssessmentCase.reportDataJson || null,
      qcMetadata: validatedAssessmentCase.qcMetadata || null,
      // New assessment form fields
      uniqueId: validatedAssessmentCase.uniqueId || validatedAssessmentCase.unique_id || null,
      programMajor: validatedAssessmentCase.programMajor || validatedAssessmentCase.program_major || null,
      reportAuthor: validatedAssessmentCase.reportAuthor || validatedAssessmentCase.report_author || null
    };
    
    console.log('📝 Creating assessment case with normalized data:', {
      id: caseData.id,
      caseId: caseData.caseId,
      moduleType: caseData.moduleType,
      customerId: caseData.customerId,
      displayName: caseData.displayName
    });
    
    const query = `INSERT INTO assessment_cases (
        id, case_id, module_type, status, display_name, document_names, report_data, 
        customer_id, created_by_user_id, report_data_json, qc_metadata,
        unique_id, program_major, report_author,
        created_date, last_updated
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()) RETURNING *`;
    const result = await pool.query(query, [
      caseData.id,
      caseData.caseId,
      caseData.moduleType,
      caseData.status,
      caseData.displayName,
      JSON.stringify(caseData.documentNames || []),
      caseData.reportData ? JSON.stringify(caseData.reportData) : null,
      caseData.customerId,
      caseData.createdByUserId,
      caseData.reportDataJson ? JSON.stringify(caseData.reportDataJson) : null,
      caseData.qcMetadata ? JSON.stringify(caseData.qcMetadata) : null,
      caseData.uniqueId,
      caseData.programMajor,
      caseData.reportAuthor
    ]);
    return result.rows[0];
  }

  async updateAssessmentCase(id: string, data: any): Promise<any> {
    // SECURITY: Enhanced validation with demo customer enforcement
    const validatedData = this.validateAndPrepareData('updateAssessmentCase', data);
    
    // Get the case first to find the correct database ID
    const currentCase = await this.getAssessmentCase(id);
    if (!currentCase) throw new Error('Assessment case not found');
    
    // SECURITY: Additional demo validation for existing case
    if (isDemoEnvironment() && currentCase.customer_id !== 'demo-customer') {
      throw new Error(
        `SECURITY VIOLATION: Demo operation attempted to update non-demo case. ` +
        `Case customer: '${currentCase.customer_id}', Required: 'demo-customer'`
      );
    }
    
    const query = `UPDATE assessment_cases SET report_data = $2, status = $3, last_updated = NOW() WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [
      currentCase.id, // Use actual database ID, not frontend ID
      validatedData.report_data ? JSON.stringify(validatedData.report_data) : null,
      validatedData.status || 'completed'
    ]);
    return result.rows[0];
  }

  async getAiConfig(): Promise<any> {
    const query = `SELECT * FROM ai_config LIMIT 1`;
    const result = await pool.query(query);
    return result.rows[0];
  }

  async updateAiConfig(config: any): Promise<any> {
    // SECURITY: Enhanced validation with demo customer enforcement
    const validatedConfig = this.validateAndPrepareData('updateAiConfig', config);
    
    const query = `UPDATE ai_config SET model_name = $1, temperature = $2, max_tokens = $3, last_updated = NOW() WHERE id = $4 RETURNING *`;
    const result = await pool.query(query, [validatedConfig.model_name, validatedConfig.temperature, validatedConfig.max_tokens, validatedConfig.id]);
    return result.rows[0];
  }

  async getPromptSections(moduleType: string, promptType?: string, pathwayType?: string): Promise<any[]> {
    let query = `SELECT * FROM prompt_sections WHERE module_type = $1`;
    const params: any[] = [moduleType];
    
    if (promptType) {
      query += ` AND prompt_type = $2`;
      params.push(promptType);
    }
    
    if (pathwayType) {
      query += ` AND pathway_type = $${params.length + 1}`;
      params.push(pathwayType);
    }
    
    query += ` ORDER BY section_key`;
    const result = await pool.query(query, params);
    
    // Check if this is demo environment and we need to include demo templates
    const currentEnv = process.env.APP_ENVIRONMENT || 'replit-prod';
    
    if (currentEnv === 'post-secondary-demo' && moduleType === 'post_secondary') {
      // Also fetch demo-specific templates
      let demoQuery = `SELECT * FROM prompt_sections WHERE module_type = $1 AND section_key LIKE '%_demo'`;
      const demoParams: any[] = [moduleType];
      
      if (promptType) {
        demoQuery += ` AND prompt_type = $2`;
        demoParams.push(promptType);
      }
      
      demoQuery += ` ORDER BY section_key`;
      const demoResult = await pool.query(demoQuery, demoParams);
      
      // Merge demo templates with regular templates, prioritizing demo versions
      const allTemplates = [...result.rows, ...demoResult.rows];
      const templateMap = new Map();
      
      // Add regular templates first
      result.rows.forEach(template => {
        templateMap.set(template.section_key, template);
      });
      
      // Override with demo templates where available
      demoResult.rows.forEach(template => {
        const baseKey = template.section_key.replace('_demo', '');
        templateMap.set(baseKey, template);
      });
      
      return Array.from(templateMap.values());
    }
    
    // Check if this is K-12 demo environment
    if (currentEnv === 'k12-demo' && moduleType === 'k12') {
      logger.debug('K-12 Demo mode detected - using demo prompts');

      // Fetch demo-specific templates
      let demoQuery = `SELECT * FROM prompt_sections WHERE module_type = $1 AND section_key LIKE '%_demo'`;
      const demoParams: any[] = [moduleType];

      if (promptType) {
        demoQuery += ` AND prompt_type = $2`;
        demoParams.push(promptType);
      }

      demoQuery += ` ORDER BY section_key`;
      const demoResult = await pool.query(demoQuery, demoParams);

      logger.debug(`Found ${demoResult.rows.length} K-12 demo templates`);

      // Merge demo templates with regular templates, prioritizing demo versions
      const allTemplates = [...result.rows, ...demoResult.rows];
      const templateMap = new Map();

      // Add regular templates first
      result.rows.forEach(template => {
        templateMap.set(template.section_key, template);
      });

      // Override with demo templates where available
      demoResult.rows.forEach(template => {
        // Replace regular K-12 prompts with demo versions
        const baseKey = template.section_key.replace('_demo', '');
        templateMap.set(baseKey, template);
        logger.debug(`Replacing ${baseKey} with demo version: ${template.section_key}`);
      });

      return Array.from(templateMap.values());
    }
    
    return result.rows;
  }

  async updatePromptSection(sectionKey: string, content: string, promptType?: string): Promise<any> {
    // SECURITY: Enhanced validation with demo customer enforcement
    this.checkWritePermissions('updatePromptSection', { sectionKey, content, promptType });
    
    // Check if this is a demo environment update
    const currentEnv = process.env.APP_ENVIRONMENT || 'replit-prod';
    
    if (currentEnv === 'post-secondary-demo' && sectionKey.includes('post_secondary') && !sectionKey.includes('_demo')) {
      // Redirect to demo-specific template
      const demoSectionKey = sectionKey.replace('post_secondary', 'post_secondary_demo');
      logger.debug(`Demo environment detected, redirecting to demo template: ${demoSectionKey}`);
      
      // Update the demo template instead
      let query = `UPDATE prompt_sections SET content = $2, last_updated = NOW()`;
      const params: any[] = [demoSectionKey, content];
      
      if (promptType) {
        query += `, prompt_type = $3`;
        params.push(promptType);
      }
      
      query += ` WHERE section_key = $1 RETURNING *`;
      const result = await pool.query(query, params);
      return result.rows[0];
    }
    
    // Normal update for non-demo environments
    let query = `UPDATE prompt_sections SET content = $2, last_updated = NOW()`;
    const params: any[] = [sectionKey, content];
    
    if (promptType) {
      query += `, prompt_type = $3`;
      params.push(promptType);
    }
    
    query += ` WHERE section_key = $1 RETURNING *`;
    const result = await pool.query(query, params);
    return result.rows[0];
  }

  async getLookupTables(moduleType: string): Promise<any[]> {
    const query = `SELECT * FROM lookup_tables WHERE module_type = $1 ORDER BY table_key`;
    const result = await pool.query(query, [moduleType]);
    return result.rows;
  }

  async updateLookupTable(tableKey: string, content: any): Promise<any> {
    const query = `UPDATE lookup_tables SET content = $2, last_updated = NOW() WHERE table_key = $1 RETURNING *`;
    const result = await pool.query(query, [tableKey, JSON.stringify(content)]);
    return result.rows[0];
  }

  async getMappingConfigurations(moduleType: string): Promise<any[]> {
    const query = `SELECT * FROM mapping_configurations WHERE module_type = $1 ORDER BY mapping_key`;
    const result = await pool.query(query, [moduleType]);
    return result.rows;
  }

  async updateMappingConfiguration(mappingKey: string, mappingRules: any): Promise<any> {
    const query = `UPDATE mapping_configurations SET mapping_rules = $2, last_updated = NOW() WHERE mapping_key = $1 RETURNING *`;
    const result = await pool.query(query, [mappingKey, JSON.stringify(mappingRules)]);
    return result.rows[0];
  }

  async getPlainLanguageMappings(moduleType: string): Promise<any[]> {
    const query = `SELECT * FROM plain_language_mappings WHERE module_type = $1 ORDER BY canonical_key`;
    const result = await pool.query(query, [moduleType]);
    return result.rows;
  }

  async updatePlainLanguageMapping(id: string, data: any): Promise<any> {
    const query = `UPDATE plain_language_mappings SET plain_language_description = $2, last_updated = NOW() WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id, data.plain_language_description]);
    return result.rows[0];
  }

  async getInferenceTriggers(moduleType: string): Promise<any[]> {
    const query = `SELECT * FROM inference_triggers WHERE module_type = $1 ORDER BY canonical_key`;
    const result = await pool.query(query, [moduleType]);
    return result.rows;
  }

  async updateInferenceTrigger(id: string, data: any): Promise<any> {
    const query = `UPDATE inference_triggers SET keyword_patterns = $2, last_updated = NOW() WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id, JSON.stringify(data.keyword_patterns)]);
    return result.rows[0];
  }

  async getBarrierGlossary(moduleType: string): Promise<any[]> {
    const query = `SELECT * FROM barrier_glossary WHERE module_type = $1 ORDER BY canonical_key`;
    const result = await pool.query(query, [moduleType]);
    return result.rows;
  }

  async updateBarrierGlossary(id: string, data: any): Promise<any> {
    const query = `UPDATE barrier_glossary SET one_sentence_definition = $2, last_updated = NOW() WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id, data.one_sentence_definition]);
    return result.rows[0];
  }
  
  async insertItemMasterRecord(record: any): Promise<any> {
    try {
      console.log('💾 DatabaseStorage: Inserting item master record');
      
      const query = `INSERT INTO post_secondary_item_master 
        (id, assessment_case_id, canonical_key, item_label, plain_language_label, 
         evidence_basis, accommodations, qc_flag, module_type, source, created_at, last_updated) 
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING *`;
      
      const values = [
        record.assessment_case_id,
        record.canonical_key || '',
        record.item_label || '',
        record.plain_language_label || '',
        record.evidence_basis || '',
        record.accommodations || '',
        record.qc_flag || 'needs_review',
        record.module_type || 'post_secondary',
        record.source || 'ai_analysis',
        record.created_at || new Date().toISOString(),
        new Date().toISOString()
      ];
      
      const result = await pool.query(query, values);
      console.log('✅ Item master record inserted successfully');
      return result.rows[0];
    } catch (error) {
      console.error('❌ DatabaseStorage: Failed to insert item master record:', error);
      throw error;
    }
  }
  
  // Assessment Findings Methods
  async createAssessmentFinding(finding: any): Promise<any> {
    const query = `INSERT INTO assessment_findings 
      (id, assessment_case_id, finding_type, description, relevance_score, 
       classroom_impact, rank_order, canonical_key, matching_method, 
       item_master_id, module_type, created_at, last_updated)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *`;
    
    const values = [
      finding.assessment_case_id,
      finding.finding_type,
      finding.description,
      finding.relevance_score,
      finding.classroom_impact || null,
      finding.rank_order || null,
      finding.canonical_key || null,
      finding.matching_method || null,
      finding.item_master_id || null,
      finding.module_type || 'k12'
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  
  async getAssessmentFindings(caseId: string): Promise<any[]> {
    const query = `SELECT * FROM assessment_findings 
      WHERE assessment_case_id = $1 
      ORDER BY finding_type DESC, rank_order ASC`;
    const result = await pool.query(query, [caseId]);
    return result.rows;
  }
  
  async updateAssessmentFinding(id: string, data: any): Promise<any> {
    const query = `UPDATE assessment_findings 
      SET canonical_key = $2, matching_method = $3, item_master_id = $4, last_updated = NOW()
      WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [
      id, 
      data.canonical_key, 
      data.matching_method,
      data.item_master_id
    ]);
    return result.rows[0];
  }
  
  // K-12 Lookup Table Methods
  async getBarrierGlossaryK12(): Promise<any[]> {
    const query = `SELECT * FROM barrier_glossary_k12 ORDER BY canonical_key`;
    const result = await pool.query(query);
    return result.rows;
  }
  
  async getSupportLookup(canonicalKey: string, gradeBand: string): Promise<any[]> {
    const query = `SELECT * FROM support_lookup 
      WHERE canonical_key = $1 AND grade_band = $2`;
    const result = await pool.query(query, [canonicalKey, gradeBand]);
    return result.rows;
  }
  
  async getCautionLookup(canonicalKey: string, gradeBand: string): Promise<any[]> {
    const query = `SELECT * FROM caution_lookup 
      WHERE canonical_key = $1 AND grade_band = $2`;
    const result = await pool.query(query, [canonicalKey, gradeBand]);
    return result.rows;
  }
  
  async getObservationTemplate(canonicalKey: string, gradeBand: string): Promise<any[]> {
    const query = `SELECT * FROM observation_template 
      WHERE canonical_key = $1 AND grade_band = $2`;
    const result = await pool.query(query, [canonicalKey, gradeBand]);
    return result.rows;
  }
  
  // Version Management Methods
  async finalizeReport(id: string, finalizedContent: string, changesSummary: any[]): Promise<any> {
    // SECURITY: Enhanced validation with demo customer enforcement
    this.checkWritePermissions('finalizeReport', { id, finalizedContent, changesSummary });
    
    // Get current report data
    const currentCase = await this.getAssessmentCase(id);
    if (!currentCase) throw new Error('Assessment case not found');
    
    // SECURITY: Additional demo validation for existing case
    if (isDemoEnvironment() && currentCase.customer_id !== 'demo-customer') {
      throw new Error(
        `SECURITY VIOLATION: Demo finalize operation attempted on non-demo case. ` +
        `Case customer: '${currentCase.customer_id}', Required: 'demo-customer'`
      );
    }
    
    logger.debug('Finalizing report for case', {
      caseId: currentCase.id || currentCase.case_id,
      hasReportData: !!currentCase.report_data
    });

    // Get current version info from report_data or default to version 1.0
    const currentVersion = currentCase.report_data?.currentVersion || '1.0';
    const finalizedVersions = currentCase.report_data?.finalizedVersions || [];

    // Create new version entry - V2, V3, V4, etc.
    const versionNum = currentVersion === '1.0' ? 2 : parseInt(currentVersion.replace('V', '')) + 1;
    const newVersionNumber = `V${versionNum}`;
    const versionEntry = {
      version: newVersionNumber,
      content: finalizedContent,
      timestamp: new Date().toISOString(),
      changes: changesSummary
    };

    logger.debug('Creating new version', {
      oldVersion: currentVersion,
      newVersion: newVersionNumber
    });

    // Update report_data with version tracking
    const updatedReportData = {
      ...currentCase.report_data,
      currentVersion: newVersionNumber,
      finalizedVersions: [...finalizedVersions, versionEntry],
      isFinalized: true,
      markdown_report: finalizedContent
    };
    
    const query = `UPDATE assessment_cases 
      SET report_data = $2, last_updated = NOW()
      WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [currentCase.id, JSON.stringify(updatedReportData)]);
    return result.rows[0];
  }
  
  async getReportVersions(id: string): Promise<any> {
    const currentCase = await this.getAssessmentCase(id);
    if (!currentCase) {
      logger.warn(`No case found for ID: ${id}`);
      return { versions: [], currentVersion: '1.0' };
    }

    const result = {
      currentVersion: currentCase.report_data?.currentVersion || '1.0',
      versions: currentCase.report_data?.finalizedVersions || [],
      isFinalized: currentCase.report_data?.isFinalized || false
    };

    logger.debug('Returning versions result', { versionCount: result.versions.length });
    return result;
  }
  
  async switchToVersion(id: string, version: string): Promise<any> {
    // SECURITY: Enhanced validation with demo customer enforcement
    this.checkWritePermissions('switchToVersion', { id, version });
    
    const currentCase = await this.getAssessmentCase(id);
    if (!currentCase) throw new Error('Assessment case not found');
    
    // SECURITY: Additional demo validation for existing case
    if (isDemoEnvironment() && currentCase.customer_id !== 'demo-customer') {
      throw new Error(
        `SECURITY VIOLATION: Demo version switch attempted on non-demo case. ` +
        `Case customer: '${currentCase.customer_id}', Required: 'demo-customer'`
      );
    }
    
    let targetContent: string;
    
    if (version === 'original') {
      // Switch back to original version - use backup_report from report_data
      targetContent = currentCase.report_data?.backup_report || '';
      console.log(`🔄 Original content retrieved: ${targetContent.substring(0, 100)}...`);
    } else if (version === '1.0') {
      // Special case: Version 1.0 refers to the original/current content before finalization
      targetContent = currentCase.report_data?.markdown_report || '';
      console.log(`🔄 Version 1.0 content retrieved: ${targetContent.substring(0, 100)}...`);
    } else {
      // Switch to a finalized version (V2, V3, etc.)
      const finalizedVersions = currentCase.report_data?.finalizedVersions || [];
      const targetVersion = finalizedVersions.find((v: any) => v.version === version);
      
      if (!targetVersion) throw new Error('Version not found');
      targetContent = targetVersion.content;
    }
    
    // Update current report with selected version content
    const updatedReportData = {
      ...currentCase.report_data,
      markdown_report: targetContent
    };
    
    // Update both report_data and current_version column
    const query = `UPDATE assessment_cases 
      SET report_data = $2, current_version = $3, last_updated = NOW()
      WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [currentCase.id, JSON.stringify(updatedReportData), version]);
    return result.rows[0];
  }

  // Report Sharing Methods
  async getSharedReport(shareToken: string): Promise<any> {
    try {
      logger.debug('Getting shared report for token', { shareToken });

      const query = `
        SELECT id, case_id, display_name, module_type, report_data, created_date,
               share_token, is_shared, shared_at
        FROM assessment_cases
        WHERE share_token = $1 AND is_shared = true
      `;

      const result = await pool.query(query, [shareToken]);

      if (result.rows.length === 0) {
        logger.warn('No shared report found for token', { shareToken });
        return null;
      }

      const report = result.rows[0];
      logger.info('Found shared report', { displayName: report.display_name });

      return {
        id: report.id,
        caseId: report.case_id,
        displayName: report.display_name,
        moduleType: report.module_type,
        reportData: report.report_data,
        createdDate: report.created_date,
        sharedAt: report.shared_at
      };
    } catch (error) {
      logger.error('Error getting shared report:', error);
      throw error;
    }
  }

  async enableReportSharing(caseId: string, customerId?: string): Promise<string | null> {
    try {
      logger.debug('Enabling sharing for case', { caseId });

      // Generate a new share token
      const { randomUUID } = await import('crypto');
      const shareToken = randomUUID();

      // Build query with optional customer filter
      let query = `
        UPDATE assessment_cases
        SET share_token = $1, is_shared = true, shared_at = NOW()
        WHERE case_id = $2
      `;
      let params = [shareToken, caseId];

      // Add customer filter if provided
      if (customerId) {
        query += ` AND customer_id = $3`;
        params.push(customerId);
      }

      query += ` RETURNING share_token`;

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        logger.warn('No report found for case', { caseId });
        return null;
      }

      logger.info('Sharing enabled for case', { caseId });
      return shareToken;
    } catch (error) {
      logger.error('Error enabling report sharing:', error);
      throw error;
    }
  }

  async disableReportSharing(caseId: string, customerId?: string): Promise<boolean> {
    try {
      logger.debug('Disabling sharing for case', { caseId });

      // Build query with optional customer filter
      let query = `
        UPDATE assessment_cases
        SET share_token = NULL, is_shared = false, shared_at = NULL
        WHERE case_id = $1
      `;
      let params = [caseId];

      // Add customer filter if provided
      if (customerId) {
        query += ` AND customer_id = $2`;
        params.push(customerId);
      }

      query += ` RETURNING id`;

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        logger.warn('No report found for case', { caseId });
        return false;
      }

      logger.info('Sharing disabled for case', { caseId });
      return true;
    } catch (error) {
      logger.error('Error disabling report sharing:', error);
      throw error;
    }
  }
}

// Storage initialization based on environment
let storage: IStorage;

function initializeStorage() {
  // Always use DatabaseStorage with Neon PostgreSQL
  storage = new DatabaseStorage();
  console.log('Storage initialized: DatabaseStorage');
  console.log('Database: Neon PostgreSQL');
  return storage;
}

// Initialize storage on module load
storage = initializeStorage();

// Function to reinitialize storage (kept for compatibility)
export async function reinitializeStorage(environment: string) {
  // Always returns DatabaseStorage now
  return storage;
}

export { storage };
