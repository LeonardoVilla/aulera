import { z } from "zod";

const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD");

export const editalSubjectBlockSchema = z.enum([
  "BASICO",
  "GERAL",
  "ESPECIFICO",
]);

export const editalScheduleEventKindSchema = z.enum([
  "INSCRICAO",
  "PROVA_OBJETIVA",
  "PROVA_DISCURSIVA",
  "GABARITO",
  "RECURSO",
  "RESULTADO",
  "OUTRO",
]);

export const parsedEditalDisciplinaSchema = z.object({
  bloco: editalSubjectBlockSchema,
  nome: z.string().min(1),
  numQuestoes: z.number().int().positive().nullable(),
  peso: z.number().nullable(),
});

export const parsedEditalCronogramaEventoSchema = z.object({
  evento: z.string().min(1),
  dataInicio: isoDateString,
  dataFim: isoDateString.nullable(),
  tipo: editalScheduleEventKindSchema,
});

export const parsedEditalSchema = z.object({
  orgao: z.string().nullable(),
  cargo: z.string().nullable(),
  examDate: isoDateString.nullable(),
  registrationDeadline: isoDateString.nullable(),
  resultDate: isoDateString.nullable(),
  disciplinas: z.array(parsedEditalDisciplinaSchema),
  cronograma: z.array(parsedEditalCronogramaEventoSchema),
});

export type ParsedEdital = z.infer<typeof parsedEditalSchema>;
export type ParsedEditalDisciplina = z.infer<
  typeof parsedEditalDisciplinaSchema
>;
export type ParsedEditalCronogramaEvento = z.infer<
  typeof parsedEditalCronogramaEventoSchema
>;
