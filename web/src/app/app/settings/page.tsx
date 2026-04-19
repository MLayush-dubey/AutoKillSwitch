import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ProfileForm } from "./profile-form";
import { NotificationsForm } from "./notifications-form";
import { SecurityPane } from "./security-pane";
import { PreferencesForm } from "./preferences-form";
import { DangerZone } from "./danger-zone";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      emailOnTrigger: true,
      telegramEnabled: true,
      telegramBotToken: true,
      telegramChatId: true,
      dailySummaryEnabled: true,
      themePreference: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your profile, notifications, and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm
            initial={{
              name: user.name ?? "",
              email: user.email,
              phone: user.phone ?? "",
            }}
          />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsForm
            initial={{
              emailOnTrigger: user.emailOnTrigger,
              telegramEnabled: user.telegramEnabled,
              telegramBotToken: user.telegramBotToken ?? "",
              telegramChatId: user.telegramChatId ?? "",
              dailySummaryEnabled: user.dailySummaryEnabled,
            }}
          />
        </TabsContent>
        <TabsContent value="security">
          <SecurityPane />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesForm initial={{ themePreference: user.themePreference }} />
        </TabsContent>
      </Tabs>

      <DangerZone />
    </div>
  );
}
