/**
 * Handlebars custom helpers for the shell template.
 */
import Handlebars from 'handlebars';

/**
 * JSON.stringify helper — for embedding safe JSON in <script> tags.
 * Usage: {{{json courseData}}}
 */
export function registerHelpers() {
  Handlebars.registerHelper('json', function (context) {
    return JSON.stringify(context, null, 2);
  });

  // eq helper for conditional rendering if needed later
  Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
  });
}

/**
 * Compile a Handlebars template from a raw string and render it with the
 * given context. Returns the rendered HTML string.
 */
export function renderTemplate(templateSource, context) {
  registerHelpers();
  const template = Handlebars.compile(templateSource, {
    strict: true,          // throw on missing properties
    preventIndent: true,   // preserve indentation in inline partials
  });
  return template(context);
}

/**
 * Validate that all expected keys in context are present and non-empty.
 * Returns an array of warning messages (empty array = all good).
 */
export function validateContext(context, requiredKeys, optionalKeys = []) {
  const warnings = [];
  for (const key of requiredKeys) {
    const val = context[key];
    if (val === undefined || val === null) {
      warnings.push(`Missing required template variable: ${key}`);
    } else if (typeof val === 'string' && val.trim() === '') {
      warnings.push(`Template variable is empty: ${key}`);
    }
  }
  if (optionalKeys.length > 0) {
    for (const key of optionalKeys) {
      if (context[key] === undefined || context[key] === null) {
        warnings.push(`Optional template variable missing: ${key}`);
      }
    }
  }
  return warnings;
}
