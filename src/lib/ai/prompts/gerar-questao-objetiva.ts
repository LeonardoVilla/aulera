const EXAM_BOARD_STYLE_HINTS: Record<string, string> = {
  cesgranrio:
    "A banca Cesgranrio costuma cobrar enunciados diretos e literais, próximos da letra da lei ou da doutrina/norma técnica consolidada, com alternativas curtas e objetivas, evitando pegadinhas excessivamente rebuscadas.",
  fgv: "A banca FGV costuma cobrar questões interpretativas e situacionais, com enunciados mais longos que exigem aplicar o conhecimento a um caso concreto, e alternativas parecidas entre si que exigem atenção a detalhes.",
  cebraspe:
    "A banca Cebraspe tradicionalmente usa julgamento Certo/Errado, mas aqui adapte esse estilo minucioso e granular (cada afirmação é cobrada em detalhe, com pegadinhas sutis de interpretação e precisão terminológica) para o formato de 4 alternativas de múltipla escolha, mantendo o rigor técnico e a exigência de leitura atenta.",
  vunesp:
    "A banca VUNESP costuma cobrar questões objetivas de dificuldade moderada, com boa cobertura de conteúdo programático, redação clara e alternativas plausíveis mas com apenas uma tecnicamente correta.",
  fcc: "A banca FCC (Fundação Carlos Chagas) costuma cobrar questões tradicionais, bem estruturadas, com forte apego à doutrina majoritária e à jurisprudência/normas consolidadas, com linguagem formal e precisa.",
  iades:
    "A banca IADES costuma cobrar questões de dificuldade mediana, com enunciados objetivos e diretos, por vezes citando trechos de lei ou de texto de referência para interpretação.",
};

export function buildGerarQuestaoObjetivaPrompt(input: {
  groupName: string;
  subjectName: string;
  difficulty: "FACIL" | "MEDIO" | "DIFICIL";
  quantity: number;
  examBoardName?: string;
}) {
  const difficultyLabel = {
    FACIL: "fácil",
    MEDIO: "médio",
    DIFICIL: "difícil",
  }[input.difficulty];

  const examBoardSlug = input.examBoardName?.toLowerCase().trim();
  const styleHint = examBoardSlug ? EXAM_BOARD_STYLE_HINTS[examBoardSlug] : undefined;

  const examBoardInstruction = input.examBoardName
    ? `\n\nEstas questões fazem parte de um simulado no estilo da banca examinadora "${input.examBoardName}". Gere questões INÉDITAS (não copie questões reais protegidas por direitos autorais), mas fiéis ao estilo, ao formato de enunciado e ao nível de dificuldade historicamente característico dessa banca. ${
        styleHint ?? "Utilize um estilo de redação e cobrança de conteúdo coerente com o que essa banca costuma praticar em concursos públicos."
      }`
    : "";

  return `Você é um examinador de banca de concursos públicos brasileiros (estilo Cesgranrio/FGV/Cebraspe).

Gere ${input.quantity} questão(ões) objetiva(s) de múltipla escolha, com 4 alternativas (A, B, C, D), sobre o tema "${input.subjectName}", voltada(s) para candidatos ao grupo "${input.groupName}".

Nível de dificuldade: ${difficultyLabel}.${examBoardInstruction}

Regras:
- Cada questão deve ter exatamente 4 alternativas, com apenas uma correta.
- O enunciado deve ser claro, objetivo, em português formal, sem ambiguidade.
- Não repita o mesmo enunciado ou a mesma resposta correta em todas as questões.
- Inclua uma breve explicação (1-2 frases) do motivo da alternativa correta estar certa.
- Não inclua numeração, cabeçalhos ou texto fora do formato pedido.`;
}
