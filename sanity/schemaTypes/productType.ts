import { defineArrayMember, defineField, defineType } from "sanity";

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name" },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "description", type: "text", rows: 4 }),
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "category" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tags",
      title: "Hashtags",
      description:
        "Groups products inside a category, for example accent-chair or tv-stand. They show as " +
        "#accent-chair on the product, and become filter pills and pages inside the category. " +
        "Lowercase letters, numbers and dashes only.",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
      validation: (rule) =>
        rule.unique().custom((tags) =>
          (tags as string[] | undefined)?.every((t) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(t))
            ? true
            : "Use lowercase letters, numbers and single dashes, like accent-chair",
        ),
    }),
    defineField({ name: "material", type: "string" }),
    defineField({
      name: "images",
      type: "array",
      of: [defineArrayMember({ type: "image", options: { hotspot: true } })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "designs",
      title: "Designs",
      description: "Style options for this product, e.g. slatted or paneled headboard.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "design",
          fields: [
            defineField({
              name: "name",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "image",
              type: "image",
              options: { hotspot: true },
            }),
          ],
          preview: { select: { title: "name", media: "image" } },
        }),
      ],
    }),
    defineField({
      name: "variants",
      description: "Each combination of color, size and design that can be bought.",
      type: "array",
      of: [defineArrayMember({ type: "variant" })],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "category.title", media: "images.0" },
  },
});
