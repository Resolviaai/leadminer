# LeadMiner workbook audit

**Reviewed file:** `LeadMiner.xlsx`  
**Review date:** 2026-09-15  
**Method:** read-only structural and data-quality inspection. The workbook was not changed.

## Executive finding

The workbook preserves a strong keyword-generation taxonomy and a partial intended lead schema. It does not preserve a complete automation system, a reliable worker checkpoint, or the compliance/audit controls needed for a new platform.

It contains 12 worksheets: five visible operational sheets and seven hidden source, formula, or support sheets. There are no tables, named ranges, external links, macros, pivot tables, charts, or connection definitions that would recover the lost n8n workflow.

## Worksheet inventory

| Worksheet | Visibility | Observed role | Reuse decision |
| --- | --- | --- | --- |
| `lead` | Visible | Historic channel export: `channelId`, title, subscriber count, video count, description, email | Confidential reference only; never import operationally |
| `M1-Keywords` | Visible | Earlier flat keyword corpus and partial queue columns | Potential offline keyword reference after compliant sourcing decision |
| `M2-leads` | Visible | Empty intended lead schema, including social fields and `sourceKeyword` | Schema reference only |
| `all modifiers` | Hidden | 23 category-to-comma-separated-modifier records | Reference only; normalized `modifiers` is the better source |
| `Sheet8` | Hidden | Legacy 112-entity list with blank category values | Do not use as a canonical source |
| `clean` | Hidden | Google Sheets spill/formula helper for the legacy list | Do not use |
| `Sheet10` | Hidden | Canonical category/entity mapping | Reusable taxonomy after compliant sourcing decision |
| `modifiers` | Hidden | Canonical category/modifier mapping | Reusable taxonomy after compliant sourcing decision |
| `Keywords` | Hidden | Generated category/entity/modifier combinations | Reference; regenerate deterministically, do not execute sheet formulas |
| `UniqueKeywords` | Hidden | Unique-keyword spill output | Reference/materialized value source only |
| `M2-Keywords` | Visible | Main keyword queue | Potential offline keyword reference after compliant sourcing decision |
| `Config` | Visible | Single `startRow = 2` setting | Do not reuse as job state |

## Lead and outreach evidence

`lead` has 50 unique channel IDs. Forty-seven records have a description, and 14 contain an email value. It has no duplicate channel ID or email value in this small export.

The planned `M2-leads` header expands the earlier export with Instagram, Twitter, TikTok, Discord, website, and `sourceKeyword`, but it has no lead records.

Neither structure includes the minimum future audit fields below:

- Source/provider, source locator, source-acquired timestamp, and data-freshness timestamp
- Contact-extraction source and extracted timestamp
- Verification provider, result, confidence, raw result, and checked timestamp
- Qualification reason, consent/legal-basis record where applicable, and suppression/opt-out state
- Campaign, template version, personalization source, sending-account ID, Gmail message/thread IDs, and idempotency key
- Delivery, reply, unsubscribe, retry, failure, and notification audit records

Treat every historic channel, description, and email as confidential legacy data with unknown provenance. It must not be moved to a new database, campaign, test environment, or external service.

## Keyword architecture recovered

The core generator is a three-part taxonomy:

```text
Category + Entity + Modifier -> Keyword -> Normalized Keyword -> Unique Keyword queue
```

- `Sheet10` has 2,786 category/entity records across 23 categories.
- `modifiers` has 302 category/modifier records. Only 232 distinct category/modifier pairs are represented in the generated `Keywords` output; the remaining mappings do not match the active entity categories.
- `Keywords` has 28,310 raw generated combinations and 25,391 normalized unique keywords. Normalization removes 2,919 duplicate combinations.
- `M2-Keywords` contains all 25,391 generated keywords and is separate from `M1-Keywords` (1,222 populated entries, one normalized duplicate, and no overlap with M2).

The main M2 queue has 25,391 `Pending` keyword records. Its only `Done` marker sits on row 25,393 without a keyword and carries the only recorded `Last Run` value (`2026-05-15T12:53:45.497Z`). It is an orphan footer, not a valid job checkpoint. `Channels Found` and `Score` are empty throughout M1 and M2.

## Formula and data-quality limitations

`clean`, `Keywords`, and `UniqueKeywords` depend on Google Sheets `FILTER`, `REGEXREPLACE`, and array/spill behavior. In this XLSX export, those formulas are represented as Excel dummy/array formulas with cached values. They should not be recalculated or extended in Excel.

If a compliant source is selected later, rebuild the generator outside the workbook using normalized category/entity/modifier imports and explicit deterministic normalization. Preserve category, entity, modifier, and generated-keyword provenance in the new import model.

## Reuse boundary

**Potentially reusable after the sourcing blocker is resolved:** keyword lists, the category/entity/modifier taxonomy, and the empty M2 lead-column set as a starting reference.

**Reference only:** generated-sheet outputs and the M2 lead schema.

**Never reuse operationally under the current project decision:** historic channel metadata, descriptions, emails, social/contact data, and the orphan completion marker.
