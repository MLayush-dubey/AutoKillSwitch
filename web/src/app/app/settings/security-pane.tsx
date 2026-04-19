import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SecurityPane() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            Change password (coming soon)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-factor auth</CardTitle>
          <CardDescription>
            Add a TOTP authenticator as a second sign-in factor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            Set up 2FA (coming soon)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>Devices currently signed in.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border border-border bg-background/40 px-4 py-3 text-sm">
            <div>
              <div className="font-medium">This device</div>
              <div className="text-xs text-muted-foreground">
                Signed in now
              </div>
            </div>
            <span className="text-xs text-[color:var(--profit)]">Current</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
