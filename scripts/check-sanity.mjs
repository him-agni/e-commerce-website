import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2025-01-01",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

const count = await client.fetch("count(*)");
console.log("read ok, documents in dataset:", count);
const doc = await client.create({ _type: "category", title: "__connection_test__" });
await client.delete(doc._id);
console.log("write ok (test doc created and deleted)");
