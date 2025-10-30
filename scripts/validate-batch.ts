/**
 * Batch Validation Script
 *
 * Validates glossary batch files against:
 * 1. JSON Schema (schemas/batch.schema.json)
 * 2. Zod runtime validation
 * 3. Quiz contract requirements (4+ terms per category)
 * 4. Cross-references (relationship termIds must exist)
 */

import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { GlossaryBatchSchema, VALID_CATEGORIES } from '../packages/shared/src/validators/glossaryBatch.zod';
import type { GlossaryBatch, GlossaryTerm } from '../packages/shared/src/types/glossary.generated';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  termCount: number;
  categories: string[];
}

/**
 * Load and parse JSON file
 */
function loadJsonFile(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load all existing terms from glossaryData.json to check term counts
 */
function loadExistingTerms(): GlossaryTerm[] {
  const glossaryPath = path.join(__dirname, '../packages/web/src/features/glossary/glossaryData.json');

  if (!fs.existsSync(glossaryPath)) {
    console.warn(`${colors.yellow}⚠ Warning: Could not find existing glossaryData.json at ${glossaryPath}${colors.reset}`);
    return [];
  }

  try {
    const data = loadJsonFile(glossaryPath);
    return data.terms || [];
  } catch (error) {
    console.warn(`${colors.yellow}⚠ Warning: Could not load existing terms: ${error}${colors.reset}`);
    return [];
  }
}

/**
 * Validate against JSON Schema
 */
function validateJsonSchema(data: any, schemaPath: string): string[] {
  const errors: string[] = [];

  try {
    const schema = loadJsonFile(schemaPath);
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid && validate.errors) {
      validate.errors.forEach((error) => {
        const path = error.instancePath || '/';
        const message = error.message || 'Unknown error';
        errors.push(`JSON Schema Error at ${path}: ${message}`);
      });
    }
  } catch (error) {
    errors.push(`Failed to validate JSON Schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return errors;
}

/**
 * Validate against Zod schema
 */
function validateZodSchema(data: any): string[] {
  const errors: string[] = [];

  try {
    GlossaryBatchSchema.parse(data);
  } catch (error: any) {
    if (error.errors) {
      error.errors.forEach((err: any) => {
        const path = err.path.join('.');
        errors.push(`Zod Error at ${path}: ${err.message}`);
      });
    } else {
      errors.push(`Zod validation failed: ${error.message || 'Unknown error'}`);
    }
  }

  return errors;
}

/**
 * Check for markdown in text content
 */
function checkForMarkdown(batch: GlossaryBatch): string[] {
  const warnings: string[] = [];
  const markdownPatterns = [
    { pattern: /\*\*.*?\*\*/, name: 'bold (**text**)' },
    { pattern: /\*.*?\*/, name: 'italic (*text*)' },
    { pattern: /_.*?_/, name: 'italic (_text_)' },
    { pattern: /#{1,6}\s/, name: 'headers (#)' },
    { pattern: /\[.*?\]\(.*?\)/, name: 'links ([text](url))' },
    { pattern: /!\[.*?\]\(.*?\)/, name: 'images (![alt](url))' },
  ];

  batch.terms.forEach((term) => {
    Object.entries(term.sections).forEach(([sectionName, section]) => {
      if (section?.content) {
        markdownPatterns.forEach(({ pattern, name }) => {
          if (pattern.test(section.content)) {
            warnings.push(`Term "${term.id}" section "${sectionName}" contains ${name} - plain text only!`);
          }
        });
      }
    });
  });

  return warnings;
}

/**
 * Validate cross-references (relationship termIds)
 */
function validateCrossReferences(batch: GlossaryBatch, existingTerms: GlossaryTerm[]): string[] {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Build set of all known term IDs (batch + existing)
  const batchTermIds = new Set(batch.terms.map(t => t.id));
  const existingTermIds = new Set(existingTerms.map(t => t.id));
  const allTermIds = new Set([...batchTermIds, ...existingTermIds]);

  batch.terms.forEach((term) => {
    term.relationships.forEach((rel) => {
      if (!allTermIds.has(rel.termId)) {
        errors.push(`Term "${term.id}" references unknown term "${rel.termId}" in relationships`);
      }
    });
  });

  return [...errors, ...warnings];
}

/**
 * Check quiz requirements (4+ terms per category)
 */
function checkQuizRequirements(batch: GlossaryBatch, existingTerms: GlossaryTerm[]): string[] {
  const warnings: string[] = [];

  // Count terms per category (batch + existing)
  const categoryCounts = new Map<string, number>();

  // Count existing terms
  existingTerms.forEach((term) => {
    categoryCounts.set(term.category, (categoryCounts.get(term.category) || 0) + 1);
  });

  // Add batch terms
  batch.terms.forEach((term) => {
    categoryCounts.set(term.category, (categoryCounts.get(term.category) || 0) + 1);
  });

  // Check for categories with < 4 terms
  categoryCounts.forEach((count, category) => {
    if (count < 4) {
      warnings.push(
        `Category "${category}" has only ${count} term(s) - need 4+ for quiz generation. ` +
        `Add ${4 - count} more term(s).`
      );
    }
  });

  // Check if any new categories are introduced with < 4 terms
  const newCategories = batch.terms
    .map(t => t.category)
    .filter(cat => !existingTerms.some(t => t.category === cat));

  const uniqueNewCategories = [...new Set(newCategories)];
  uniqueNewCategories.forEach((category) => {
    const newCategoryCount = batch.terms.filter(t => t.category === category).length;
    if (newCategoryCount < 4) {
      warnings.push(
        `NEW category "${category}" introduced with only ${newCategoryCount} term(s) - ` +
        `add ${4 - newCategoryCount} more in this batch or next.`
      );
    }
  });

  return warnings;
}

/**
 * Validate a single batch file
 */
function validateBatch(filePath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(`\n${colors.cyan}${colors.bright}Validating: ${filePath}${colors.reset}`);
  console.log(`${colors.blue}${'─'.repeat(80)}${colors.reset}\n`);

  // Load batch file
  let data: any;
  try {
    data = loadJsonFile(filePath);
  } catch (error) {
    errors.push(`Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { valid: false, errors, warnings, termCount: 0, categories: [] };
  }

  // Load schema
  const schemaPath = path.join(__dirname, '../schemas/batch.schema.json');

  // 1. Validate JSON Schema
  console.log('1️⃣  Validating against JSON Schema...');
  const jsonSchemaErrors = validateJsonSchema(data, schemaPath);
  errors.push(...jsonSchemaErrors);
  if (jsonSchemaErrors.length === 0) {
    console.log(`   ${colors.green}✓ JSON Schema validation passed${colors.reset}`);
  } else {
    console.log(`   ${colors.red}✗ JSON Schema validation failed${colors.reset}`);
  }

  // 2. Validate Zod
  console.log('\n2️⃣  Validating with Zod (runtime checks)...');
  const zodErrors = validateZodSchema(data);
  errors.push(...zodErrors);
  if (zodErrors.length === 0) {
    console.log(`   ${colors.green}✓ Zod validation passed${colors.reset}`);
  } else {
    console.log(`   ${colors.red}✗ Zod validation failed${colors.reset}`);
  }

  // If basic validation failed, stop here
  if (errors.length > 0) {
    return { valid: false, errors, warnings, termCount: 0, categories: [] };
  }

  const batch = data as GlossaryBatch;

  // 3. Check for markdown
  console.log('\n3️⃣  Checking for markdown (plain text only)...');
  const markdownWarnings = checkForMarkdown(batch);
  warnings.push(...markdownWarnings);
  if (markdownWarnings.length === 0) {
    console.log(`   ${colors.green}✓ No markdown detected - all plain text${colors.reset}`);
  } else {
    console.log(`   ${colors.yellow}⚠ Markdown detected in ${markdownWarnings.length} location(s)${colors.reset}`);
  }

  // 4. Load existing terms and validate cross-references
  console.log('\n4️⃣  Validating cross-references...');
  const existingTerms = loadExistingTerms();
  const crossRefErrors = validateCrossReferences(batch, existingTerms);
  errors.push(...crossRefErrors);
  if (crossRefErrors.length === 0) {
    console.log(`   ${colors.green}✓ All relationship references are valid${colors.reset}`);
  } else {
    console.log(`   ${colors.red}✗ Invalid cross-references found${colors.reset}`);
  }

  // 5. Check quiz requirements
  console.log('\n5️⃣  Checking quiz requirements (4+ terms per category)...');
  const quizWarnings = checkQuizRequirements(batch, existingTerms);
  warnings.push(...quizWarnings);
  if (quizWarnings.length === 0) {
    console.log(`   ${colors.green}✓ All categories have sufficient terms for quizzes${colors.reset}`);
  } else {
    console.log(`   ${colors.yellow}⚠ Some categories need more terms${colors.reset}`);
  }

  // Extract metadata
  const termCount = batch.terms.length;
  const categories = [...new Set(batch.terms.map(t => t.category))];

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    termCount,
    categories,
  };
}

/**
 * Print validation results
 */
function printResults(filePath: string, result: ValidationResult): void {
  console.log(`\n${colors.blue}${'═'.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}VALIDATION SUMMARY${colors.reset}`);
  console.log(`${colors.blue}${'═'.repeat(80)}${colors.reset}\n`);

  console.log(`File: ${filePath}`);
  console.log(`Terms: ${result.termCount}`);
  console.log(`Categories: ${result.categories.join(', ')}\n`);

  if (result.errors.length > 0) {
    console.log(`${colors.red}${colors.bright}❌ ERRORS (${result.errors.length}):${colors.reset}`);
    result.errors.forEach((error, i) => {
      console.log(`${colors.red}  ${i + 1}. ${error}${colors.reset}`);
    });
    console.log();
  }

  if (result.warnings.length > 0) {
    console.log(`${colors.yellow}${colors.bright}⚠️  WARNINGS (${result.warnings.length}):${colors.reset}`);
    result.warnings.forEach((warning, i) => {
      console.log(`${colors.yellow}  ${i + 1}. ${warning}${colors.reset}`);
    });
    console.log();
  }

  if (result.valid && result.warnings.length === 0) {
    console.log(`${colors.green}${colors.bright}✅ VALIDATION PASSED - No errors or warnings!${colors.reset}\n`);
  } else if (result.valid) {
    console.log(`${colors.green}${colors.bright}✅ VALIDATION PASSED - No errors (${result.warnings.length} warning(s))${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}❌ VALIDATION FAILED${colors.reset}\n`);
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(`${colors.red}Usage: npm run validate:batch <file-path>${colors.reset}`);
    console.error(`${colors.yellow}Example: npm run validate:batch data/batches/2025-10-30-batch-000.json${colors.reset}`);
    process.exit(1);
  }

  const filePath = args[0];

  if (!fs.existsSync(filePath)) {
    console.error(`${colors.red}Error: File not found: ${filePath}${colors.reset}`);
    process.exit(1);
  }

  const result = validateBatch(filePath);
  printResults(filePath, result);

  // Exit with appropriate code
  if (!result.valid) {
    process.exit(1);
  } else if (result.warnings.length > 0) {
    process.exit(0); // Warnings don't fail the build
  } else {
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { validateBatch, ValidationResult };
