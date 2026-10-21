import Link from "next/link";
import { Container } from "./container";

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-secondary/50">
      <Container className="flex flex-col gap-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-xl text-foreground">My Farmhouse</p>
          <p className="mt-1">Modern farmhouse furniture, made to be lived in.</p>
        </div>
        <ul className="flex gap-6">
          <li>
            <Link href="/products" className="hover:text-foreground">
              Shop all
            </Link>
          </li>
        </ul>
      </Container>
      <Container className="pb-8 text-xs text-muted-foreground">
        <p>
          A portfolio project. No real orders are taken or charged. Product photos
          from Unsplash.
        </p>
      </Container>
    </footer>
  );
}
