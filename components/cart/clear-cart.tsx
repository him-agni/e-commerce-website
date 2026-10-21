"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart/store";

/** Empties the cart once the server has confirmed the payment. Renders nothing. */
export function ClearCart() {
  useEffect(() => {
    useCart.getState().clear();
  }, []);
  return null;
}
