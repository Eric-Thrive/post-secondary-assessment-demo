# Requirements Document

## Introduction

The prompt management editor in the admin screen currently has two issues:

1. Prompts are not displaying properly
2. Data tables are shown for all pathways, but should only display for the complex pathway

This feature will fix these issues to ensure the prompt manager correctly displays prompts and conditionally shows data tables based on the selected pathway.

## Glossary

- **Prompt Manager**: The administrative interface for managing AI prompts and configuration data
- **Pathway Type**: Either "simple" or "complex" - determines which prompts and data tables are used
- **Data Tables**: Reference tables like item_master, support_lookup, caution_lookup, etc. used in the complex pathway
- **Module Type**: The active module (k12, post_secondary, or tutoring)
- **Prompt Section**: A database record containing prompt content with associated metadata

## Requirements

### Requirement 1: Display Prompts Correctly

**User Story:** As an admin, I want to see all prompts for the active module in the prompt manager, so that I can review and edit them.

#### Acceptance Criteria

1. WHEN THE Prompt Manager loads, THE System SHALL fetch prompt sections filtered by the active module type
2. WHEN prompt sections are fetched, THE System SHALL display all matching prompts in the Core Prompts section
3. IF no prompts are found for the active module, THEN THE System SHALL display a clear message indicating no prompts exist
4. WHEN a prompt is displayed, THE System SHALL show its section key, title, and content
5. WHEN the active module changes, THE System SHALL reload and display prompts for the new module

### Requirement 2: Filter Data Tables by Pathway

**User Story:** As an admin, I want data tables to only appear when using the complex pathway, so that the interface is simplified for the simple pathway.

#### Acceptance Criteria

1. WHEN THE pathway type is "simple", THE System SHALL hide the entire Data Tables section
2. WHEN THE pathway type is "complex", THE System SHALL display the Data Tables section with all relevant tabs
3. WHERE THE module is K-12 AND pathway is "complex", THE System SHALL display K-12 specific tables (item_master, support_lookup, caution_lookup, observation_template, barrier_glossary_k12, inference_triggers_k12)
4. WHERE THE module is post_secondary AND pathway is "complex", THE System SHALL display post-secondary specific tables (lookup_tables, barrier_glossary, inference_triggers, plain_language_mappings, mapping_configurations)
5. WHEN THE pathway type changes, THE System SHALL immediately update the visibility of the Data Tables section

### Requirement 3: Pathway Context Management

**User Story:** As an admin, I want the system to track the current pathway selection, so that the prompt manager displays the correct content.

#### Acceptance Criteria

1. THE System SHALL maintain a pathway context that tracks the current pathway type (simple or complex)
2. THE System SHALL provide a way to switch between simple and complex pathways
3. WHEN THE pathway is switched, THE System SHALL update all dependent components
4. THE System SHALL persist the pathway selection during the admin session
5. WHEN THE admin page loads, THE System SHALL default to the "simple" pathway
