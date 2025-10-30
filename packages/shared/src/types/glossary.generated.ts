/**
 * AUTO-GENERATED FROM schemas/batch.schema.json
 * DO NOT EDIT MANUALLY - Run `npm run types:gen` to regenerate
 */

/**
 * Valid glossary categories (must match exactly - case sensitive)
 */
export type GlossaryCategory =
  | 'Navigation'
  | 'Weather'
  | 'Communication'
  | 'Safety'
  | 'Performance'
  | 'Flight Controls'
  | 'Navigation Systems'
  | 'Equipment'
  | 'Procedures'
  | 'Electrical Systems'
  | 'Electrical'
  | 'Pneumatic Systems'
  | 'Environmental Systems'
  | 'Ice Protection Systems'
  | 'Cargo Systems'
  | 'Hydraulic Systems'
  | 'Communication Systems'
  | 'Lighting Systems'
  | 'Cabin Systems'
  | 'Fire Protection Systems'
  | 'Flight Instruments'
  | 'Engine Systems'
  | 'System Controls'
  | 'Safety Equipment'
  | 'Communications'
  | 'Landing Gear';

/**
 * Type of semantic relationship between terms
 */
export type SemanticRelationshipType = 'broader' | 'narrower' | 'related' | 'seeAlso';

/**
 * Content section for a glossary term
 */
export interface GlossarySection {
  /**
   * Plain text content (NO MARKDOWN)
   * Recommended: 100-500 characters
   */
  content: string;
}

/**
 * Relationship between glossary terms
 */
export interface SemanticRelationship {
  /**
   * ID of related term (must exist in glossary)
   * Format: kebab-case
   */
  termId: string;

  /**
   * Type of relationship
   */
  type: SemanticRelationshipType;

  /**
   * Optional explanation of the relationship
   */
  description?: string;
}

/**
 * Complete glossary term object
 */
export interface GlossaryTerm {
  /**
   * Unique identifier in kebab-case format
   * Pattern: ^[a-z0-9]+(-[a-z0-9]+)*$
   * Examples: "flight-level", "instrument-landing-system"
   */
  id: string;

  /**
   * Display name of the term
   * Examples: "Flight Level", "ILS - Instrument Landing System"
   */
  title: string;

  /**
   * Category the term belongs to (must match exactly)
   */
  category: GlossaryCategory;

  /**
   * Content sections for the term
   */
  sections: {
    /**
     * REQUIRED - Primary definition
     */
    whatItIs: GlossarySection;

    /**
     * OPTIONAL - Physical location in aircraft
     */
    location?: GlossarySection;

    /**
     * OPTIONAL - Functional explanation
     */
    howItWorks?: GlossarySection;

    /**
     * OPTIONAL - Operational procedures
     */
    whatYouShouldDo?: GlossarySection;

    /**
     * OPTIONAL - Problem-solving guide
     */
    troubleshooting?: GlossarySection;
  };

  /**
   * Alternative names and abbreviations (can be empty array)
   */
  synonyms: string[];

  /**
   * Searchable tags (can be empty array)
   * Format: lowercase with hyphens
   */
  tags: string[];

  /**
   * Related terms (can be empty array)
   */
  relationships: SemanticRelationship[];

  /**
   * Creation timestamp (ISO 8601)
   */
  createdAt: string;

  /**
   * Last update timestamp (ISO 8601)
   */
  updatedAt: string;
}

/**
 * Batch of glossary terms for import
 */
export interface GlossaryBatch {
  /**
   * Array of glossary terms
   */
  terms: GlossaryTerm[];
}

/**
 * Batch manifest entry
 */
export interface BatchManifestEntry {
  /**
   * Unique batch identifier
   */
  id: string;

  /**
   * Relative path to batch file
   */
  path: string;

  /**
   * Creation date (ISO 8601)
   */
  createdAt: string;

  /**
   * Number of terms in batch
   */
  termCount: number;

  /**
   * Categories covered by this batch
   */
  categories: GlossaryCategory[];
}

/**
 * Master manifest tracking all batches
 */
export interface BatchManifest {
  /**
   * List of all batches
   */
  batches: BatchManifestEntry[];
}
