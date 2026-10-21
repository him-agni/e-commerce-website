"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";

export function AuthControls() {
  const { isLoaded, isSignedIn } = useUser();

  // Reserve the space so the header does not shift when Clerk finishes loading.
  if (!isLoaded) return <span className="inline-block h-7 w-14" aria-hidden />;

  if (isSignedIn) return <UserButton />;

  return (
    <SignInButton mode="modal">
      <button
        type="button"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        Sign in
      </button>
    </SignInButton>
  );
}
