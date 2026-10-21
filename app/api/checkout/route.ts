import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createCheckoutSession, parseLines } from "@/lib/checkout";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to check out." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const lines = parseLines(body?.items);
  if (!lines) {
    return NextResponse.json({ error: "Your cart looks invalid." }, { status: 400 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  try {
    const result = await createCheckoutSession({ lines, userId, email, origin });
    if (!result.ok) {
      return NextResponse.json(
        { error: "Some items in your cart changed.", issues: result.issues },
        { status: 409 },
      );
    }
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("Checkout failed", error);
    return NextResponse.json(
      { error: "We could not start checkout. Please try again." },
      { status: 500 },
    );
  }
}
