// A fake test-mode key lets lib/stripe.ts load; no test talks to Stripe.
process.env.STRIPE_SECRET_KEY ??= "sk_test_unit_tests_only";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_unit_tests_only";
process.env.ORDER_ID_SECRET = "orders_unit_tests_only_secret_0123456789abcdef";
process.env.SANITY_REVALIDATE_SECRET = "revalidate_unit_tests_only";
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= "testproject";
process.env.NEXT_PUBLIC_SANITY_DATASET ??= "test";
