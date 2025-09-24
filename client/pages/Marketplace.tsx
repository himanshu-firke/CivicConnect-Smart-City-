import SiteHeader from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const items = [
  { id: 'recycled-paper', title: 'Recycled Paper Notebooks (3-pack)', price: 60, description: 'Notebooks made from post-consumer recycled paper', img: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop' },
  { id: 'glass-planter', title: 'Upcycled Glass Bottle Planter', price: 80, description: 'Planter crafted from recycled glass bottles', img: 'https://images.unsplash.com/photo-1492496913980-501348b61469?q=80&w=800&auto=format&fit=crop' },
  { id: 'plastic-bags', title: 'Recycled Plastic Trash Bags (30 pcs)', price: 70, description: 'Municipal-grade bags made from recycled plastic', img: 'https://images.unsplash.com/photo-1581579183596-3b40d1d7f2f1?q=80&w=800&auto=format&fit=crop' },
  { id: 'ewaste-kit', title: 'E-waste Recycling Kit', price: 120, description: 'Home kit to safely pack and handover e-waste', img: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=800&auto=format&fit=crop' },
  { id: 'leaf-plates', title: 'Compostable Leaf Plates (25 pcs)', price: 55, description: 'Eco plates from areca leaves supported by municipal drives', img: 'https://images.unsplash.com/photo-1598965675041-3b5b5bd6b9d2?q=80&w=800&auto=format&fit=crop' },
  { id: 'solar-lamp', title: 'Solar Rechargeable Lamp', price: 200, description: 'Portable solar lamp for street vendors and night markets', img: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=800&auto=format&fit=crop' },
  { id: 'bamboo-toothbrush', title: 'Bamboo Toothbrush (5 pcs)', price: 40, description: 'Biodegradable bamboo toothbrushes', img: 'https://images.unsplash.com/photo-1582719478250-7e1a1f03d8d1?q=80&w=800&auto=format&fit=crop' },
  { id: 'kompost-kit', title: 'Home Compost Kit', price: 150, description: 'Small composter for kitchen waste', img: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=800&auto=format&fit=crop' },
];

export default function Marketplace(){
  const auth = useAuth();
  const [message, setMessage] = useState<string | null>(null);

  function buy(item: typeof items[number]){
    if(!auth.user){
      setMessage('Sign in to purchase');
      return;
    }
    if((auth.user.civicCoins||0) < item.price){
      setMessage('Insufficient CivicCoins');
      return;
    }
    auth.spendCoins(item.price);
    setMessage(`Purchased ${item.title} for ${item.price} 🪙`);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Marketplace</h2>
              <p className="text-sm text-muted-foreground">Spend CivicCoins on eco-friendly products.</p>
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-sm text-muted-foreground">Balance</div>
              <div className="text-lg font-bold">{auth.user?.civicCoins ?? 0} 🪙</div>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it)=> (
              <Card key={it.id}>
                <img src={it.img} alt={it.title} className="h-36 w-full object-cover rounded-t-lg" />
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{it.title}</div>
                      <div className="text-sm text-muted-foreground">{it.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{it.price} 🪙</div>
                      <div className="text-xs text-muted-foreground">Estimated delivery: 7 days</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={()=>buy(it)} className="flex-1">Buy</Button>
                    <Button variant="outline" onClick={()=>setMessage(it.description)}>Info</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {message && <div className="text-sm text-muted-foreground">{message}</div>}
        </div>
      </main>
    </div>
  );
}
