import { prisma } from "../src/lib/prisma";

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
