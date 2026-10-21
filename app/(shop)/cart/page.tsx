import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <Container className="py-12">
      <h1 className="mb-8 text-4xl">Your cart</h1>
      <CartView />
    </Container>
  );
}
