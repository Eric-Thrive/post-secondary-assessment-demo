import assert from 'node:assert/strict';

type AIAnalysisRequest = import('../ai-service').AIAnalysisRequest;

const originalNodeEnv = process.env.NODE_ENV;
const originalDemoFlag = process.env.POST_SECONDARY_DEMO;
const originalDatabaseUrl = process.env.DATABASE_URL;

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/test_db';

const { LocalAIService } = await import('../ai-service');
const service = new LocalAIService();

function determinePathway(request: Partial<AIAnalysisRequest> & { moduleType: AIAnalysisRequest['moduleType'] }): 'simple' | 'complex' {
  const baseRequest: AIAnalysisRequest = {
    caseId: 'test-case',
    moduleType: request.moduleType,
    pathway: request.pathway,
    documents: request.documents || [],
    uniqueId: request.uniqueId,
    programMajor: request.programMajor,
    reportAuthor: request.reportAuthor,
    studentGrade: request.studentGrade
  };

  return (service as any).determineEffectivePathway(baseRequest);
}

function setEnv(nodeEnv?: string, demoFlag?: string) {
  if (typeof nodeEnv === 'string') {
    process.env.NODE_ENV = nodeEnv;
  } else {
    delete process.env.NODE_ENV;
  }

  if (typeof demoFlag === 'string') {
    process.env.POST_SECONDARY_DEMO = demoFlag;
  } else {
    delete process.env.POST_SECONDARY_DEMO;
  }
}

try {
  setEnv('post-secondary-demo');
  assert.equal(
    determinePathway({ moduleType: 'post_secondary', pathway: 'complex' }),
    'simple',
    'Post-secondary demo environments should force the simple pathway'
  );

  setEnv('production');
  assert.equal(
    determinePathway({ moduleType: 'post_secondary', pathway: 'complex' }),
    'complex',
    'Post-secondary production environments should respect the requested complex pathway'
  );

  setEnv('production');
  assert.equal(
    determinePathway({ moduleType: 'tutoring', pathway: 'complex' }),
    'simple',
    'Tutoring modules should always use the simple pathway'
  );

  setEnv('production');
  assert.equal(
    determinePathway({ moduleType: 'k12' }),
    'complex',
    'K-12 modules should default to the complex pathway when none is requested'
  );

  setEnv('production');
  assert.equal(
    determinePathway({ moduleType: 'k12', pathway: 'simple' }),
    'simple',
    'K-12 modules should honor the requested simple pathway'
  );

  console.log('✅ determineEffectivePathway helper tests passed');
} finally {
  if (typeof originalNodeEnv === 'string') {
    process.env.NODE_ENV = originalNodeEnv;
  } else {
    delete process.env.NODE_ENV;
  }

  if (typeof originalDemoFlag === 'string') {
    process.env.POST_SECONDARY_DEMO = originalDemoFlag;
  } else {
    delete process.env.POST_SECONDARY_DEMO;
  }

  if (typeof originalDatabaseUrl === 'string') {
    process.env.DATABASE_URL = originalDatabaseUrl;
  } else {
    delete process.env.DATABASE_URL;
  }
}
