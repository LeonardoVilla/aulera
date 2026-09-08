import { prisma } from "../src/lib/prisma";

type FixtureQuestion = {
  subjectName: string;
  statement: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  difficulty: "FACIL" | "MEDIO" | "DIFICIL";
};

const TI_QUESTIONS: FixtureQuestion[] = [
  {
    subjectName: "Segurança da Informação",
    statement:
      "Qual princípio de segurança da informação garante que um dado não foi alterado indevidamente durante seu ciclo de vida?",
    options: [
      { id: "A", text: "Confidencialidade" },
      { id: "B", text: "Integridade" },
      { id: "C", text: "Disponibilidade" },
      { id: "D", text: "Não repúdio" },
    ],
    correctOptionId: "B",
    difficulty: "FACIL",
  },
  {
    subjectName: "Segurança da Informação",
    statement:
      "Em criptografia, qual das opções abaixo é um exemplo de algoritmo de chave assimétrica?",
    options: [
      { id: "A", text: "AES" },
      { id: "B", text: "DES" },
      { id: "C", text: "RSA" },
      { id: "D", text: "SHA-256" },
    ],
    correctOptionId: "C",
    difficulty: "MEDIO",
  },
  {
    subjectName: "Banco de Dados",
    statement:
      "Em um Sistema Gerenciador de Banco de Dados relacional, qual comando SQL é usado para remover permanentemente uma tabela e sua estrutura?",
    options: [
      { id: "A", text: "DELETE TABLE" },
      { id: "B", text: "TRUNCATE" },
      { id: "C", text: "DROP TABLE" },
      { id: "D", text: "REMOVE TABLE" },
    ],
    correctOptionId: "C",
    difficulty: "FACIL",
  },
  {
    subjectName: "Banco de Dados",
    statement:
      "Qual forma normal de um banco de dados relacional exige que não existam dependências transitivas entre atributos não-chave?",
    options: [
      { id: "A", text: "Primeira Forma Normal (1FN)" },
      { id: "B", text: "Segunda Forma Normal (2FN)" },
      { id: "C", text: "Terceira Forma Normal (3FN)" },
      { id: "D", text: "Forma Normal de Boyce-Codd (FNBC)" },
    ],
    correctOptionId: "C",
    difficulty: "MEDIO",
  },
  {
    subjectName: "Redes de Computadores",
    statement:
      "Qual camada do modelo OSI é responsável pelo roteamento de pacotes entre redes distintas?",
    options: [
      { id: "A", text: "Camada de Enlace" },
      { id: "B", text: "Camada de Rede" },
      { id: "C", text: "Camada de Transporte" },
      { id: "D", text: "Camada de Sessão" },
    ],
    correctOptionId: "B",
    difficulty: "FACIL",
  },
  {
    subjectName: "Redes de Computadores",
    statement:
      "Qual protocolo é utilizado para a tradução de nomes de domínio em endereços IP?",
    options: [
      { id: "A", text: "DHCP" },
      { id: "B", text: "FTP" },
      { id: "C", text: "DNS" },
      { id: "D", text: "SNMP" },
    ],
    correctOptionId: "C",
    difficulty: "FACIL",
  },
  {
    subjectName: "Engenharia de Software",
    statement:
      "No modelo Scrum, qual é o papel responsável por priorizar os itens do Product Backlog?",
    options: [
      { id: "A", text: "Scrum Master" },
      { id: "B", text: "Product Owner" },
      { id: "C", text: "Time de Desenvolvimento" },
      { id: "D", text: "Stakeholder" },
    ],
    correctOptionId: "B",
    difficulty: "FACIL",
  },
  {
    subjectName: "Engenharia de Software",
    statement:
      "Qual princípio do SOLID estabelece que uma classe deve ter apenas um motivo para mudar?",
    options: [
      { id: "A", text: "Open/Closed Principle" },
      { id: "B", text: "Liskov Substitution Principle" },
      { id: "C", text: "Single Responsibility Principle" },
      { id: "D", text: "Dependency Inversion Principle" },
    ],
    correctOptionId: "C",
    difficulty: "MEDIO",
  },
];

const DIREITO_QUESTIONS: FixtureQuestion[] = [
  {
    subjectName: "Direito Constitucional",
    statement:
      "De acordo com a Constituição Federal de 1988, quantos são os Poderes da União, independentes e harmônicos entre si?",
    options: [
      { id: "A", text: "Dois" },
      { id: "B", text: "Três" },
      { id: "C", text: "Quatro" },
      { id: "D", text: "Cinco" },
    ],
    correctOptionId: "B",
    difficulty: "FACIL",
  },
  {
    subjectName: "Direito Constitucional",
    statement:
      "Qual remédio constitucional é cabível para proteger direito líquido e certo, não amparado por habeas corpus ou habeas data?",
    options: [
      { id: "A", text: "Mandado de segurança" },
      { id: "B", text: "Ação popular" },
      { id: "C", text: "Mandado de injunção" },
      { id: "D", text: "Ação civil pública" },
    ],
    correctOptionId: "A",
    difficulty: "MEDIO",
  },
  {
    subjectName: "Direito Administrativo",
    statement:
      "Qual princípio da Administração Pública, previsto expressamente no art. 37 da CF/88, exige que os atos administrativos sejam tornados públicos?",
    options: [
      { id: "A", text: "Legalidade" },
      { id: "B", text: "Impessoalidade" },
      { id: "C", text: "Publicidade" },
      { id: "D", text: "Eficiência" },
    ],
    correctOptionId: "C",
    difficulty: "FACIL",
  },
  {
    subjectName: "Direito Administrativo",
    statement:
      "O que caracteriza o poder de polícia da Administração Pública?",
    options: [
      {
        id: "A",
        text: "A faculdade de a Administração punir seus próprios servidores",
      },
      {
        id: "B",
        text: "A prerrogativa de restringir e condicionar o exercício de direitos individuais em prol do interesse público",
      },
      {
        id: "C",
        text: "A possibilidade de a Administração celebrar contratos sem licitação",
      },
      {
        id: "D",
        text: "A competência exclusiva da polícia civil e militar",
      },
    ],
    correctOptionId: "B",
    difficulty: "MEDIO",
  },
  {
    subjectName: "Direito Civil",
    statement:
      "Segundo o Código Civil, a personalidade civil da pessoa natural começa:",
    options: [
      { id: "A", text: "Com a concepção" },
      { id: "B", text: "Com o nascimento com vida" },
      { id: "C", text: "Aos 18 anos de idade" },
      { id: "D", text: "Com o registro civil" },
    ],
    correctOptionId: "B",
    difficulty: "FACIL",
  },
  {
    subjectName: "Direito Civil",
    statement:
      "Qual é o prazo geral de prescrição previsto no Código Civil para pretensões não sujeitas a prazo específico?",
    options: [
      { id: "A", text: "3 anos" },
      { id: "B", text: "5 anos" },
      { id: "C", text: "10 anos" },
      { id: "D", text: "15 anos" },
    ],
    correctOptionId: "C",
    difficulty: "MEDIO",
  },
  {
    subjectName: "Direito Penal",
    statement:
      "No Direito Penal brasileiro, o que caracteriza o instituto da legítima defesa?",
    options: [
      {
        id: "A",
        text: "Usar de forma moderada os meios necessários para repelir injusta agressão, atual ou iminente, a direito próprio ou de outrem",
      },
      { id: "B", text: "Cometer um crime para evitar um mal maior" },
      { id: "C", text: "Agir sob coação irresistível" },
      { id: "D", text: "Cumprir estrito dever legal" },
    ],
    correctOptionId: "A",
    difficulty: "MEDIO",
  },
  {
    subjectName: "Direito Penal",
    statement:
      "Qual das alternativas representa uma excludente de ilicitude prevista no Código Penal?",
    options: [
      { id: "A", text: "Erro de tipo" },
      { id: "B", text: "Estado de necessidade" },
      { id: "C", text: "Coação moral irresistível" },
      { id: "D", text: "Inimputabilidade" },
    ],
    correctOptionId: "B",
    difficulty: "FACIL",
  },
];

async function seedGroupQuestions(
  groupSlug: string,
  questions: FixtureQuestion[],
) {
  const group = await prisma.studyGroup.findUniqueOrThrow({
    where: { slug: groupSlug },
  });

  for (const q of questions) {
    const subject = await prisma.subject.upsert({
      where: {
        id: `${group.id}-${q.subjectName}`.replace(/\s+/g, "-").toLowerCase(),
      },
      update: {},
      create: {
        id: `${group.id}-${q.subjectName}`.replace(/\s+/g, "-").toLowerCase(),
        groupId: group.id,
        name: q.subjectName,
        block: "ESPECIFICO",
      },
    });

    const existing = await prisma.question.findFirst({
      where: { groupId: group.id, statement: q.statement },
    });

    if (!existing) {
      await prisma.question.create({
        data: {
          groupId: group.id,
          subjectId: subject.id,
          type: "MULTIPLA_ESCOLHA",
          difficulty: q.difficulty,
          intensity: ["CURTA", "ALMOCO", "FOCO"],
          statement: q.statement,
          options: q.options,
          correctOptionId: q.correctOptionId,
          generatedBy: "fixture",
        },
      });
    }
  }
}

async function main() {
  await prisma.studyGroup.upsert({
    where: { slug: "ti" },
    update: {},
    create: {
      slug: "ti",
      name: "Analista em Tecnologia da Informação",
      description:
        "Trilha de estudos para concursos com perfil de Analista de TI.",
    },
  });

  await prisma.studyGroup.upsert({
    where: { slug: "direito" },
    update: {},
    create: {
      slug: "direito",
      name: "Direito",
      description:
        "Trilha de estudos para concursos e processos seletivos na área de Direito.",
    },
  });

  await seedGroupQuestions("ti", TI_QUESTIONS);
  await seedGroupQuestions("direito", DIREITO_QUESTIONS);

  const EXAM_BOARDS = [
    { slug: "cesgranrio", name: "Cesgranrio" },
    { slug: "fgv", name: "FGV" },
    { slug: "cebraspe", name: "Cebraspe (CESPE)" },
    { slug: "vunesp", name: "VUNESP" },
    { slug: "fcc", name: "Fundação Carlos Chagas (FCC)" },
    { slug: "iades", name: "IADES" },
  ];
  for (const board of EXAM_BOARDS) {
    await prisma.examBoard.upsert({
      where: { slug: board.slug },
      update: {},
      create: board,
    });
  }

  const BADGES = [
    {
      code: "primeira_sessao",
      name: "Primeiro passo",
      description: "Complete sua primeira sessão de estudo.",
      icon: "🎯",
    },
    {
      code: "streak_7",
      name: "Uma semana de foco",
      description: "Estude por 7 dias seguidos.",
      icon: "🔥",
    },
    {
      code: "streak_30",
      name: "Disciplina de ferro",
      description: "Estude por 30 dias seguidos.",
      icon: "🏆",
    },
    {
      code: "100_questoes",
      name: "Maratonista",
      description: "Responda 100 questões.",
      icon: "📚",
    },
    {
      code: "gabarito",
      name: "Gabarito",
      description: "Acerte 100% das questões em uma sessão.",
      icon: "⭐",
    },
  ];
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: {},
      create: badge,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
