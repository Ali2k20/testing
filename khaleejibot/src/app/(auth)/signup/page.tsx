import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthForm } from "../auth-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("common"))("signUp") };
}

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
