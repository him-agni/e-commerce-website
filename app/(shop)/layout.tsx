import { ClerkProvider } from "@clerk/nextjs";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </ClerkProvider>
  );
}
