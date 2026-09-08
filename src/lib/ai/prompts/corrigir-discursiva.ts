export function buildCorrigirDiscursivaPrompt(input: {
  statement: string;
  rubric: string;
  expectedTopics: string[];
  studentAnswer: string;
}) {
  return `Você é um corretor de provas discursivas de concursos públicos brasileiros.

Enunciado da questão:
"""
${input.statement}
"""

Critérios de correção (rubrica):
"""
${input.rubric}
"""

Tópicos esperados na resposta: ${input.expectedTopics.join(", ")}

Resposta do candidato:
"""
${input.studentAnswer}
"""

Avalie a resposta do candidato com nota de 0 a 10 (podendo usar casas decimais), considerando
clareza, correção técnica e cobertura dos tópicos esperados. Escreva um feedback construtivo
em português, listando pontos fortes e pontos fracos da resposta.`;
}
