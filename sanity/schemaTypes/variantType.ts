import { defineField, defineType } from "sanity";

type ProductDoc = { designs?: { name?: string }[] };

export const variantType = defineType({
  name: "variant",
  title: "Variant",
  type: "object",
  fields: [
    defineField({ name: "color", type: "string" }),
    defineField({ name: "size", type: "string" }),
    defineField({
      name: "design",
      type: "string",
      description: "Must match one of this product's design names. Leave empty if none.",
      validation: (rule) =>
        rule.custom((value, context) => {
          if (!value) return true;
          const designs = (context.document as ProductDoc | undefined)?.designs;
          return designs?.some((d) => d.name === value)
            ? true
            : "No design with this name on the product";
        }),
    }),
    defineField({
      name: "price",
      title: "Price (USD cents)",
      type: "number",
      description: "Whole cents: $1,299.00 is 129900.",
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: "stock",
      type: "number",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: "sku",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "image",
      type: "image",
      description: "Optional. Shown when this variant is selected.",
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: {
      color: "color",
      size: "size",
      design: "design",
      price: "price",
      stock: "stock",
      media: "image",
    },
    prepare({ color, size, design, price, stock, media }) {
      const label = [color, size, design].filter(Boolean).join(" / ") || "Default";
      const dollars = typeof price === "number" ? `$${(price / 100).toFixed(2)}` : "no price";
      return { title: label, subtitle: `${dollars} · ${stock ?? 0} in stock`, media };
    },
  },
});
