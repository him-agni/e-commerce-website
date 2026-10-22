import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What My Farmhouse collects, where it is kept, and who else handles it. This is a demo store.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-2xl">{title}</h2>
      <div className="space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <Container className="max-w-2xl py-12">
      <h1 className="blur-in mb-2 text-4xl">Privacy</h1>
      <p className="text-sm text-muted-foreground">Last updated October 22, 2026</p>

      <p className="mt-6 leading-relaxed">
        My Farmhouse is a portfolio project, not a real shop. Nothing is shipped and no real money
        moves: payments run in Stripe&rsquo;s test mode. Please use made-up details at checkout (Stripe
        accepts the test card 4242 4242 4242 4242 with any future date, any code and any US address)
        and do not share anything you would not want a developer to see.
      </p>

      <Section title="What the site keeps, and where">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Your account</strong> (email, name, sign-in): kept by Clerk, the sign-in service.
            This site does not store your password.
          </li>
          <li>
            <strong>Checkout details</strong> (email, shipping address, card): collected and kept by
            Stripe on its payment page. The site never sees a card number. Your shipping address is
            shown on My orders by asking Stripe each time; it is not copied anywhere else.
          </li>
          <li>
            <strong>Order records</strong>: the order number, what was bought, prices, total, date and
            status, plus a random code that links your orders together. They live in the store&rsquo;s
            content database, which anyone can read. For that reason they hold <em>no name, email or
            address</em>, and the random code is made with a secret kept on the server, so it cannot
            be traced back to your account by anyone who only has the database.
          </li>
          <li>
            <strong>Cart and wishlist</strong>: saved only in your own browser. They are never sent to
            the server except to look up current prices and stock.
          </li>
        </ul>
      </Section>

      <Section title="The shopping assistant">
        <p>
          Your messages to the assistant are sent to Google&rsquo;s Gemini service to produce a reply.
          This site uses Google&rsquo;s <strong>free tier</strong>, and Google&rsquo;s terms for free use
          say it may keep that content, use it to improve its products, and have people review it.
          Please do not type personal or payment details into the chat.
        </p>
        <p>
          If you are signed in and ask about your orders, the assistant looks them up and sends a
          short summary (order number, items, total, date) to Google so it can answer. It never
          receives your email, address or card. This site does not keep a copy of your conversation:
          it is gone as soon as you reload or leave the page.
        </p>
      </Section>

      <Section title="Cookies and browser storage">
        <p>
          Clerk sets cookies so you stay signed in. Your cart and wishlist use your
          browser&rsquo;s local storage. There is no advertising and no analytics on this site.
        </p>
      </Section>

      <Section title="Who else handles data">
        <ul className="list-disc space-y-2 pl-5">
          <li>Clerk: sign-in and accounts.</li>
          <li>Stripe: checkout and payments (test mode).</li>
          <li>Sanity: product catalog and order records.</li>
          <li>Vercel: hosting. Like any host, it sees technical request details such as IP addresses.</li>
          <li>Google: the assistant&rsquo;s replies, as described above.</li>
          <li>Unsplash: the product photos.</li>
        </ul>
      </Section>

      <Section title="Your choices">
        <p>
          You can delete your account at any time from <strong>Manage account</strong> in the account
          menu at the top right. Order records are kept without any link to you once the account is
          gone. Clearing your browser&rsquo;s site data removes your cart and wishlist.
        </p>
        <p>
          <Link href="/" className="underline underline-offset-4">
            Back to the shop
          </Link>
        </p>
      </Section>
    </Container>
  );
}
