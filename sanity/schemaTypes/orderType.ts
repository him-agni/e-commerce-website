import { defineArrayMember, defineField, defineType } from "sanity";

export const orderType = defineType({
  name: "order",
  title: "Order",
  type: "document",
  fields: [
    defineField({
      name: "orderNumber",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "customer",
      type: "reference",
      to: [{ type: "customer" }],
    }),
    defineField({
      name: "items",
      description:
        "Snapshot at purchase time, so later price or name edits do not change old orders.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "orderItem",
          fields: [
            defineField({ name: "productName", type: "string" }),
            defineField({ name: "variantLabel", type: "string" }),
            defineField({ name: "sku", type: "string" }),
            defineField({
              name: "unitPrice",
              title: "Unit price (USD cents)",
              type: "number",
            }),
            defineField({ name: "quantity", type: "number" }),
            defineField({
              name: "product",
              type: "reference",
              to: [{ type: "product" }],
              weak: true,
            }),
          ],
          preview: {
            select: { title: "productName", subtitle: "variantLabel" },
          },
        }),
      ],
    }),
    defineField({
      name: "total",
      title: "Total (USD cents)",
      type: "number",
    }),
    defineField({
      name: "status",
      type: "string",
      initialValue: "paid",
      options: {
        list: ["paid", "shipped", "delivered", "cancelled"],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "shippingAddress",
      type: "object",
      fields: [
        defineField({ name: "name", type: "string" }),
        defineField({ name: "line1", type: "string" }),
        defineField({ name: "line2", type: "string" }),
        defineField({ name: "city", type: "string" }),
        defineField({ name: "state", type: "string" }),
        defineField({ name: "postalCode", type: "string" }),
        defineField({ name: "country", type: "string", initialValue: "US" }),
      ],
    }),
    defineField({ name: "stripeSessionId", type: "string" }),
    defineField({ name: "createdAt", type: "datetime" }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "orderNumber", subtitle: "status" },
  },
});
