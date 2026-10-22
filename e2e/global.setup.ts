import { clerkSetup } from "@clerk/testing/playwright";

// Lets the signed-in tests get past Clerk's bot protection. It needs the Clerk keys in the
// environment; without them the signed-in tests skip themselves and everything else still runs.
export default async function globalSetup() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!process.env.CLERK_SECRET_KEY || !publishableKey) return;
  await clerkSetup({ publishableKey });
}
