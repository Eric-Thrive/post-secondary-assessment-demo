// @ts-nocheck
// Cache-busting routes that bypass Database caching completely
import { Express } from 'express';
import { storage } from './storage';

export function registerNoCacheRoutes(app: Express) {
  // No-cache headers middleware
  const noCacheHeaders = (req: any, res: any, next: any) => {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toUTCString()
    });
    next();
  };

  // Fresh assessment cases with no caching
  app.get("/api/fresh-assessment-cases/:moduleType", noCacheHeaders, async (req, res) => {
    try {
      const { moduleType } = req.params;
      const timestamp = Date.now();
      
      console.log(`Fresh assessment cases request for ${moduleType} at ${timestamp}`);
      
      const cases = await storage.getAssessmentCases(moduleType);
      res.json(cases);
    } catch (error) {
      console.error('Fresh assessment cases error:', error);
      res.status(500).json({ error: 'Failed to fetch fresh assessment cases' });
    }
  });

  // Fresh item master data with no caching
  app.get("/api/fresh-item-master/:caseId/:moduleType", noCacheHeaders, async (req, res) => {
    try {
      const { caseId, moduleType } = req.params;
      const timestamp = Date.now();
      
      console.log(`Fresh item master request for case ${caseId}, module ${moduleType} at ${timestamp}`);
      
      const itemMasterData = await storage.getItemMasterData(caseId, moduleType);
      res.json(itemMasterData);
    } catch (error) {
      console.error('Fresh item master data error:', error);
      res.status(500).json({ error: 'Failed to fetch fresh item master data' });
    }
  });

  // Fresh prompt sections with no caching
  app.get("/api/fresh-prompts/:moduleType", noCacheHeaders, async (req, res) => {
    try {
      const { moduleType } = req.params;
      const timestamp = Date.now();
      
      console.log(`Fresh prompts request for ${moduleType} at ${timestamp}`);
      
      const prompts = await storage.getPromptSections(moduleType);
      res.json(prompts);
    } catch (error) {
      console.error('Fresh prompts error:', error);
      res.status(500).json({ error: 'Failed to fetch fresh prompts' });
    }
  });
}