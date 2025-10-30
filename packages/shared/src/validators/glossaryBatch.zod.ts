/**
 * Zod validators for glossary batches
 * Mirrors schemas/batch.schema.json with additional runtime validation
 */

import { z } from 'zod';

/**
 * Valid glossary categories
 */
export const VALID_CATEGORIES = [
  'Navigation',
  'Weather',
  'Communication',
  'Safety',
  'Performance',
  'Flight Controls',
  'Navigation Systems',
  'Equipment',
  'Procedures',
  'Electrical Systems',
  'Electrical',
  'Pneumatic Systems',
  'Environmental Systems',
  'Ice Protection Systems',
  'Cargo Systems',
  'Hydraulic Systems',
  'Communication Systems',
  'Lighting Systems',
  'Cabin Systems',
  'Fire Protection Systems',
  'Flight Instruments',
  'Engine Systems',
  'System Controls',
  'Safety Equipment',
  'Communications',
  'Landing Gear',
] as const;

/**
 * Valid relationship types
 */
export const RELATIONSHIP_TYPES = ['broader', 'narrower', 'related', 'seeAlso'] as const;

/**
 * Kebab-case pattern validator
 */
const KEBAB_CASE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Tag format pattern (lowercase with hyphens)
 */
const TAG_PATTERN = /^[a-z0-9-]+$/;

/**
 * ISO 8601 date-time pattern
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

/**
 * Markdown detection patterns (to enforce plain text only)
 */
const MARKDOWN_PATTERNS = [
  /\*\*.*?\*\*/,  // Bold
  /\*.*?\*/,      // Italic
  /_.*?_/,        // Italic underscore
  /#{1,6}\s/,     // Headers
  /\[.*?\]\(.*?\)/, // Links
  /!\[.*?\]\(.*?\)/, // Images
  /```[\s\S]*?```/,   // Code blocks (using [\s\S] instead of . with s flag)
  /`.*?`/,        // Inline code
];

/**
 * Check if text contains markdown formatting
 */
function containsMarkdown(text: string): boolean {
  return MARKDOWN_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Custom refinement to detect markdown in plain text fields
 */
const plainTextRefinement = z.string().refine(
  (text) => !containsMarkdown(text),
  {
    message: 'Content must be plain text only - no markdown or HTML formatting allowed',
  }
);

/**
 * Glossary section schema
 */
export const GlossarySectionSchema = z.object({
  content: plainTextRefinement
    .min(10, 'Content must be at least 10 characters')
    .max(2000, 'Content must not exceed 2000 characters'),
});

/**
 * Semantic relationship schema
 */
export const SemanticRelationshipSchema = z.object({
  termId: z.string()
    .regex(KEBAB_CASE_REGEX, 'termId must be in kebab-case format')
    .min(1, 'termId cannot be empty')
    .max(100, 'termId must not exceed 100 characters'),
  type: z.enum(RELATIONSHIP_TYPES),
  description: z.string()
    .min(10, 'Description must be at least 10 characters if provided')
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
});

/**
 * Glossary term schema
 */
export const GlossaryTermSchema = z.object({
  id: z.string()
    .regex(KEBAB_CASE_REGEX, 'ID must be in kebab-case format (e.g., "flight-level")')
    .min(1, 'ID cannot be empty')
    .max(100, 'ID must not exceed 100 characters'),

  title: z.string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must not exceed 200 characters'),

  category: z.enum(VALID_CATEGORIES as unknown as [string, ...string[]]),

  sections: z.object({
    whatItIs: GlossarySectionSchema,
    location: GlossarySectionSchema.optional(),
    howItWorks: GlossarySectionSchema.optional(),
    whatYouShouldDo: GlossarySectionSchema.optional(),
    troubleshooting: GlossarySectionSchema.optional(),
  }).strict(), // Prevent additional section types

  synonyms: z.array(z.string().min(1).max(100)).default([]),

  tags: z.array(
    z.string()
      .regex(TAG_PATTERN, 'Tags must be lowercase with hyphens only')
      .min(1)
      .max(50)
  ).default([]),

  relationships: z.array(SemanticRelationshipSchema).default([]),

  createdAt: z.string()
    .regex(ISO_DATE_REGEX, 'createdAt must be in ISO 8601 format (e.g., "2024-01-01T00:00:00Z")'),

  updatedAt: z.string()
    .regex(ISO_DATE_REGEX, 'updatedAt must be in ISO 8601 format (e.g., "2024-01-01T00:00:00Z")'),
}).strict(); // Prevent additional fields

/**
 * Glossary batch schema
 */
export const GlossaryBatchSchema = z.object({
  terms: z.array(GlossaryTermSchema)
    .min(1, 'Batch must contain at least 1 term')
    .refine(
      (terms) => {
        const ids = terms.map(t => t.id);
        const uniqueIds = new Set(ids);
        return ids.length === uniqueIds.size;
      },
      {
        message: 'All term IDs must be unique within a batch',
      }
    ),
}).strict();

/**
 * Batch manifest entry schema
 */
export const BatchManifestEntrySchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  createdAt: z.string().regex(ISO_DATE_REGEX),
  termCount: z.number().int().min(1),
  categories: z.array(z.enum(VALID_CATEGORIES as unknown as [string, ...string[]])),
});

/**
 * Batch manifest schema
 */
export const BatchManifestSchema = z.object({
  batches: z.array(BatchManifestEntrySchema),
});

/**
 * Type exports inferred from Zod schemas
 */
export type GlossarySection = z.infer<typeof GlossarySectionSchema>;
export type SemanticRelationship = z.infer<typeof SemanticRelationshipSchema>;
export type GlossaryTerm = z.infer<typeof GlossaryTermSchema>;
export type GlossaryBatch = z.infer<typeof GlossaryBatchSchema>;
export type BatchManifestEntry = z.infer<typeof BatchManifestEntrySchema>;
export type BatchManifest = z.infer<typeof BatchManifestSchema>;
