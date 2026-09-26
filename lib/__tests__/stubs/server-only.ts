// Test-environment stub: the real `server-only` package throws if imported
// outside a React Server Component. Under vitest we alias it to this no-op so
// modules that legitimately carry the server-only boundary can still be
// unit-tested.
export {};
