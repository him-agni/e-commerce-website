import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";

// Called by a Sanity webhook whenever a product or category is published, changed or deleted.
// It clears the matching cached data so the live site shows the edit without a rebuild.
// Webhook setup (projection and secret) is described in docs/deploy.md.

type Payload = { _type?: string; slug?: string | null };

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    console.error("SANITY_REVALIDATE_SECRET is not set; cannot verify Sanity webhooks");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // Also waits briefly for Sanity's content lake to be consistent, so the refetch sees the edit.
  const { isValidSignature, body } = await parseBody<Payload>(request, secret, true);
  if (!isValidSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  if (!body?._type) {
    return NextResponse.json({ error: "Missing document type" }, { status: 400 });
  }

  const tags: string[] = [];
  if (body._type === "product") {
    tags.push("products");
    if (body.slug) tags.push(`product:${body.slug}`);
  } else if (body._type === "category") {
    // Products embed their category, so both lists can change.
    tags.push("categories", "products");
  } else {
    return NextResponse.json({ ignored: body._type });
  }

  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ revalidated: tags });
}
