import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-widest text-wood">
        Modern farmhouse furniture
      </p>
      <h1 className="text-5xl sm:text-6xl">My Farmhouse</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Warm woods, soft linens and black iron accents. The store is under
        construction.
      </p>
      <Button size="lg">Shop the collection</Button>
    </main>
  );
}
