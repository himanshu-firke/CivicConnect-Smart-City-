import SiteHeader from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const items = [
  { id: 'recycled-paper', title: 'Recycled Paper Notebooks (3-pack)', price: 60, description: 'Notebooks made from post-consumer recycled paper', img: 'https://images.unsplash.com/photo-1569690484582-58b478f46805?q=80&w=890&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: 'glass-planter', title: 'Upcycled Glass Bottle Planter', price: 80, description: 'Planter crafted from recycled glass bottles', img: 'https://images.unsplash.com/photo-1717438360011-cb04030be91d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Z2xhc3MlMjBib3R0bGUlMjBwbGFudGVyfGVufDB8fDB8fHww' },
  { id: 'plastic-bags', title: 'Recycled Plastic Trash Bags (30 pcs)', price: 70, description: 'Municipal-grade bags made from recycled plastic', img: 'https://plus.unsplash.com/premium_photo-1671031352715-805ff4f3d20d?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: 'ewaste-kit', title: 'E-waste Recycling Kit', price: 120, description: 'Home kit to safely pack and handover e-waste', img: 'https://plus.unsplash.com/premium_photo-1683133531613-6a7db8847c72?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: 'leaf-plates', title: 'Compostable Leaf Plates (25 pcs)', price: 55, description: 'Eco plates from areca leaves supported by municipal drives', img: 'https://images.unsplash.com/photo-1638009668247-71a22aed7e91?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: 'solar-lamp', title: 'Solar Rechargeable Lamp', price: 200, description: 'Portable solar lamp for street vendors and night markets', img: 'https://images.unsplash.com/photo-1621177555452-bedbe4c28879?q=80&w=385&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: 'bamboo-toothbrush', title: 'Bamboo Toothbrush (5 pcs)', price: 40, description: 'Biodegradable bamboo toothbrushes', img: 'https://plus.unsplash.com/premium_photo-1664527305203-c99123b699fc?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: 'kompost-kit', title: 'Home Compost Kit', price: 150, description: 'Small composter for kitchen waste', img: 'https://plus.unsplash.com/premium_photo-1749886490122-c4619ff4cfae?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
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
