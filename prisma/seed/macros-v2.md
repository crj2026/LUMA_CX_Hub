# [BRAND_NAME] Macros — Template

PLACEHOLDER macro library. These seed the Knowledge Base (Playbook macros).
Replace with the brand's real macros. Format rules:

- Top-level category header: `# CATEGORY (count)` — recognised categories:
  SAFETY, PRODUCT, PRODUCT QUALITY, VALUE, RESULTS, SHIPPING, SUBSCRIPTION,
  PARTNERSHIP. Anything else is kept as-is.
- Macro header: `### MACRO: Slug_Name` (the `MACRO:` prefix is optional).
- Optional metadata lines: `**When:** ...`, `**Before sending:** ...`,
  `**Note:** ...`, `**Escalation:** ...`.
- Body is a blockquote (`> ...`).
- Separate each macro with `---`.
- Write everything in the brand's tone of voice (see lib/tone-of-voice.js).

---

# SAFETY (1)

### MACRO: Adverse_Reaction
**When:** [Any safety report — describe the triggers for this brand.]
**Before sending:** [Required internal steps — e.g. escalate to Manager, process refund, do not diagnose.]

> Hi [Name],
>
> [Acknowledgement line.]
>
> [What you've done for them — e.g. refund / cancellation, no return needed.]
>
> [Defer to a professional where appropriate.]
>
> [Sign-off],
> The [BRAND_NAME] team

---

# PRODUCT (1)

### MACRO: Product_How_To_Use
**When:** [Customer asks how to use a product.]

> Hi [Name],
>
> [Clear, friendly how-to-use guidance for the product.]
>
> [Offer further help.]
>
> [Sign-off],
> The [BRAND_NAME] team

---

# SHIPPING (1)

### MACRO: Where_Is_My_Order
**When:** [Customer asking where their order is / delay.]

> Hi [Name],
>
> [Acknowledge + give a concrete next step or ETA.]
>
> [Reassure — you won't leave them chasing.]
>
> [Sign-off],
> The [BRAND_NAME] team

---

# SUBSCRIPTION (1)

### MACRO: Cancel_Save
**When:** [Customer wants to cancel a subscription.]
**Note:** [Understand the reason first, then offer one matched save play.]

> Hi [Name],
>
> [Acknowledge + ask the one question that uncovers the real reason, or offer the matched save.]
>
> [Make cancelling easy if they insist.]
>
> [Sign-off],
> The [BRAND_NAME] team

---
