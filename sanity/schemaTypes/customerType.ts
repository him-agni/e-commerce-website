import { defineField, defineType } from "sanity";

export const customerType = defineType({
  name: "customer",
  title: "Customer",
  type: "document",
  description:
    "Only a random key that links one person's orders together. This dataset is publicly readable, " +
    "so names, emails, addresses and even the real user id are never stored here; they stay in " +
    "Clerk and Stripe. The key is made by the server with a secret and cannot be traced to an account.",
  fields: [
    defineField({
      name: "userKey",
      type: "string",
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: "userKey" } },
});
