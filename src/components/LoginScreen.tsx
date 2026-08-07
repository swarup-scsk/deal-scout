import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

export function LoginScreen() {
  const { signIn } = useAuth();
  const { setRole } = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const user = signIn(username, password);
    if (!user) {
      setError("Incorrect username or password.");
      return;
    }
    setError("");
    setRole(user.role); // reflect the signed-in role in the app
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[12px] font-bold text-white"
            style={{ background: "var(--seel-gradient)" }}
          >
            SEE
          </span>
          <div>
            <div className="text-base font-semibold text-foreground">
              Origination Scout
            </div>
            <div className="text-[11px] text-muted-foreground">
              Sign in to continue
            </div>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Prototype access only, not for production use.
          </p>
        </form>
      </div>
    </div>
  );
}
