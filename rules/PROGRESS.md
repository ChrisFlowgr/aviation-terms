# Content Generation Progress

Track completed and upcoming term batches here. Keep prompts tiny - titles only.

---

## Done ✅

### Batch 000 (2025-10-30) - Sample/Test Batch
- Flight Level
- METAR

**Status:** ✅ Validated
**Categories:** Navigation, Weather
**Purpose:** Dry run to test validation tooling

---

## Up Next 📋

### Suggested Priorities:

**Category: Navigation** (Currently 309 total terms - well populated)
- Consider expansion with advanced navigation concepts
- RNAV procedures
- RVSM (Reduced Vertical Separation Minima)
- Performance-Based Navigation (PBN)

**Category: Safety** (Consider expansion)
- EGPWS (Enhanced Ground Proximity Warning System)
- TAWS features
- ACAS (Airborne Collision Avoidance System)
- Emergency procedures reference

**Category: Performance** (Under-represented)
- V-speeds (V1, VR, V2, VREF, etc.)
- Takeoff performance
- Landing performance
- Climb performance
- Descent planning

**Category: Weather** (Expand meteorological concepts)
- TAF (Terminal Aerodrome Forecast)
- SIGMET/AIRMET
- Icing conditions
- Turbulence types
- Wind shear

**New Categories to Populate** (Need 4+ terms each):
- [ ] Procedures - Add standard operating procedures
- [ ] Equipment - General aviation equipment
- [ ] System Controls - Cockpit control systems

---

## Statistics

### Current Glossary Size:
- **Total Terms:** 311 (309 existing + 2 in batch-000)
- **Total Categories:** 26
- **Average Terms per Category:** ~12

### Category Health (4+ terms = quiz-ready):
- ✅ All major categories have 4+ terms
- ⚠️ Some specialized categories may benefit from expansion

---

## Batch Naming Convention

```
YYYY-MM-DD-batch-###.json
```

Examples:
- `2025-10-30-batch-000.json` (test/sample)
- `2025-11-01-batch-001.json` (first production batch)
- `2025-11-15-batch-002.json` (second production batch)

---

## Notes

- Keep batches focused (4-8 terms per batch recommended)
- Ensure quality over quantity
- Group related terms in same batch when possible
- Validate before committing: `npm run validate:batch data/batches/your-batch.json`

---

**Last Updated:** 2025-10-30
**Next Batch ID:** 001
