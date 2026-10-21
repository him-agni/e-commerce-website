import type { Metadata } from "next";
import { Container } from "@/components/site/container";
import { WishlistView } from "@/components/wishlist/wishlist-view";

export const metadata: Metadata = {
  title: "Your wishlist",
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return (
    <Container className="py-12">
      <h1 className="blur-in mb-8 text-4xl">Your wishlist</h1>
      <WishlistView />
    </Container>
  );
}
