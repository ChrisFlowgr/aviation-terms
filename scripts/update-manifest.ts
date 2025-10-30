/**
 * Update Manifest Script
 *
 * Updates data/manifest.json with metadata from a batch file
 */

import * as fs from 'fs';
import * as path from 'path';
import type { GlossaryBatch, BatchManifest, BatchManifestEntry } from '../packages/shared/src/types/glossary.generated';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Load JSON file
 */
function loadJsonFile<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save JSON file with pretty formatting
 */
function saveJsonFile(filePath: string, data: any): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Extract batch ID from filename
 */
function extractBatchId(filePath: string): string {
  const filename = path.basename(filePath, '.json');
  return filename;
}

/**
 * Create manifest entry from batch file
 */
function createManifestEntry(batchPath: string, batch: GlossaryBatch): BatchManifestEntry {
  const batchId = extractBatchId(batchPath);

  // Extract unique categories
  const categories = [...new Set(batch.terms.map(t => t.category))];

  return {
    id: batchId,
    path: path.relative(process.cwd(), batchPath).replace(/\\/g, '/'),
    createdAt: new Date().toISOString(),
    termCount: batch.terms.length,
    categories: categories as any,
  };
}

/**
 * Sort manifest entries by date (newest first)
 */
function sortManifest(manifest: BatchManifest): BatchManifest {
  return {
    batches: manifest.batches.sort((a, b) => {
      // Sort by createdAt descending (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }),
  };
}

/**
 * Update manifest with a new batch
 */
function updateManifest(batchPath: string): void {
  console.log(`${colors.cyan}${colors.bright}Updating Manifest${colors.reset}\n`);

  // Load batch file
  console.log(`1️⃣  Loading batch file: ${batchPath}`);
  const batch = loadJsonFile<GlossaryBatch>(batchPath);
  console.log(`   ${colors.green}✓ Loaded ${batch.terms.length} term(s)${colors.reset}\n`);

  // Load manifest
  const manifestPath = path.join(process.cwd(), 'data/manifest.json');
  console.log(`2️⃣  Loading manifest: ${manifestPath}`);

  let manifest: BatchManifest;
  if (fs.existsSync(manifestPath)) {
    manifest = loadJsonFile<BatchManifest>(manifestPath);
    console.log(`   ${colors.green}✓ Loaded manifest with ${manifest.batches.length} batch(es)${colors.reset}\n`);
  } else {
    console.log(`   ${colors.yellow}⚠ Manifest not found, creating new one${colors.reset}\n`);
    manifest = { batches: [] };
  }

  // Create manifest entry
  console.log(`3️⃣  Creating manifest entry`);
  const entry = createManifestEntry(batchPath, batch);
  console.log(`   ${colors.blue}Batch ID: ${entry.id}${colors.reset}`);
  console.log(`   ${colors.blue}Path: ${entry.path}${colors.reset}`);
  console.log(`   ${colors.blue}Terms: ${entry.termCount}${colors.reset}`);
  console.log(`   ${colors.blue}Categories: ${entry.categories.join(', ')}${colors.reset}\n`);

  // Check if batch already exists
  const existingIndex = manifest.batches.findIndex(b => b.id === entry.id);
  if (existingIndex >= 0) {
    console.log(`   ${colors.yellow}⚠ Batch ${entry.id} already exists, updating${colors.reset}`);
    manifest.batches[existingIndex] = entry;
  } else {
    console.log(`   ${colors.green}✓ Adding new batch to manifest${colors.reset}`);
    manifest.batches.push(entry);
  }

  // Sort manifest
  console.log(`\n4️⃣  Sorting manifest by date`);
  manifest = sortManifest(manifest);
  console.log(`   ${colors.green}✓ Sorted${colors.reset}\n`);

  // Save manifest
  console.log(`5️⃣  Saving manifest`);
  saveJsonFile(manifestPath, manifest);
  console.log(`   ${colors.green}✓ Manifest saved to ${manifestPath}${colors.reset}\n`);

  // Summary
  console.log(`${colors.green}${colors.bright}✅ Manifest updated successfully!${colors.reset}`);
  console.log(`${colors.blue}Total batches: ${manifest.batches.length}${colors.reset}\n`);
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(`${colors.yellow}Usage: npm run update-manifest <batch-file-path>${colors.reset}`);
    console.error(`${colors.yellow}Example: npm run update-manifest data/batches/2025-10-30-batch-001.json${colors.reset}`);
    process.exit(1);
  }

  const batchPath = args[0];

  if (!fs.existsSync(batchPath)) {
    console.error(`${colors.yellow}Error: Batch file not found: ${batchPath}${colors.reset}`);
    process.exit(1);
  }

  try {
    updateManifest(batchPath);
  } catch (error) {
    console.error(`${colors.yellow}Error updating manifest: ${error}${colors.reset}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { updateManifest };
