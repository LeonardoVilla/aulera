# Pendências — Aulera

Estado em 2026-09-08. Todas as 9 fases do plano original estão implementadas e
commitadas (`git log --oneline` mostra o histórico completo). O que resta é
**ativação de serviços externos** e **melhorias de robustez** — não há
funcionalidade core faltando.

## 1. Ativações pendentes (bloqueiam funcionalidade real em produção)

### Vercel Blob (upload de edital) — EM ANDAMENTO
Sem isso, o upload de PDF de edital falha em produção (o código já está pronto
em `src/lib/blob.ts`).

Passos:
1. Vercel → projeto **aulera** → **Storage** → **Create Database** → **Blob**
2. Nome sugerido: `aulera-editais`
3. Conectar ao projeto (a Vercel injeta `BLOB_READ_WRITE_TOKEN` automaticamente)
4. Redeploy
5. (Opcional) Copiar o token também para o `.env` local, em **Storage → banco
   Blob → aba "Quickstart"/".env.local"**, para poder testar upload rodando
   `pnpm dev` localmente.

### Stripe (billing real) — NÃO INICIADO
Código pronto (`src/actions/billing.ts`, `src/app/api/webhooks/stripe/route.ts`,
`src/lib/features/access-control.ts`), mas sem chaves reais. Hoje
`/conta/assinatura` mostra "pagamento ainda não foi ativado" (fallback
implementado para não quebrar a página).

Passos:
1. Criar conta em [dashboard.stripe.com](https://dashboard.stripe.com) (pode
   ficar em modo **Test** por enquanto — chaves `sk_test_...`)
2. **Products** → criar dois produtos com preço recorrente mensal:
   - "Básico" — R$19,90/mês
   - "Premium" — R$39,90/mês
   - Copiar o `price_id` de cada um (formato `price_...`)
3. **Developers → API keys** → copiar a **Secret key** (`sk_test_...`)
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://aulera.vercel.app/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.payment_failed`
   - Copiar o **Signing secret** do endpoint (`whsec_...`)
5. Preencher no `.env` local e nas Environment Variables da Vercel:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_BASICO=price_...
   STRIPE_PRICE_PREMIUM=price_...
   ```
6. Redeploy
7. Testar localmente com Stripe CLI: `stripe listen --forward-to
   localhost:3000/api/webhooks/stripe` e `stripe trigger
   checkout.session.completed`
8. Quando decidir cobrar de verdade: trocar as chaves de teste (`sk_test_`,
   `price_...` de teste) pelas de produção (`sk_live_`, mesmo fluxo).

### OpenAI (fallback de IA) — CONCLUÍDO ✅
`OPENAI_API_KEY` já configurada e testada localmente e na Vercel. Fallback
automático Gemini → GPT-5 mini funcionando quando o Gemini atinge quota.

### Microsoft Entra ID (login) — CONCLUÍDO ✅
Já funcionando em produção (`https://aulera.vercel.app/login`), com redirect
URI de produção cadastrado no Azure Portal.

## 2. Melhorias de robustez (não bloqueiam uso, mas valem a pena antes de
   escalar para usuários reais)

### Observabilidade / monitoramento de erros
Não há Sentry (ou equivalente) integrado. Hoje, se algo quebrar em produção
para um usuário real, só se descobre se ele reclamar. Recomendado antes de
abrir para usuários externos.

### Testes automatizados
A Fase 9 do plano previa testes E2E (Playwright) dos fluxos críticos
(login → onboarding → sessão de estudo → upload de edital → trilha →
checkout), mas o tempo foi usado na auditoria de segurança em vez disso (que
encontrou e corrigiu 2 vulnerabilidades reais de IDOR — ver commit
`6599a5e`). Sem testes, mudanças futuras podem regredir sem serem percebidas
antes de ir para produção.

### Custo de IA por usuário
O painel `/admin/integracoes` mostra uso agregado de IA (contagem, latência,
taxa de sucesso por operação), mas não quebra por usuário. Antes de calibrar
os limites reais dos planos pagos (`PlanFeature`), pode valer a pena saber
quanto cada usuário está custando em tokens/mês.

### Feedback ao aluno quando a correção de discursiva falha
Se `responderQuestaoDiscursiva` falhar ao chamar a IA (ambos os provedores
indisponíveis), a resposta do aluno é salva mas sem nota/feedback, e ele não
tem como saber que algo deu errado nem pedir para tentar de novo. Vale
adicionar um estado visível ("correção pendente, tente novamente") e um botão
de retry.

## 3. Onde estão as coisas no código (referência rápida)

- Schema completo: `prisma/schema.prisma`
- IA (Gemini + fallback OpenAI): `src/lib/ai/`
- Billing: `src/actions/billing.ts`, `src/lib/stripe/`
- Edital/upload: `src/actions/editais.ts`, `src/lib/blob.ts`, `src/lib/pdf/`
- Trilha: `src/actions/trilhas.ts`, `src/lib/trilha/`
- Admin: `src/app/(app)/admin/`, `src/actions/admin/`
- Todas as variáveis de ambiente necessárias: `.env.example` (comentado)

## 4. Como retomar

1. `git pull` para trazer o estado mais recente
2. `pnpm install` (se for uma máquina nova)
3. Copiar `.env.example` para `.env` e preencher com os valores reais (pedir
   os que faltarem, ou pegar do painel da Vercel em Settings → Environment
   Variables se já estiverem configurados lá)
4. `pnpm dev` para rodar localmente
5. Seguir a ordem de ativação da seção 1 (Vercel Blob → Stripe)
