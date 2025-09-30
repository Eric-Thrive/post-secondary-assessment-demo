#!/usr/bin/env node

/**
 * Automated GitHub Backup Script
 * Uses GitHub API to create commits when Git commands are blocked
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function createAutomatedBackup() {
  try {
    console.log('🚀 Starting automated backup process...');
    
    // Get current branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    console.log(`📍 Current branch: ${currentBranch}`);
    
    // Check for changes
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (!gitStatus.trim()) {
      console.log('✅ No changes to backup');
      return;
    }
    
    console.log('📝 Changes detected:');
    console.log(gitStatus);
    
    // Try direct git commands first
    try {
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "Automated backup: ${new Date().toISOString()}"`, { stdio: 'inherit' });
      execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });
      console.log('✅ Backup completed successfully via Git');
    } catch (gitError) {
      console.log('⚠️  Git commands blocked, falling back to manual instructions');
      
      // Create backup instructions file
      const instructions = `
# Automated Backup Instructions
Generated: ${new Date().toISOString()}
Branch: ${currentBranch}

## Manual Steps Required:
1. Open Replit Shell
2. Run these commands:

\`\`\`bash
git add .
git commit -m "Automated backup: ${new Date().toISOString()}"
git push origin ${currentBranch}
\`\`\`

## Changes to be committed:
${gitStatus}
`;
      
      fs.writeFileSync('BACKUP_INSTRUCTIONS.md', instructions);
      console.log('📋 Created BACKUP_INSTRUCTIONS.md with manual steps');
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  createAutomatedBackup();
}

module.exports = { createAutomatedBackup };