export interface PromptSection {
  id: string;
  section_key: string;
  title: string;
  description?: string;
  content: string;
  version: string;
  execution_order?: number;
  is_system_prompt?: boolean;
  module_type: string;
  last_updated: string;
  created_at: string;
}

export interface LookupTable {
  id: string;
  table_key: string;
  title: string;
  description: string;
  content: any;
  last_updated: string;
  created_at: string;
}

export interface AIConfig {
  id: string;
  config_key: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  timeout_seconds: number;
  last_updated: string;
  created_at: string;
}

export interface MappingConfiguration {
  id: string;
  mapping_key: string;
  title: string;
  description: string;
  mapping_rules: any;
  last_updated: string;
  created_at: string;
}

export interface BarrierGlossary {
  id: string;
  canonical_key: string;
  definition: string;
  examples: string;
  last_updated: string;
  created_at: string;
}

export interface InferenceTrigger {
  id: string;
  trigger_type: string;
  description: string;
  keywords: string;
  inference_logic: string;
  last_updated: string;
  created_at: string;
}

export interface PlainLanguageMapping {
  id: string;
  technical_term: string;
  plain_language_version: string;
  last_updated: string;
  created_at: string;
}
