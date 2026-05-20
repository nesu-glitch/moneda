// Prevents formula injection: spreadsheet apps execute cells that start with = + - @.
// Prefixing with a single quote neutralises execution without altering the displayed value.
export function sanitizeCellValue(value) {
  if (typeof value === "string" && /^[=+\-@]/.test(value)) {
    return "'" + value;
  }
  return value;
}
