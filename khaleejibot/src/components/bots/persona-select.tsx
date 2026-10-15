import { useTranslations } from "next-intl";

import { NativeSelect } from "@/components/ui/native-select";
import type { DialectPersona } from "@/lib/supabase/database.types";

export const PERSONAS: DialectPersona[] = ["emirati_khaleeji", "bilingual_auto", "levantine", "msa_formal"];

export function PersonaSelect({ defaultValue, id }: { defaultValue?: DialectPersona; id: string }) {
  const t = useTranslations("bots.persona");
  return (
    <NativeSelect id={id} name="dialect_persona" defaultValue={defaultValue ?? "emirati_khaleeji"}>
      {PERSONAS.map((persona) => (
        <option key={persona} value={persona}>
          {t(persona)}
        </option>
      ))}
    </NativeSelect>
  );
}
