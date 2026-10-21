import Link from "next/link";
import { getCategoryTags } from "@/lib/sanity/data";
import { AuthControls } from "./auth-controls";
import { CartLink } from "./cart-link";
import { WishlistLink } from "./wishlist-link";
import { CategoriesMenu } from "./categories-menu";
import { Container } from "./container";

export async function Header() {
  const categories = await getCategoryTags();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-heading text-2xl tracking-tight">
          My Farmhouse
        </Link>
        <nav aria-label="Main" className="flex items-center gap-5 text-sm">
          <CategoriesMenu
            categories={categories}
          />
          <AuthControls />
          <WishlistLink />
          <CartLink />
        </nav>
      </Container>
    </header>
  );
}
