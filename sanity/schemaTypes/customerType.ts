import { defineField, defineType } from "sanity";

export const customerType = defineType({
  name: "customer",
  title: "Customer",
  type: "document",
  description:
    "Identifiers only. This dataset is publicly readable, so names, emails and addresses are " +
    "never stored here; they stay in Stripe and Clerk.",
  fields: [
    defineField({
      name: "clerkUserId",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "stripeCustomerId", type: "string" }),
  ],
  preview: { select: { title: "clerkUserId", subtitle: "stripeCustomerId" } },
});
