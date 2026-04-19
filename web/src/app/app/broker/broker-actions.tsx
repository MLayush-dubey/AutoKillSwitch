"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function BrokerActions() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [open, setOpen] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await fetch("/api/broker/refresh", { method: "POST" });
    setRefreshing(false);
    router.refresh();
  }

  async function disconnect() {
    setDisconnecting(true);
    await fetch("/api/broker/disconnect", { method: "POST" });
    setDisconnecting(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
      <Button variant="outline" onClick={refresh} disabled={refreshing}>
        {refreshing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Refreshing…
          </>
        ) : (
          "Refresh token"
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="text-destructive hover:text-destructive">
            Disconnect
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Dhan?</DialogTitle>
            <DialogDescription>
              Your killswitch will stop protecting this account immediately.
              You can reconnect anytime — just re-run onboarding.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep connected
            </Button>
            <Button
              variant="destructive"
              onClick={disconnect}
              disabled={disconnecting}
            >
              {disconnecting ? "Disconnecting…" : "Yes, disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
