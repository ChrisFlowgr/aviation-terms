# Content Generation Rules

These are the **non-negotiable** requirements for generating Flight Manager glossary content. All batches must comply 100%.

---

## 1. Plain Text Only

✅ **REQUIRED:** All section content must be plain text
❌ **FORBIDDEN:** Markdown, HTML, or any special formatting

### Examples:

**❌ WRONG:**
```json
"content": "The **autopilot** uses *sensors* to maintain flight path."
```

**✅ CORRECT:**
```json
"content": "The autopilot uses sensors to maintain flight path."
```

### Why:
- Quiz sanitizer strips formatting anyway
- Renders inconsistently across web/mobile
- Search indexing works better with plain text

---

## 2. No Quiz Questions

✅ **REQUIRED:** Create high-quality glossary terms only
❌ **FORBIDDEN:** Creating quiz questions or Q&A pairs

### Why:
Quizzes are **auto-generated** from terms:
- 2 questions per term (definition-to-term, term-to-definition)
- Exactly 4 options (1 correct + 3 deterministic distractors)
- Single-select only
- Options sorted alphabetically

Your job: Write clear, concise definitions that make good quiz prompts.

---

## 3. Schema Compliance

✅ **REQUIRED:** Match `schemas/batch.schema.json` exactly
❌ **FORBIDDEN:** Additional fields, different structures, or deviations

### Validate with:
```bash
npm run validate:batch data/batches/your-batch.json
```

All batches must pass:
1. JSON Schema validation (AJV)
2. Zod runtime validation
3. Cross-reference checks
4. Quiz requirement checks

---

## 4. Valid Categories

✅ **REQUIRED:** Use categories from the enum (case-sensitive)
❌ **FORBIDDEN:** Creating new categories, typos, or variations

### Valid Categories (26 total):

```
Navigation
Weather
Communication
Safety
Performance
Flight Controls
Navigation Systems
Equipment
Procedures
Electrical Systems
Electrical
Pneumatic Systems
Environmental Systems
Ice Protection Systems
Cargo Systems
Hydraulic Systems
Communication Systems
Lighting Systems
Cabin Systems
Fire Protection Systems
Flight Instruments
Engine Systems
System Controls
Safety Equipment
Communications
Landing Gear
```

**Note:** Categories are case-sensitive. "navigation" ≠ "Navigation"

---

## 5. Kebab-Case IDs

✅ **REQUIRED:** IDs must be kebab-case (lowercase with hyphens)
❌ **FORBIDDEN:** Spaces, underscores, camelCase, or other formats

### Pattern:
```regex
^[a-z0-9]+(-[a-z0-9]+)*$
```

### Examples:

**✅ CORRECT:**
- `flight-level`
- `instrument-landing-system`
- `pack-control-selectors`
- `tcas`
- `vor-receiver`

**❌ WRONG:**
- `flight_level` (underscore)
- `flightLevel` (camelCase)
- `Flight-Level` (capital letters)
- `flight level` (spaces)
- `ILS` (all caps - use `ils`)

---

## 6. Definition Length

✅ **RECOMMENDED:** Keep `whatItIs` between 100-300 characters
⚠️ **WARNING:** Definitions over 240 characters will be truncated in quizzes

### Why:
- Quiz prompts truncate at 240 chars (`${definition.slice(0, 237)}...`)
- Shorter definitions = better quiz experience
- Forces clarity and concision

### Good Length:
```json
"whatItIs": {
  "content": "A standard nominal altitude of an aircraft, in hundreds of feet, based on a standardized air pressure at sea level (29.92 inches Hg/1013.2 hPa)."
}
```
*(152 characters - perfect)*

---

## 7. Official Sources Only

✅ **REQUIRED:** Content must come from authoritative sources
❌ **FORBIDDEN:** Wikipedia, ChatGPT hallucinations, or unofficial sources

### Approved Sources:
- **FAA** (Federal Aviation Administration)
  - FAA Handbooks (PHAK, AFH, IFH, etc.)
  - AIM (Aeronautical Information Manual)
  - FARs (Federal Aviation Regulations)

- **EASA** (European Aviation Safety Agency)
  - CS-25 (Certification Specifications)
  - AMC/GM (Acceptable Means of Compliance)

- **ICAO** (International Civil Aviation Organization)
  - Annexes
  - Doc 8168 (PANS-OPS)

- **Manufacturer Documentation**
  - Boeing FCOM, QRH
  - Airbus FCOM, QRH
  - (Only from official public manuals)

### Verification:
- Include source in commit message or batch notes
- Be prepared to provide citations if asked

---

## 8. Minimum Terms Per Category

✅ **REQUIRED:** Categories need **4+ terms** for quiz generation
⚠️ **WARNING:** Validator will warn if category has < 4 terms total

### Why:
Quiz algorithm needs:
- 1 term for the question
- 3 terms for distractors

### Strategy:
If introducing a new category, add **at least 4 terms** in that batch or next.

---

## 9. Unique IDs Globally

✅ **REQUIRED:** All term IDs must be unique across entire glossary
❌ **FORBIDDEN:** Duplicate IDs (will cause validation errors)

### Check Before Creating:
```bash
# Search existing terms
grep -r "\"id\": \"your-term-id\"" packages/web/src/features/glossary/
```

Or check `data/manifest.json` after merging previous batches.

---

## 10. ISO 8601 Timestamps

✅ **REQUIRED:** `createdAt` and `updatedAt` must be ISO 8601 format
❌ **FORBIDDEN:** Unix timestamps, custom formats, or invalid dates

### Format:
```
YYYY-MM-DDTHH:mm:ss.sssZ
```

### Examples:

**✅ CORRECT:**
- `2024-01-01T00:00:00Z`
- `2025-10-30T14:30:00.000Z`
- `2025-12-31T23:59:59Z`

**❌ WRONG:**
- `2024-01-01` (no time)
- `01/01/2024` (wrong format)
- `1704067200` (Unix timestamp)
- `2024-01-01 00:00:00` (space instead of T)

---

## 11. Relationship References

✅ **REQUIRED:** Referenced `termId` must exist in glossary
⚠️ **WARNING:** Validator checks cross-references

### Valid Relationship Types:
- `broader` - This term is more general (parent)
- `narrower` - This term is more specific (child)
- `related` - This term is related (sibling)
- `seeAlso` - See also this term (alternative/similar)

### Example:
```json
"relationships": [
  {
    "termId": "autopilot-system",
    "type": "related",
    "description": "Autopilot uses flight director guidance"
  }
]
```

**Note:** `autopilot-system` must exist in the glossary, or validator will error.

---

## 12. Tags Best Practices

✅ **RECOMMENDED:** 3-7 tags per term
✅ **REQUIRED:** Tags must be lowercase with hyphens

### Pattern:
```regex
^[a-z0-9-]+$
```

### Good Tags:
```json
"tags": ["altitude", "navigation", "safety", "pressurization", "flight-instruments"]
```

### Categories to Cover:
- **System:** electrical, hydraulic, pneumatic, etc.
- **Function:** navigation, communication, control, monitoring
- **Phase:** takeoff, cruise, landing, taxi
- **Discipline:** safety, performance, weather, procedures

---

## 13. Synonyms Completeness

✅ **RECOMMENDED:** Include all common abbreviations and alternative names
❌ **AVOID:** Synonyms that are too generic or unrelated

### Good Example:
```json
// For "Instrument Landing System"
"synonyms": ["ILS", "Precision Approach", "CAT I/II/III Approach", "Localizer/Glideslope"]
```

### Why:
- Improves search results (Fuse.js searches synonyms with 0.2 weight)
- Helps users find terms by abbreviation
- Supports learning (seeing multiple names reinforces understanding)

---

## 14. Content Tone & Style

✅ **REQUIRED:** Professional, factual, technical aviation language
❌ **FORBIDDEN:** Casual tone, slang, or overly simplistic explanations

### Good Style:
```
"A ground-based instrument approach system that provides precision
guidance to aircraft approaching and landing on a runway, consisting
of localizer (lateral guidance) and glideslope (vertical guidance) signals."
```

### Bad Style:
```
"ILS is basically a super cool system that helps pilots land when
they can't see the runway. It's like GPS but for landing!"
```

### Guidelines:
- Use aviation terminology correctly
- Assume reader has basic aviation knowledge
- Define acronyms on first use within a section
- Be precise with technical specifications

---

## 15. Required vs Optional Sections

### Required:
- ✅ `sections.whatItIs` - Always required

### Optional (but recommended):
- `sections.location` - Where it is in the aircraft
- `sections.howItWorks` - How the system functions
- `sections.whatYouShouldDo` - Operational procedures
- `sections.troubleshooting` - Problem-solving steps

### When to Use Optional Sections:

**Use `location`** for:
- Cockpit controls and switches
- Physical components
- Installed equipment

**Use `howItWorks`** for:
- Systems and mechanisms
- Concepts that have a process
- Anything with functional behavior

**Use `whatYouShouldDo`** for:
- Operating procedures
- Normal usage
- Best practices

**Use `troubleshooting`** for:
- Potential failures
- Warning signs
- Corrective actions

---

## Validation Checklist

Before submitting a batch, verify:

- [ ] All text is plain (no markdown/HTML)
- [ ] No quiz questions created
- [ ] Schema validation passes (`npm run validate:batch`)
- [ ] Categories match enum exactly
- [ ] IDs are kebab-case and unique
- [ ] Definitions are 100-300 characters
- [ ] Sources are official (FAA/EASA/ICAO/Manufacturer)
- [ ] Category has 4+ terms total
- [ ] Timestamps are ISO 8601
- [ ] Relationship `termId`s exist
- [ ] Tags are lowercase-with-hyphens
- [ ] Synonyms include all common abbreviations
- [ ] Tone is professional and technical

---

## Quick Reference

| Rule | Requirement |
|------|-------------|
| Text Format | Plain text only (no markdown) |
| Quizzes | Auto-generated (don't create) |
| Schema | Must match `schemas/batch.schema.json` |
| Categories | Use exact enum (case-sensitive) |
| IDs | kebab-case, unique globally |
| Definition Length | 100-300 chars recommended |
| Sources | Official only (FAA/EASA/ICAO/Mfg) |
| Category Minimum | 4+ terms for quizzes |
| Timestamps | ISO 8601 format |
| Relationships | `termId` must exist |
| Tags | lowercase-with-hyphens |
| Tone | Professional, technical |

---

**Last Updated:** 2025-10-30
**Schema Version:** 1.0
**Validator:** `scripts/validate-batch.ts`
