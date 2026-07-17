// A tiny mustache-flavored template helper for email bodies — no heavy template dependency.
// `{{ var }}` interpolates HTML-escaped (safe by default); `{{{ var }}}` interpolates raw.
// On-device safe: pure string work, no `node:` import.

/** Values a template var may hold. Nullish renders as an empty string. */
export type TemplateValue = string | number | boolean | null | undefined

/** The variable bag passed to {@link renderTemplate}. */
export type TemplateVars = Record<string, TemplateValue>

/** HTML-escape the five significant characters so interpolated data can't inject markup. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Coerce a template value to its string form; nullish ⇒ empty string. */
function stringify(value: TemplateValue): string {
  return value === null || value === undefined ? '' : String(value)
}

/**
 * Substitute `{{ name }}` (escaped) and `{{{ name }}}` (raw) placeholders in `template` from
 * `vars`. Triple-brace tokens are resolved first so a raw value is never double-processed. Unknown
 * names render as empty. Whitespace inside the braces is ignored; names accept word chars, `.` and
 * `$`.
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template
    .replace(/\{\{\{\s*([\w.$]+)\s*\}\}\}/g, (_match, name: string) => stringify(vars[name]))
    .replace(/\{\{\s*([\w.$]+)\s*\}\}/g, (_match, name: string) =>
      escapeHtml(stringify(vars[name])),
    )
}
