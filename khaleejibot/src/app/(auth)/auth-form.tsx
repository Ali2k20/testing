"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signIn, signUp, type AuthState } from "./actions";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? signIn : signUp, undefined);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{mode === "login" ? t("loginTitle") : t("signupTitle")}</CardTitle>
        <CardDescription>{mode === "login" ? t("loginSubtitle") : t("signupSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <div className="grid gap-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" name="email" type="email" autoComplete="email" dir="ltr" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              dir="ltr"
              required
              aria-describedby={mode === "signup" ? "password-hint" : undefined}
            />
            {mode === "signup" ? (
              <p id="password-hint" className="text-muted-foreground text-xs">
                {t("passwordHint")}
              </p>
            ) : null}
          </div>

          {state?.error ? (
            <Alert variant="destructive">
              <AlertDescription>{t(`errors.${state.error}`)}</AlertDescription>
            </Alert>
          ) : null}
          {state?.notice ? (
            <Alert>
              <AlertDescription>{t(state.notice)}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full">
            {mode === "login" ? common("signIn") : common("signUp")}
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
            <Link className="text-primary font-medium hover:underline" href={mode === "login" ? "/signup" : "/login"}>
              {mode === "login" ? common("signUp") : common("signIn")}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
