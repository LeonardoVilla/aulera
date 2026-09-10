// O Gemini 3.6 Flash tem janela de contexto de mais de 1M tokens (~4M
// caracteres), então cabe enviar o edital quase inteiro sem custo proibitivo.
// O conteúdo programático completo (Anexo) e o cronograma (Anexo) costumam
// ficar nas últimas páginas de editais longos — um limite baixo (usado antes)
// cortava o texto antes de alcançá-los, resultando em disciplinas/datas
// vazias. 200.000 caracteres cobrem confortavelmente a grande maioria dos
// editais (mesmo os de 40+ páginas de Diário Oficial), com folga de sobra
// no contexto do modelo.
const MAX_CHARS = 200_000;

/**
 * Trunca o texto bruto do edital apenas no caso raro de ultrapassar
 * MAX_CHARS (editais excepcionalmente longos). Corta nos primeiros
 * MAX_CHARS caracteres — não é ideal para esses casos extremos, mas é
 * preferível a estourar o contexto do modelo.
 */
function truncateRelevantText(rawText: string): string {
  if (rawText.length <= MAX_CHARS) {
    return rawText;
  }
  return rawText.slice(0, MAX_CHARS);
}

export function buildParsearEditalPrompt(
  rawText: string,
  correctionHint?: string,
): string {
  const relevantText = truncateRelevantText(rawText);

  const correctionBlock = correctionHint
    ? `\n\nATENÇÃO: uma tentativa anterior de extração falhou na validação. Corrija o seguinte problema antes de responder novamente: ${correctionHint}\n`
    : "";

  return `Você é um assistente especializado em ler editais de concursos públicos brasileiros publicados em Diário Oficial e extrair informações estruturadas deles.

O texto abaixo foi extraído automaticamente de um PDF de edital e pode conter:
- Cabeçalhos e rodapés de página repetidos (nome do órgão, número de página, "Diário Oficial", etc.);
- Numeração de itens/subitens fora de ordem visual por causa da extração;
- Conteúdo irrelevante misturado ao texto relevante (marcas d'água, notas de rodapé, informações de publicação).

Ignore cabeçalhos/rodapés repetidos e ruído de formatação. Foque em extrair APENAS as informações estruturadas pedidas abaixo, com base no conteúdo real do edital.

Extraia:
1. **orgao**: nome do órgão/instituição que realiza o concurso (ex: "Secretaria de Estado de Meio Ambiente de Mato Grosso - SEMA/MT"). Se não conseguir identificar com confiança, retorne null.
2. **cargo**: nome do cargo/vaga principal do edital (se houver mais de um cargo, escolha o primeiro ou mais relevante mencionado). Se não conseguir identificar, retorne null.
3. **examDate**: data da prova objetiva (ou discursiva, se só houver essa), normalizada para "YYYY-MM-DD". Se não encontrar, retorne null.
4. **registrationDeadline**: data limite de inscrição, normalizada para "YYYY-MM-DD". Se não encontrar, retorne null.
5. **resultDate**: data de divulgação do resultado final, normalizada para "YYYY-MM-DD". Se não encontrar, retorne null.
6. **disciplinas**: lista do conteúdo programático, cada item com:
   - "bloco": "BASICO" (Conhecimentos Básicos/Gerais de português, raciocínio lógico, informática básica etc.), "GERAL" (Conhecimentos Gerais quando o edital distinguir de Básicos), ou "ESPECIFICO" (Conhecimentos Específicos do cargo). Se o edital só tiver uma divisão simples de "básicos" e "específicos", classifique conhecimentos gerais/comuns como "BASICO".
   - "nome": nome da disciplina/matéria (ex: "Língua Portuguesa", "Direito Ambiental").
   - "numQuestoes": número de questões daquela disciplina, se informado no edital (número inteiro), ou null se não informado.
   - "peso": peso/valor daquela disciplina, se informado, ou null.
7. **cronograma**: lista de eventos do cronograma do concurso (datas importantes), cada item com:
   - "evento": descrição curta do evento (ex: "Período de inscrições", "Aplicação da prova objetiva", "Divulgação do gabarito preliminar").
   - "dataInicio": data de início do evento, formato "YYYY-MM-DD".
   - "dataFim": data de término, se for um período (ex: período de inscrições), formato "YYYY-MM-DD", ou null se for uma data única.
   - "tipo": classifique como um destes valores: "INSCRICAO", "PROVA_OBJETIVA", "PROVA_DISCURSIVA", "GABARITO", "RECURSO", "RESULTADO", ou "OUTRO" se não se encaixar em nenhum desses.

Regras de normalização de datas:
- Datas em português por extenso (ex: "14 de outubro de 2026") devem virar "2026-10-14".
- Datas abreviadas (ex: "14/10/2026") também devem virar "2026-10-14".
- Se o ano não estiver explícito em alguma data mas puder ser inferido pelo contexto (mesmo ano de outras datas do edital), infira o ano.
- Nunca invente datas: se não houver informação suficiente para determinar uma data completa, não inclua o evento ou use null no campo correspondente conforme o schema permitir.

Responda SOMENTE com o JSON estruturado pedido, sem texto adicional.${correctionBlock}

TEXTO DO EDITAL (pode estar truncado):
"""
${relevantText}
"""`;
}
