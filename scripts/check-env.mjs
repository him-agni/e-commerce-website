// Sanity-checks .env.local without printing secrets: presence, plain-ASCII, key prefix and length.
// Run: npm run check-env
// Catches the usual copy/paste mistakes, e.g. a dashboard's masked "sk_test_…" instead of the real key.

const rules = [
  { name: "NEXT_PUBLIC_SANITY_PROJECT_ID", required: true },
  { name: "NEXT_PUBLIC_SANITY_DATASET", required: true },
  { name: "SANITY_API_WRITE_TOKEN", required: true, minLength: 40 },
  { name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", required: true, prefix: "pk_test_", minLength: 40 },
  { name: "CLERK_SECRET_KEY", required: true, prefix: "sk_test_", minLength: 40 },
  { name: "STRIPE_SECRET_KEY", required: true, prefix: "sk_test_", minLength: 40 },
  { name: "STRIPE_WEBHOOK_SECRET", required: false, prefix: "whsec_", minLength: 20, note: "needed from Phase 4" },
  { name: "GOOGLE_GENERATIVE_AI_API_KEY", required: false, minLength: 20, note: "needed from Phase 5" },
  { name: "UNSPLASH_ACCESS_KEY", required: false, minLength: 20, note: "only for the seed script" },
  { name: "NEXT_PUBLIC_SITE_URL", required: false },
];

let problems = 0;
for (const { name, required, prefix, minLength, note } of rules) {
  const value = process.env[name] ?? "";
  const issues = [];

  if (value === "") {
    if (required) issues.push("missing");
  } else {
    if (/[^\x21-\x7e]/.test(value)) {
      issues.push("contains non-ASCII or whitespace characters (truncated or masked copy?)");
    }
    if (prefix && !value.startsWith(prefix)) issues.push(`should start with ${prefix}`);
    if (minLength && value.length < minLength) {
      issues.push(`only ${value.length} characters, looks truncated`);
    }
  }

  if (issues.length > 0) {
    problems++;
    console.log(`✗ ${name}: ${issues.join("; ")}`);
  } else if (value === "") {
    console.log(`- ${name}: not set${note ? ` (${note})` : ""}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

if (problems > 0) {
  console.log(`\n${problems} problem(s). Fix them in .env.local, then restart the dev server.`);
  process.exit(1);
}
console.log("\nEnvironment looks good.");
