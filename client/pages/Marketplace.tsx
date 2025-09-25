import SiteHeader from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<typeof items[number] | null>(null);
  const [qty, setQty] = useState(1);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [agree, setAgree] = useState(false);
  const resetForm = () => { setQty(1); setPhone(""); setAddress(""); setAgree(false); };

  function startCheckout(item: typeof items[number]){
    if(!auth.user){
      toast({ variant: "destructive", title: "Sign in required", description: "Please sign in to purchase." });
      return;
    }
    setSelected(item);
    setOpen(true);
  }

  function validate(): string | null {
    if (!selected) return 'No item selected';
    if (!auth.user) return 'Please sign in';
    if (qty < 1 || qty > 10) return 'Quantity must be between 1 and 10';
    const total = selected.price * qty;
    if ((auth.user.civicCoins||0) < total) return `Insufficient CivicCoins. Need ${total} 🪙`;
    if (!/^[0-9+\-\s]{8,15}$/.test(phone)) return 'Enter a valid phone number';
    if (address.trim().length < 8) return 'Enter a valid delivery address (min 8 chars)';
    if (!agree) return 'Please accept the terms to proceed';
    return null;
  }

  function confirmPurchase(){
    const err = validate();
    if (err){
      toast({ variant: "destructive", title: "Checkout error", description: err });
      return;
    }
    if (!selected) return;
    const total = selected.price * qty;
    auth.spendCoins(total, `Marketplace: ${selected.title} x${qty}`);
    toast({ title: "Purchase successful", description: `Purchased ${selected.title} x${qty} for ${total} 🪙. Delivery to: ${address}` });
    setOpen(false);
    resetForm();
    setSelected(null);
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
                    <Button onClick={()=>startCheckout(it)} className="flex-1">Buy</Button>
                    <Button
                      variant="outline"
                      onClick={()=>toast({ title: it.title, description: it.description })}
                    >
                      Info
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Checkout Dialog */}
          <Dialog open={open} onOpenChange={(o)=>{ setOpen(o); if(!o){ resetForm(); setSelected(null);} }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Checkout</DialogTitle>
                <DialogDescription>Confirm your purchase details</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{selected?.title}</div>
                  <div className="text-sm text-muted-foreground">Price: {selected?.price} 🪙</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Quantity (1-10)</label>
                    <Input type="number" min={1} max={10} value={qty} onChange={(e)=>setQty(Math.max(1, Math.min(10, parseInt(e.target.value||'1'))))} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Phone</label>
                    <Input placeholder="e.g. +91-9876543210" value={phone} onChange={(e)=>setPhone(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Delivery Address</label>
                  <Input placeholder="House no, street, area, city" value={address} onChange={(e)=>setAddress(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <input id="agree" type="checkbox" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
                  <label htmlFor="agree" className="text-xs text-muted-foreground">I agree to the marketplace terms and refund policy</label>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">Total: <span className="font-semibold">{(selected?.price||0) * qty} 🪙</span></div>
                  <div className="text-xs text-muted-foreground">Balance: {auth.user?.civicCoins ?? 0} 🪙</div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={()=>{ setOpen(false); }}>Cancel</Button>
                <Button onClick={confirmPurchase}>Confirm & Pay</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
