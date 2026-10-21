import { defineField, defineType } from "sanity";

export const customerType = defineType({
  name: "customer",
  title: "Customer",
  type: "document",
  fields: [
    defineField({
      name: "clerkUserId",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "name", type: "string" }),
    defineField({ name: "stripeCustomerId", type: "string" }),
  ],
  preview: { select: { title: "name", subtitle: "email" } },
});
