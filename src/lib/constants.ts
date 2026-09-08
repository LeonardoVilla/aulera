export const INTENSITY_QUESTION_COUNT: Record<"CURTA" | "ALMOCO" | "FOCO", number> = {
  CURTA: 6,
  ALMOCO: 10,
  FOCO: 18,
};

export const INTENSITY_LABELS: Record<"CURTA" | "ALMOCO" | "FOCO", string> = {
  CURTA: "Sessão rápida (~30 min)",
  ALMOCO: "Horário de almoço",
  FOCO: "Estudo focado",
};

export const GROUP_SLUGS = ["ti", "direito"] as const;
export type GroupSlug = (typeof GROUP_SLUGS)[number];

export const INTENSITY_SLUGS = ["curta", "almoco", "foco"] as const;
export type IntensitySlug = (typeof INTENSITY_SLUGS)[number];

export const INTENSITY_SLUG_TO_ENUM: Record<IntensitySlug, "CURTA" | "ALMOCO" | "FOCO"> = {
  curta: "CURTA",
  almoco: "ALMOCO",
  foco: "FOCO",
};
