# Campus Events API — Documentação final

Projeto Integrador desenvolvido por **Adriana Raubach** e **Guilherme Fagundes**.

- **Repositório:** https://github.com/AdrianaRaubach/campus-events-api
- **Ambiente publicado:** https://campus-events-api-x3ci.onrender.com/

## Sumário

1. [Objetivo e contexto](#1-objetivo-e-contexto)
2. [Origem do código e contribuição da dupla](#2-origem-do-código-e-contribuição-da-dupla)
3. [Funcionalidades implementadas](#3-funcionalidades-implementadas)
4. [Tecnologias utilizadas](#4-tecnologias-utilizadas)
5. [Arquitetura](#5-arquitetura)
6. [Configuração e execução local](#6-configuração-e-execução-local)
7. [Variáveis de ambiente](#7-variáveis-de-ambiente)
8. [Banco de dados](#8-banco-de-dados)
9. [Docker e Docker Compose](#9-docker-e-docker-compose)
10. [Endpoints](#10-endpoints)
11. [Estratégia de testes](#11-estratégia-de-testes)
12. [Integração Contínua](#12-integração-contínua)
13. [Ambiente publicado e validação](#13-ambiente-publicado-e-validação)
14. [Decisões técnicas](#14-decisões-técnicas)
15. [Dificuldades e soluções](#15-dificuldades-e-soluções)
16. [Limitações e evolução](#16-limitações-e-evolução)

---

## 1. Objetivo e contexto

A **Campus Events API** é uma API REST para gerenciar eventos acadêmicos de um campus: cadastrar pessoas, criar eventos (data, local e capacidade) e controlar as inscrições dos participantes, com verificação de duplicidade e de lotação.

O projeto foi desenvolvido na disciplina como Projeto Integrador, com foco em práticas de engenharia de software: desenvolvimento colaborativo (issues, branches, Pull Requests), testes automatizados, Integração Contínua, containers e deploy em ambiente publicado.

**Estado atual:** o recurso **pessoas** (`people`) está implementado e publicado. Os recursos de **eventos** e **inscrições** estão planejados e ainda não foram implementados (ver [seção 16](#16-limitações-e-evolução)).

## 2. Origem do código e contribuição da dupla

O repositório é um *fork* do template [`miikkaylisiurunen/template-node-express`](https://github.com/miikkaylisiurunen/template-node-express). A estrutura inicial (Express, TypeScript, PostgreSQL, Vitest, Pino, Dockerfile, workflows) **vem do template** e não foi escrita pela dupla. Esta documentação trata como contribuição da dupla somente o que foi commitado a partir do fork.

### Commits da dupla

| Autoria            | Commit    | Data       | Branch                             | Mensagem                                                   |
| ------------------ | --------- | ---------- | ---------------------------------- | ---------------------------------------------------------- |
| Adriana Raubach    | `0a657c8` | 2026-09-16 | `refactor/expose-person-id` | refactor: expõe id no recurso people                           |
| Guilherme Fagundes | `240c91d` | 2026-09-17 | `docs/update-readme-campus-events` | docs: update README and package.json for Campus Events API     |
| Adriana Raubach    | `ce76847` | 2026-10-21 | `feat/ci-evolution` | ci: evolui pipeline com cache npm e relatório de cobertura     |
| Adriana Raubach    | `57e836d` | 2026-11-15 | `feat/deploy-render` | chore: adiciona configuração de deploy no Render               |
| Adriana Raubach    | `580509e` | 2026-11-15 | `feat/deploy-render` | docs: documenta deploy no Render e evidências de validação     |
| Guilherme Fagundes | `8624cc7` | 2026-11-15 | `feat/deploy-render` | docs: adiciona pesquisa de alternativas de deploy              |

### Branches e situação

| Branch                              | Conteúdo                                              | Autoria            | Situação na `main` |
| ----------------------------------- | ----------------------------------------------------- | ------------------ | ------------------ |
| `refactor/expose-person-id`         | `id` em pessoas e `GET /people/:id`                   | Adriana            | Integrada (PR #7)  |
| `docs/update-readme-campus-events`  | README e `package.json` para o domínio do projeto     | Guilherme          | **Ainda não integrada** |
| `feat/ci-evolution`                 | Cache de npm, cobertura de testes e artefato no CI    | Adriana            | Integrada (PR #9)  |
| `feat/deploy-render`                | Deploy no Render e pesquisa de alternativas           | Adriana e Guilherme | Integrada (PR #10, mesclado por Guilherme) |
| `feat/documentacao-final`           | Esta documentação                                     | —                  | Em andamento       |

> O único conteúdo que ainda não está na `main` é o da branch `docs/update-readme-campus-events` (nome do pacote, descrição e README voltados ao domínio de eventos). Até o merge, o `package.json` e o início do README ainda trazem o texto original do template.

### Pull Requests

Todos os Pull Requests abertos no repositório da dupla (dados do GitHub em 2026-11-25):

| PR | Título | Branch | Aberto por | Situação | Integrado por | Issue relacionada | Checks de CI |
| -- | ------ | ------ | ---------- | -------- | ------------- | ----------------- | ------------ |
| [#7](https://github.com/AdrianaRaubach/campus-events-api/pull/7) | refactor: Expor id no recurso people e preparar entidade para relacionamento com eventos | `refactor/expose-person-id` | AdrianaRaubach | Mesclado em 2026-11-25 | AdrianaRaubach | #3 | — |
| [#8](https://github.com/AdrianaRaubach/campus-events-api/pull/8) | docs: update README and package.json for Campus Events API | `docs/update-readme-campus-events` | gui-fagundes | **Aberto** | — | #1 | — |
| [#9](https://github.com/AdrianaRaubach/campus-events-api/pull/9) | ci: evolui pipeline com cache npm e relatório de cobertura | `feat/ci-evolution` | gui-fagundes | Mesclado em 2026-11-25 | AdrianaRaubach | — | 10/10 |
| [#10](https://github.com/AdrianaRaubach/campus-events-api/pull/10) | Deploy no Render e pesquisa de alternativas de deploy | `feat/deploy-render` | gui-fagundes | Mesclado em 2026-11-16 | gui-fagundes | — | 5/5 |

- Autoria dos commits: o PR #7 e o PR #9 têm commits de Adriana; o PR #8 tem commit de Guilherme; o PR #10 tem dois commits de Adriana e um de Guilherme. Os PRs #8, #9 e #10 constam no GitHub como abertos por `gui-fagundes`.
- Os PRs #7 e #9 foram mesclados por Adriana, e o #10 por Guilherme.
- No PR #8, Adriana registrou uma revisão confirmando que o conteúdo atende aos critérios da issue #1 (nome e descrição no README e no `package.json`). O PR segue aberto.

### Issues

| Issue | Título | Aberta por | Situação |
| ----- | ------ | ---------- | -------- |
| [#1](https://github.com/AdrianaRaubach/campus-events-api/issues/1) | docs: Atualizar README para refletir o domínio Campus Events API | AdrianaRaubach | Fechada |
| [#2](https://github.com/AdrianaRaubach/campus-events-api/issues/2) | feat: Implementar inscrições de participantes em eventos (Registrations) | AdrianaRaubach | Aberta |
| [#3](https://github.com/AdrianaRaubach/campus-events-api/issues/3) | refactor: Expor id no recurso people e preparar entidade para relacionamento com eventos | AdrianaRaubach | Fechada |
| [#4](https://github.com/AdrianaRaubach/campus-events-api/issues/4) | Feature: implementar CRUD de eventos com validação de campos | gui-fagundes | Aberta |
| [#5](https://github.com/AdrianaRaubach/campus-events-api/issues/5) | Testes: ampliar cobertura de integração da API para rotas e regras críticas | gui-fagundes | Aberta |
| [#6](https://github.com/AdrianaRaubach/campus-events-api/issues/6) | Infraestrutura: padronizar e documentar a configuração de ambiente do projeto | gui-fagundes | Aberta |

## 3. Funcionalidades implementadas

| Funcionalidade                                       | Situação                                        |
| ---------------------------------------------------- | ----------------------------------------------- |
| Cadastro de pessoas (`POST /people`)                 | Na `main`                                       |
| Listagem de pessoas (`GET /people`)                  | Na `main`                                       |
| Busca de pessoa por id com 404 (`GET /people/:id`)   | Na `main` (branch `refactor/expose-person-id`, PR #7) |
| `id` retornado nas respostas de pessoas              | Na `main` (branch `refactor/expose-person-id`, PR #7) |
| Health check simples e com banco (`/health`, `/health/deep`) | Na `main`                               |
| Pipeline de CI com cobertura de testes               | Na `main` (branch `feat/ci-evolution`, PR #9) |
| Deploy publicado no Render com PostgreSQL gerenciado | Na `main` (branch `feat/deploy-render`, PR #10) |
| Pesquisa comparativa de alternativas de deploy       | Na `main` (branch `feat/deploy-render`; [docs/deploy-alternativas.md](deploy-alternativas.md)) |

## 4. Tecnologias utilizadas

| Camada                | Tecnologia                                              |
| --------------------- | ------------------------------------------------------- |
| Linguagem / runtime   | TypeScript, Node.js 22 (compatível com 20+)             |
| Framework web         | Express 5                                               |
| Banco de dados        | PostgreSQL 17, driver `pg`                              |
| Migrations            | `node-pg-migrate`                                       |
| Validação             | Zod                                                     |
| Logs                  | Pino e `pino-http`                                      |
| Testes                | Vitest, Supertest e cobertura `@vitest/coverage-v8`     |
| Qualidade de código   | ESLint e Prettier                                       |
| Containers            | Docker (Dockerfile multi-stage) e Docker Compose        |
| CI                    | GitHub Actions                                          |
| Deploy                | Render (Blueprint `render.yaml`)                        |

## 5. Arquitetura

A aplicação é um monólito em camadas, com injeção de dependências simples.

```mermaid
flowchart LR
    Client[Cliente HTTP] --> Routes[Rotas<br/>src/routes]
    Routes --> Controllers[Controllers<br/>src/controllers]
    Controllers --> Queries[Queries<br/>src/database/queries.ts]
    Queries --> Pool[(Pool pg)]
    Pool --> DB[(PostgreSQL)]
    MW[Middleware<br/>logger e erros] -.-> Routes
    Index[index.ts<br/>raiz de composição] -->|migrations| DB
```

| Componente                    | Responsabilidade                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `src/index.ts`                | Lê a configuração, aplica as migrations, monta as dependências e sobe o servidor  |
| `src/config.ts`               | Lê e valida as variáveis de ambiente com Zod                                      |
| `src/app.ts`                  | Monta o app Express a partir de `queries` e `middleware` (injetados)              |
| `src/routes/`                 | Define as rotas HTTP (`people`, `health`)                                         |
| `src/controllers/`            | Valida a entrada (Zod), chama as queries e responde                               |
| `src/database/`               | Pool de conexões, queries SQL, tipos/schemas e execução das migrations            |
| `src/middleware/`             | Log de requisições (Pino) e tratamento centralizado de erros                      |
| `src/errors/`                 | Classe `HttpError` para erros com status HTTP                                     |
| `migrations/`                 | Scripts SQL de criação do schema                                                  |

Como `makeApp` recebe `queries` por injeção, os testes de rota podem substituir a camada de banco quando necessário (por exemplo, para simular falha de conexão em `/health/deep`).

## 6. Configuração e execução local

**Requisitos:** Node.js 20 ou superior (o `.nvmrc` indica a versão 22) e Docker.

```bash
git clone https://github.com/AdrianaRaubach/campus-events-api.git
cd campus-events-api
cp .env.example .env     # no PowerShell: Copy-Item .env.example .env
npm install
npm run db:up            # sobe os bancos de dev e de teste
npm run dev              # servidor em http://localhost:3001
```

As migrations são aplicadas automaticamente quando a API inicia.

### Scripts

| Script                  | Função                                               |
| ----------------------- | ---------------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento com recarga (`tsx watch`) |
| `npm run build`         | Compila o TypeScript para `dist/`                    |
| `npm start`             | Executa a versão compilada (produção)                |
| `npm test`              | Executa os testes                                    |
| `npm run test:coverage` | Executa os testes com cobertura                      |
| `npm run lint`          | Verifica o código com ESLint                         |
| `npm run db:up` / `db:down` | Sobe / derruba os bancos locais via Docker Compose |

## 7. Variáveis de ambiente

| Variável            | Obrigatória | Uso                                          | Exemplo (`.env.example`)                             |
| ------------------- | ----------- | -------------------------------------------- | ---------------------------------------------------- |
| `PORT`              | Sim         | Porta HTTP da API                            | `3001`                                               |
| `DATABASE_URL`      | Sim         | Conexão com o PostgreSQL da aplicação        | `postgres://api:password@localhost:4329/api_dev`     |
| `TEST_PORT`         | Testes      | Porta usada nos testes                       | `3002`                                               |
| `TEST_DATABASE_URL` | Testes      | Conexão com o banco de testes                | `postgres://api:password@localhost:4328/api_test`    |

- O arquivo `.env` está no `.gitignore` e no `.dockerignore`: **não é versionado nem entra na imagem**.
- A configuração é validada na inicialização (Zod). Se faltar uma variável, a aplicação não sobe.
- No Render, `PORT` é definida pela plataforma e `DATABASE_URL` é injetada pelo Blueprint.

## 8. Banco de dados

- **PostgreSQL 17**, com o schema versionado em `migrations/` e aplicado por `node-pg-migrate` (tabela de controle `migrations`).
- Tabela atual:

```sql
CREATE TABLE people (
  id          INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name        VARCHAR(255) NOT NULL,
  age         INT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

- **Local:** dois containers PostgreSQL via Docker Compose, um de desenvolvimento (`api_dev`, porta 4329) e um de testes (`api_test`, porta 4328), isolados para que os testes não afetem os dados de desenvolvimento.
- **Publicado:** PostgreSQL gerenciado do Render (`campus-events-db`), criado pelo Blueprint.

## 9. Docker e Docker Compose

**Docker Compose** (`docker-compose.yml`) fornece apenas os bancos locais (`postgres-dev` e `postgres-test`, imagem `postgres:17`). A API roda no host com `npm run dev`.

**Dockerfile** multi-stage (`node:22-slim`):

1. **Estágio de build:** `npm ci` com todas as dependências e `npm run build` (tsc).
2. **Estágio final:** `npm ci --omit=dev`, copia apenas `dist/` e `migrations/` e inicia com `npm start`. A imagem de produção não contém ferramentas de desenvolvimento nem código-fonte TypeScript.

Exemplo de execução da imagem localmente (com o banco do Compose ativo; `host.docker.internal` permite ao container alcançar o host no Docker Desktop):

```bash
docker build -t campus-events-api .
docker run --rm -p 3001:3001 -e PORT=3001 \
  -e DATABASE_URL="postgres://api:password@host.docker.internal:4329/api_dev" \
  campus-events-api
```

É essa mesma imagem, construída a partir do `Dockerfile`, que o Render executa no ambiente publicado.

## 10. Endpoints

| Método | Rota             | Descrição                                       | Situação                           |
| ------ | ---------------- | ----------------------------------------------- | ---------------------------------- |
| GET    | `/health`        | Status da API                                   | `main`                             |
| GET    | `/health/deep`   | Status da API e conexão com o banco (503 se falhar) | `main`                         |
| GET    | `/people`        | Lista pessoas                                   | `main`                             |
| POST   | `/people`        | Cadastra pessoa (`name` e `age`)                | `main`                             |
| GET    | `/people/:id`    | Busca pessoa por id (404 se não existir)        | `main` (branch `refactor/expose-person-id`) |

Exemplos (substitua pela URL local ou pela pública):

```bash
curl https://campus-events-api-x3ci.onrender.com/health
# {"status":"healthy","timestamp":"2026-11-15T..."}

curl -X POST https://campus-events-api-x3ci.onrender.com/people \
  -H "Content-Type: application/json" \
  -d '{"name":"Adriana","age":31}'

curl https://campus-events-api-x3ci.onrender.com/people
```

**No PowerShell** o `curl` é um apelido de `Invoke-WebRequest` e não aceita essa sintaxe. Use `curl.exe` ou `Invoke-RestMethod`:

```powershell
Invoke-RestMethod -Method Post -Uri https://campus-events-api-x3ci.onrender.com/people `
  -ContentType "application/json" -Body '{"name":"Adriana","age":31}'
```

**Formato dos erros** (tratamento centralizado):

```json
{ "status": 400, "message": "Invalid request", "name": "ZodError" }
```

| Situação                          | Resposta |
| --------------------------------- | -------- |
| Corpo inválido (Zod)              | 400      |
| Rota inexistente                  | 404      |
| Banco indisponível em `/health/deep` | 503   |
| Erro não tratado                  | 500      |

## 11. Estratégia de testes

- **Ferramentas:** Vitest e Supertest.
- **Testes de integração com banco real:** os testes de rotas e de queries usam um PostgreSQL de verdade (o banco `api_test`), em vez de mocks. As migrations são aplicadas antes e revertidas depois da suíte (`up` / `down`), garantindo estado limpo.
- **Execução em um único processo** (`singleFork`), porque os arquivos compartilham o mesmo banco de teste.
- **Níveis:** testes de queries (`src/database/queries.test.ts`) e de rotas HTTP (`src/routes/*.test.ts`), incluindo cenários de falha como o banco indisponível em `/health/deep`.
- **Testes escritos pela dupla** (branch `refactor/expose-person-id`, PR #7): cobrem o `id` nas respostas, `getPersonById` (encontrado e inexistente), o `GET /people/:id` (sucesso, 404 e id inválido) e o `POST /people` ignorando um `id` enviado pelo cliente.

**Como executar:**

```bash
npm run db:up           # banco de testes (porta 4328)
npm test                # modo watch
npx vitest run          # execução única
npm run test:coverage   # com cobertura
```

O relatório de cobertura é gerado em `coverage/` (texto, HTML e lcov), ignorado pelo git.

## 12. Integração Contínua

Os workflows ficam em `.github/workflows/`:

| Workflow   | O que faz                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------- |
| `ci.yml`   | Job **Build** (`npm ci` e `npm run build`) e job **Test**, ambos em Node 20 e 22 (matriz) |
| `lint.yml` | Executa o ESLint com `--max-warnings 0`                                                   |

O job de teste sobe um **PostgreSQL 17 como service container** (`api_test`, porta 4328), reproduzindo o ambiente local.

### Evolução feita pela dupla (branch `feat/ci-evolution`, PR #9)

- **Cache do npm** (`cache: npm` no `setup-node`), reduzindo o tempo de instalação das dependências.
- **Testes com cobertura:** o job de teste passou a executar `npm run test:coverage` (provedor v8, relatórios `text`, `html` e `lcov`, contando apenas arquivos de `src/` e excluindo os `*.test.ts`).
- **Artefato de cobertura:** o relatório é enviado com `actions/upload-artifact` (um por versão do Node), mesmo quando os testes falham (`if: always()`).
- **CI em todas as branches:** o gatilho `push` deixou de ser restrito à `main`, então cada branch recebe feedback antes de abrir o Pull Request.

## 13. Ambiente publicado e validação

- **URL:** https://campus-events-api-x3ci.onrender.com/
- **Plataforma:** Render, plano gratuito.
- **API:** web service Docker, construído a partir do `Dockerfile`, com deploy automático a cada push na `main` (`autoDeploy`) e health check em `/health/deep`.
- **Banco:** PostgreSQL gerenciado do Render (`campus-events-db`), ligado à API pelo Blueprint.
- **Variáveis:** `DATABASE_URL` vinda do banco via `fromDatabase`; `PORT` definida pelo Render; `NODE_ENV=production`.
- **Migrations:** aplicadas automaticamente quando a API inicia.

### Como o ambiente foi criado

1. O `render.yaml` foi versionado (branch `feat/deploy-render`) e integrado à `main` pelo PR #10.
2. No painel do Render: **New → Blueprint**, escolhendo o repositório. O Render criou o web service e o banco.
3. Após o build, o serviço ficou **Live**.

### Como validar

1. `GET /health` deve responder `{"status":"healthy",...}`.
2. `GET /health/deep` deve responder `healthy`, confirmando a conexão com o banco.
3. `POST /people` com `{"name":"Adriana","age":31}` deve criar o registro.
4. `GET /people` deve listar o registro criado, comprovando a persistência.

As evidências (prints do painel e das respostas) estão na seção "Deploy (Render)" do [README](../README.md).

> **Atenção:** no plano gratuito o serviço "dorme" após inatividade (a primeira requisição pode levar cerca de 1 minuto) e o banco gratuito expira 30 dias após a criação.

A pesquisa de alternativas (VPS com Docker Compose e Nginx; AWS ECS Fargate com RDS) está em [deploy-alternativas.md](deploy-alternativas.md).

## 14. Decisões técnicas

Somente decisões tomadas pela dupla a partir do fork.

| Decisão | Motivação | Autoria / origem |
| ------- | --------- | ---------------- |
| **Expor o `id` em pessoas e criar `GET /people/:id`** | As futuras inscrições precisam referenciar `person_id`; sem o `id` na resposta não havia como relacionar pessoa e evento | Adriana, `0a657c8`, branch `refactor/expose-person-id` |
| **Separar os schemas `NewPerson` (entrada) e `Person` (saída, com `id`)** | O cliente não deve enviar o `id`, que é gerado pelo banco; os tipos passam a refletir o que entra e o que sai | Adriana, `0a657c8`, branch `refactor/expose-person-id` |
| **Tratar id inexistente com `HttpError(404)` e validar o parâmetro com Zod** | Reaproveita o tratamento centralizado de erros: id inválido gera 400 e id inexistente gera 404 | Adriana, `0a657c8`, branch `refactor/expose-person-id` |
| **Ajustar nome, descrição e README para o domínio de eventos do campus** | Deixar de apresentar o repositório como template e documentar o escopo planejado (eventos e inscrições) | Guilherme, `240c91d`, branch `docs/update-readme-campus-events` (ainda não integrada) |
| **Cache do npm, cobertura de testes e artefato no CI** | Pipeline mais rápido e visibilidade da cobertura em cada execução | Adriana, `ce76847`, branch `feat/ci-evolution` |
| **CI executado em todos os pushes, não só na `main`** | Detectar falhas nas branches de feature antes do Pull Request | Adriana, `ce76847`, branch `feat/ci-evolution` |
| **Deploy no Render com Blueprint (`render.yaml`)** | Reaproveita o `Dockerfile` sem alterar o código, com banco gerenciado e a infraestrutura descrita em arquivo versionado; o plano gratuito atende ao escopo da disciplina | Adriana, `57e836d`, branch `feat/deploy-render` |
| **Health check do Render em `/health/deep`** | Considera o serviço saudável apenas se o banco responder | Adriana, `57e836d`, branch `feat/deploy-render` |
| **`DATABASE_URL` injetada pelo Blueprint e `PORT` deixada ao Render** | Nenhum segredo no repositório e nenhuma configuração manual no painel | Adriana, `57e836d`, branch `feat/deploy-render` |
| **Documentar alternativas (VPS + Nginx e ECS Fargate + RDS) em vez de implementar** | A Parte B pedia comparação; a pesquisa mostra o que mudaria em arquitetura, secrets, rollback e complexidade | Guilherme, `8624cc7`, branch `feat/deploy-render` |

### Organização do trabalho

- **Branches por tipo** (`feat/`, `refactor/`, `docs/`) e **mensagens de commit no padrão Conventional Commits** (`feat:`, `refactor:`, `ci:`, `chore:`, `docs:`), com corpo explicando o motivo quando necessário.
- **Pull Requests** para integrar na `main` (ver a [tabela de Pull Requests](#pull-requests)) e **Issues** para registrar o trabalho (ver a [tabela de Issues](#issues)).

## 15. Dificuldades e soluções

| Dificuldade | Solução |
| ----------- | ------- |
| Os comandos de validação com `curl -X POST ... -H ...` falharam no PowerShell, onde `curl` é apelido de `Invoke-WebRequest` | Usar `curl.exe` ou `Invoke-RestMethod`; a alternativa foi documentada na [seção 10](#10-endpoints) |
| Havia um `$` sobrando antes da URL nos comandos `curl` do README, o que quebrava a cópia e cola | Corrigido durante a revisão da documentação de deploy |
| O plano gratuito do Render hiberna o serviço, causando a primeira resposta lenta | Registrado na documentação para evitar interpretar a demora como falha na validação |
| O Render acrescenta um sufixo ao nome do banco (`campus_events_eaxj`) | Entendido como comportamento da plataforma: o Blueprint injeta a URL completa, então nada depende do nome |
| Trabalho em branches paralelas gerou alterações no mesmo arquivo (README) | Separar o conteúdo em arquivos (`docs/`) e manter cada branch com escopo único |

## 16. Limitações e evolução

### Limitações atuais

- Apenas o recurso **pessoas** está implementado; **eventos** e **inscrições** (com controle de capacidade e de duplicidade) ainda não existem.
- Sem autenticação e autorização.
- Sem edição e remoção de pessoas, nem paginação ou filtros na listagem.
- Sem documentação interativa da API (OpenAPI/Swagger).
- O pipeline cobre integração contínua, mas não há etapa de deploy própria no GitHub Actions: o deploy é feito pelo `autoDeploy` do Render.
- A cobertura é apenas medida, sem limite mínimo (*threshold*) que falhe o CI.
- As migrations rodam na inicialização da API, o que simplifica o deploy, mas não é o ideal com várias réplicas.
- O ambiente gratuito hiberna e o banco gratuito expira em 30 dias.
- A conexão com o banco não configura SSL no código (o que funciona no Render por usar a rede interna, mas exigiria `sslmode` em bancos como o RDS).
- O rollback é manual (redeploy de uma versão anterior pelo painel).

### Possibilidades de evolução

- Concluir as Issues abertas: #2 (inscrições), #4 (CRUD de eventos), #5 (ampliar a cobertura de testes de integração) e #6 (padronizar a configuração de ambiente).
- Implementar eventos (`POST/GET /events`, `GET /events/:id`) e inscrições (`POST/GET /events/:id/registrations`, `DELETE /events/:id/registrations/:personId`), já planejados.
- Adicionar autenticação (por exemplo JWT) e perfis de organizador e participante.
- Gerar documentação OpenAPI e adicionar paginação.
- Definir limite mínimo de cobertura no CI e executar o deploy a partir do GitHub Actions só após a pipeline passar.
- Rodar as migrations como etapa separada do deploy.
- Migrar para uma das alternativas pesquisadas (VPS com Docker e Nginx ou ECS Fargate com RDS) caso surjam requisitos de disponibilidade e escala.
