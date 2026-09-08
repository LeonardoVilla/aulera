export function buildGerarQuestaoDiscursivaPrompt(input: {
  groupName: string;
  subjectName: string;
  difficulty: "FACIL" | "MEDIO" | "DIFICIL";
}) {
  const difficultyLabel = {
    FACIL: "fácil",
    MEDIO: "médio",
    DIFICIL: "difícil",
  }[input.difficulty];

  return `Você é um examinador de banca de concursos públicos brasileiros.

Gere uma questão discursiva (dissertativa) sobre o tema "${input.subjectName}", voltada para candidatos ao grupo "${input.groupName}", nível de dificuldade ${difficultyLabel}.

Regras:
- O enunciado deve pedir uma resposta dissertativa clara e objetiva (não uma redação longa).
- Liste os principais tópicos que uma resposta completa deveria abordar (expectedTopics).
- Escreva um gabarito/rubrica (rubric) descrevendo os critérios de avaliação esperados
  (clareza, correção técnica, cobertura dos tópicos), para ser usado depois na correção
  automática de respostas de alunos.`;
}
