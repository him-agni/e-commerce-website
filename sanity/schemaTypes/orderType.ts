import { defineArrayMember, defineField, defineType } from "sanity";

export const orderType = defineType({
  name: "order",
  title: "Order",
  type: "document",
  description:
    "This dataset is publicly readable, so no personal details are stored on orders. " +
    "The shipping address and email live in Stripe; the server finds them with the encrypted session reference below.",
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
      name: "sessionRef",
      title: "Stripe session (encrypted)",
      description: "The Stripe Checkout session id, encrypted by the server. Not readable or editable here.",
      type: "string",
      readOnly: true,
    }),
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
