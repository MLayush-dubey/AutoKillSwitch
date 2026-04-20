import { AppSidebar } from "@/components/app/sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar isAdmin={session.user.role === "admin"} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/60 px-6 backdrop-blur">
          <div className="text-sm text-muted-foreground">
            Market{" "}
            <span className="font-medium text-foreground">closed</span> ·
            reopens 09:15 IST
          </div>
          <div className="text-sm text-muted-foreground">
            {session.user.name || session.user.email}
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
