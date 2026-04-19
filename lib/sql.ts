const SIMPLE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const QUALIFIED_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/;

export function quoteIdentifier(identifier: string): string {
  if (!SIMPLE_IDENTIFIER.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

export function quoteQualifiedIdentifier(identifier: string): string {
  if (!QUALIFIED_IDENTIFIER.test(identifier)) {
    throw new Error(`Unsafe SQL qualified identifier: ${identifier}`);
  }
  return identifier
    .split(".")
    .map((part) => quoteIdentifier(part))
    .join(".");
}
