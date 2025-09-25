import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, GitBranch, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { loadNotifications, addNotification, Notification } from "@/lib/notifications";

export default function SiteHeader() {
  const location = useLocation();
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  function filterForUser(all: Notification[], user: any | null) {
    if (!user) {
      // show only notifications not targeted to specific users/roles
      return all.filter((n) => !n.targetUserId && !n.targetRole && !n.targetDepartment);
    }
    if (user.role === 'citizen') {
      return all.filter((n) => (
        n.targetUserId === user.id ||
        (n.reporterId === user.id && (n.type === 'assigned' || n.type === 'resolved'))
      ));
    }
    if (user.role === 'admin' && user.department === 'Municipal') {
      // municipal admin: new issues submitted by citizens
      return all.filter((n) => n.type === 'submitted' && (!n.targetDepartment || n.targetDepartment === 'Municipal' || n.targetRole === 'municipal'));
    }
    if (user.role === 'admin') {
      // departmental admin: see submitted issues for their department
      return all.filter((n) => n.type === 'submitted' && n.department === user.department);
    }
    // fallback: show notifications that are generic or targeted to this user
    return all.filter((n) => !n.targetUserId || n.targetUserId === user.id || (n.targetRole && n.targetRole === user.role));
  }

  useEffect(() => {
    const reload = () => {
      try {
        const all = loadNotifications();
        setNotifications(filterForUser(all, auth.user));
      } catch (e) {}
    };

    const onNotif = (e: any) => {
      try {
        // persist notification (detail expected to be an object with metadata)
        const payload = e?.detail ?? (typeof e === 'string' ? { message: e } : { message: 'Update' });
        addNotification(payload as any);
      } catch (err) {}
    };

    const onAdded = (e: any) => {
      reload();
    };

    // initial load
    reload();

    window.addEventListener('civicai_notification', onNotif as EventListener);
    window.addEventListener('civicai_notification_added', onAdded as EventListener);
    return () => {
      window.removeEventListener('civicai_notification', onNotif as EventListener);
      window.removeEventListener('civicai_notification_added', onAdded as EventListener);
    };
  }, [auth.user]);

  const NavLinks = () => (
    <>
      <Link
        to="/"
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          location.pathname === "/" && "text-primary",
        )}
      >
        Home
      </Link>
      {(!auth.user || auth.user.role !== "citizen") && (
        <Link
          to="/dashboard"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            location.pathname.startsWith("/dashboard") && "text-primary",
          )}
        >
          Dashboard
        </Link>
      )}
      {auth.user && auth.user.role === "citizen" && (
        <Link
          to="/my-history"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            location.pathname.startsWith("/my-history") && "text-primary",
          )}
        >
          My History
        </Link>
      )}
      {auth.user && auth.user.role === "admin" && (
        <Link
          to="/history"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            location.pathname.startsWith("/history") && "text-primary",
          )}
        >
          History
        </Link>
      )}
      {(!auth.user || auth.user.role === "citizen") && (
        <Link
          to="/marketplace"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            location.pathname.startsWith("/marketplace") && "text-primary",
          )}
        >
          Marketplace
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow">
            <GitBranch className="h-5 w-5" />
          </span>
          <span className="text-lg">CivicAI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <NavLinks />

          {auth.user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">{auth.user.name}</span>
              <button className="text-sm text-muted-foreground" onClick={() => auth.logout()}>Sign out</button>
            </div>
          ) : null}

          <div className="relative">
            <button className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent" aria-label="Notifications" onClick={() => setShowNotifications((s)=>!s)}>
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-white text-[10px]">{notifications.length}</span>}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-md border bg-card shadow z-50">
                <div className="p-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Notifications</div>
                    <button className="text-xs text-muted-foreground" onClick={() => {
                      try {
                        // remove only notifications relevant to current user
                        const all = loadNotifications();
                        const keep = all.filter((n) => {
                          // keep notifications that are NOT for this user
                          const forUser = (auth.user && (n.targetUserId === auth.user.id || n.reporterId === auth.user.id || (n.type === 'submitted' && ((auth.user.role === 'admin' && auth.user.department === 'Municipal' && (n.targetDepartment === 'Municipal' || n.targetRole === 'municipal')) || (auth.user.role === 'admin' && n.department === auth.user.department)))));
                          return !forUser;
                        });
                        // save rest
                        try { localStorage.setItem('civicai_notifications', JSON.stringify(keep)); } catch(e){}
                        setNotifications([]);
                      } catch(e){}
                    }}>Clear</button>
                  </div>
                  <div className="mt-2 max-h-64 overflow-auto">
                    {notifications.length === 0 && <div className="text-sm text-muted-foreground">No notifications</div>}
                    {notifications.map((n) => (
                      <div key={n.id} className="border-b px-2 py-2 text-sm">
                        <div>{n.message}</div>
                        <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center md:hidden gap-2">
          <button className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-accent" aria-label="Notifications" onClick={() => setShowNotifications((s)=>!s)}>
            <Bell className="h-5 w-5" />
          </button>
          <Button variant="ghost" size="icon" aria-label="Menu" onClick={() => setOpen((s) => !s)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="md:hidden absolute right-4 left-4 top-14 z-50 rounded-b-md bg-card border-t p-3 shadow">
          <div className="flex flex-col gap-2">
            <NavLinks />
            {auth.user ? (
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm">{auth.user.name}</div>
                <button className="text-sm text-muted-foreground" onClick={() => { auth.logout(); setOpen(false); }}>Sign out</button>
              </div>
            ) : null}
            <div className="pt-2">
              <Link to="/report" className="block rounded-md px-3 py-2 text-sm hover:bg-accent" onClick={() => setOpen(false)}>Report an issue</Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile notifications panel */}
      {showNotifications && (
        <div className="md:hidden absolute right-4 left-4 top-14 z-50 rounded-b-md bg-card border-t p-3 shadow">
          <div className="p-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Notifications</div>
              <button className="text-xs text-muted-foreground" onClick={() => {
                try {
                  const all = loadNotifications();
                  const keep = all.filter((n) => {
                    const forUser = auth.user && (n.targetUserId === auth.user.id || n.reporterId === auth.user.id || (n.type === 'submitted' && ((auth.user.role === 'admin' && auth.user.department === 'Municipal' && (n.targetDepartment === 'Municipal' || n.targetRole === 'municipal')) || (auth.user.role === 'admin' && n.department === auth.user.department))));
                    return !forUser;
                  });
                  try { localStorage.setItem('civicai_notifications', JSON.stringify(keep)); } catch (e) {}
                  setNotifications([]);
                } catch (e) {}
              }}>
                Clear
              </button>
            </div>
            <div className="mt-2 max-h-64 overflow-auto">
              {notifications.length === 0 && <div className="text-sm text-muted-foreground">No notifications</div>}
              {notifications.map((n) => (
                <div key={n.id} className="border-b px-2 py-2 text-sm">
                  <div>{n.message}</div>
                  <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
