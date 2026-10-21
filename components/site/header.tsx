import Link from "next/link";
import { getCategories } from "@/lib/sanity/data";
import { AuthControls } from "./auth-controls";
import { CartLink } from "./cart-link";
import { Container } from "./container";

export async function Header() {
  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-heading text-2xl tracking-tight">
          My Farmhouse
        </Link>
        <nav aria-label="Main" className="flex items-center gap-5 text-sm">
          <Link
            href="/products"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Shop all
          </Link>
          <AuthControls />
          <CartLink />
        </nav>
      </Container>
      <nav aria-label="Categories" className="border-t">
        <Container>
          <ul className="flex gap-6 overflow-x-auto py-2.5 text-sm whitespace-nowrap">
            {categories.map((category) => (
              <li key={category._id}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {category.title}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </nav>
    </header>
  );
}
