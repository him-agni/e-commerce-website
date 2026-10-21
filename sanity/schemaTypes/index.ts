import type { SchemaTypeDefinition } from "sanity";
import { categoryType } from "./categoryType";
import { customerType } from "./customerType";
import { orderType } from "./orderType";
import { productType } from "./productType";
import { variantType } from "./variantType";

export const schemaTypes: SchemaTypeDefinition[] = [
  categoryType,
  productType,
  variantType,
  customerType,
  orderType,
];
