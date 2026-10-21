import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <div className="flex justify-center px-4 py-16">
      <Suspense>
        <SignUp />
      </Suspense>
    </div>
  );
}
