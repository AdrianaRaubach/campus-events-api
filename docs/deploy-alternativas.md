# Parte B — Pesquisa sobre alternativas de deploy

Este documento compara a estratégia usada na Parte A (**Render**, PaaS) com duas alternativas que seguem abordagens arquiteturais diferentes para publicar a Campus Events API:

1. [VPS com Docker Compose e Nginx](#alternativa-1--vps-com-docker-compose-e-nginx): infraestrutura autogerenciada (IaaS)
2. [AWS ECS Fargate + RDS](#alternativa-2--aws-ecs-fargate--rds): orquestração de containers gerenciada em nuvem pública

No fim há uma [tabela comparativa](#comparação-geral) e uma [conclusão](#conclusão).

## Ponto de partida: o que a aplicação precisa

Qualquer alternativa precisa atender ao que o projeto já oferece e exige:

| Item                  | Situação no projeto                                                                  |
| --------------------- | ------------------------------------------------------------------------------------ |
| Runtime               | Node.js 22 (Express 5 + TypeScript compilado com `tsc`)                              |
| Empacotamento         | `Dockerfile` multi-stage (gera `dist/` e copia `migrations/`)                         |
| Banco de dados        | PostgreSQL 17                                                                        |
| Configuração          | `PORT` e `DATABASE_URL` via variáveis de ambiente (validadas em `src/config.ts`)     |
| Migrations            | Executadas automaticamente na inicialização (`applyMigrations` em `src/index.ts`)    |
| Health checks         | `GET /health` (só a API) e `GET /health/deep` (API + conexão com o banco)            |
| CI                    | GitHub Actions (`ci.yml` com build e testes, `lint.yml`)                              |

Como o projeto já tem um `Dockerfile`, as duas alternativas reaproveitam a **mesma imagem** usada no Render. O que muda é onde ela roda, quem cuida da infraestrutura e como o deploy é disparado.

## Referência: estratégia da Parte A (Render)

- **Arquitetura:** PaaS. O Render lê o `render.yaml` (Blueprint), constrói a imagem a partir do `Dockerfile` e cria um Web Service e um PostgreSQL gerenciado.
- **Build/deploy:** automático a cada push na branch configurada (`autoDeploy: true`).
- **Variáveis/secrets:** `DATABASE_URL` é injetada pelo Blueprint (`fromDatabase`); outras ficam no painel ou em Environment Groups.
- **Health check:** `healthCheckPath: /health/deep`. Uma nova versão só recebe tráfego se responder com sucesso.
- **Rollback:** pelo painel, em *Events*, dá para fazer rollback para um deploy anterior com um clique.
- **Limitações do plano gratuito:** o serviço hiberna quando fica ocioso (cold start de ~1 min), o banco expira em 30 dias e há pouco controle sobre a infraestrutura.

---

## Alternativa 1 — VPS com Docker Compose e Nginx

### Arquitetura geral

Uma única máquina virtual (VPS) Linux, contratada em provedores como DigitalOcean, Hetzner, Contabo, AWS Lightsail ou Oracle Cloud (que tem camada gratuita), roda todos os componentes como containers orquestrados pelo **Docker Compose**:

```
                  Internet
                     │  HTTPS :443 / HTTP :80
                     ▼
┌──────────────────────── VPS (Ubuntu) ────────────────────────┐
│                                                              │
│   ┌──────────────┐   proxy_pass    ┌────────────────────┐    │
│   │    Nginx     │ ──────────────► │  api (Node 22)     │    │
│   │ TLS (Let's   │   :3000         │  imagem do         │    │
│   │ Encrypt)     │                 │  Dockerfile        │    │
│   └──────────────┘                 └─────────┬──────────┘    │
│                                              │ rede interna  │
│                                              ▼ do Docker     │
│                                    ┌────────────────────┐    │
│                                    │  postgres:17       │    │
│                                    │  volume persistente│    │
│                                    └────────────────────┘    │
│   firewall (ufw): libera apenas 22, 80 e 443                 │
└──────────────────────────────────────────────────────────────┘
```

### Principais ferramentas e serviços

- **VPS Linux** (ex.: Ubuntu 24.04), com acesso por SSH usando chave.
- **Docker + Docker Compose**, que orquestram API, banco e proxy.
- **Nginx** como proxy reverso: termina o TLS, repassa as requisições para a API e pode aplicar limite de requisições e compressão.
- **Certbot / Let's Encrypt** para certificados HTTPS gratuitos. O Caddy é uma opção que já faz isso sozinho.
- **GitHub Actions** para o build da imagem e o deploy via SSH.
- **GitHub Container Registry (GHCR)** para armazenar as imagens versionadas.
- **ufw/fail2ban** para firewall e proteção básica do SSH.

### Onde a API e o banco rodam

Os dois rodam **na mesma VPS**, em containers separados. O PostgreSQL usa um **volume Docker** para persistir os dados e **não expõe a porta 5432** para fora; só a rede interna do Compose tem acesso a ele. Quando o projeto crescer, o banco pode ir para um serviço gerenciado (DigitalOcean Managed DB, Neon, Supabase etc.) bastando trocar a `DATABASE_URL`.

Exemplo de `docker-compose.prod.yml`:

```yaml
services:
  api:
    image: ghcr.io/<org>/campus-events-api:${IMAGE_TAG:-latest}
    restart: unless-stopped
    env_file: .env.production
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      # a imagem node:22-slim não tem curl, então usamos o próprio Node
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/health/deep').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3

  db:
    image: postgres:17
    restart: unless-stopped
    env_file: .env.db
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER}"]
      interval: 10s
      retries: 5

  nginx:
    image: nginx:stable
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on: [api]

volumes:
  pgdata:
```

### Processo de build e deploy

1. Um push na `main` dispara o workflow de CI que já existe (lint, build e testes).
2. Se o CI passar, um job de deploy faz `docker build` com o `Dockerfile` atual e publica a imagem no GHCR com duas tags: o **SHA do commit** (imutável) e `latest`.
3. O job conecta na VPS por SSH (ex.: `appleboy/ssh-action`) e roda:
   ```bash
   cd /opt/campus-events
   IMAGE_TAG=<sha> docker compose -f docker-compose.prod.yml pull api
   IMAGE_TAG=<sha> docker compose -f docker-compose.prod.yml up -d api
   ```
4. A API sobe, aplica as migrations pendentes e o Docker passa a monitorar o `/health/deep`.
5. Um último passo do workflow faz `curl -f https://<dominio>/health/deep` para validar o deploy. Se falhar, o job falha e o rollback é disparado.

Observação: com um único container da API, o `up -d` causa alguns segundos de indisponibilidade. Para ter *zero downtime* seria preciso rodar duas réplicas atrás do Nginx (blue/green) ou usar ferramentas como **Kamal** ou **Dokku**, que automatizam isso.

### Variáveis de ambiente e secrets

- **Na VPS:** arquivos `.env.production` e `.env.db` em `/opt/campus-events`, com `chmod 600`, pertencentes a um usuário sem privilégios e **fora do repositório**. Eles contêm `DATABASE_URL`, `PORT`, `NODE_ENV`, `POSTGRES_PASSWORD` etc.
- **No GitHub:** *Repository/Environment Secrets* guardam a chave SSH privada, o host da VPS e o token do GHCR. O workflow lê esses valores sem expô-los nos logs.
- Para mais segurança dá para usar **Docker secrets**, **SOPS + age** (arquivos `.env` criptografados versionados no repositório) ou um cofre externo como Doppler ou Infisical.
- Ao contrário do Render, **ninguém injeta a connection string automaticamente**: a dupla gera e rotaciona as senhas por conta própria.

### Possibilidade de rollback

- **Aplicação:** como cada imagem tem a tag do SHA do commit, o rollback é subir a tag anterior:
  ```bash
  IMAGE_TAG=<sha-anterior> docker compose -f docker-compose.prod.yml up -d api
  ```
  Isso pode virar um workflow `workflow_dispatch` ("Rollback") que recebe o SHA como parâmetro.
- **Banco:** as migrations rodam no startup e só avançam. Uma versão antiga da API precisa continuar compatível com o schema novo, então as migrations devem ser **retrocompatíveis** (ex.: adicionar a coluna primeiro e remover só depois). Se for necessário, o `node-pg-migrate` permite rodar `down` manualmente.
- **Dados:** backups agendados com `pg_dump` (cron) enviados para um armazenamento externo (S3, Backblaze B2), além de snapshots da VPS oferecidos pelo provedor.

### Vantagens

- **Custo baixo e previsível:** uma VPS pequena (1–2 vCPU, 2 GB RAM) custa poucos dólares por mês e roda API e banco juntos, **sem hibernar e sem expirar** como o plano gratuito do Render.
- **Controle total:** versão do Postgres, configuração do Nginx, logs, cron e acesso SSH para depurar.
- **Portabilidade:** é só Docker. A mesma configuração funciona em qualquer provedor e é muito parecida com o `docker-compose.yml` de desenvolvimento.
- **Didático:** mostra camadas que o PaaS esconde (proxy reverso, TLS, firewall, rede, volumes).

### Limitações

- **A dupla vira responsável pela operação:** atualizações de segurança do SO, renovação de certificados, monitoramento, backups e hardening do SSH.
- **Ponto único de falha:** se a VPS cair, API e banco caem juntos. Não há alta disponibilidade nem escalonamento automático.
- **O deploy simples tem downtime curto.** Zero downtime exige configuração extra (blue/green, Kamal).
- **Health check sem ação automática:** o Docker marca o container como `unhealthy`, mas não reverte para a versão anterior sozinho. Isso precisa ser feito no script ou no workflow.

### Complexidade comparada ao Render

**Média.** O Dockerfile é reaproveitado, mas a dupla precisaria configurar servidor, firewall, Nginx, TLS, secrets, backups e o pipeline de deploy, tarefas que no Render se resolvem com o `render.yaml` e alguns cliques. Estimativa: de algumas horas a um dia para a primeira configuração, contra menos de uma hora no Render.

---

## Alternativa 2 — AWS ECS Fargate + RDS

### Arquitetura geral

Uma arquitetura de nuvem pública com serviços gerenciados e separados por responsabilidade. A API roda em containers **serverless** (Fargate, sem servidores para administrar), atrás de um **Application Load Balancer**, e o banco fica em um **RDS for PostgreSQL** em sub-rede privada:

```
                         Internet
                            │ HTTPS
                            ▼
                 ┌─────────────────────┐   certificado: ACM
                 │ Application Load    │   domínio: Route 53
                 │ Balancer (ALB)      │   health check: /health/deep
                 └──────────┬──────────┘
   VPC                      │
  ┌─────────────────────────┼──────────────────────────────────┐
  │  sub-redes privadas     ▼                                  │
  │   ┌────────────────┐  ┌────────────────┐                   │
  │   │ ECS Task       │  │ ECS Task       │  ← ECS Service    │
  │   │ (Fargate) AZ-a │  │ (Fargate) AZ-b │    (2+ réplicas,  │
  │   └───────┬────────┘  └───────┬────────┘     auto scaling) │
  │           └─────────┬─────────┘                            │
  │                     ▼  Security Group: só 5432 vindo da API│
  │            ┌──────────────────┐                            │
  │            │ RDS PostgreSQL 17│  backups automáticos,      │
  │            │ (Multi-AZ opc.)  │  snapshots, PITR           │
  │            └──────────────────┘                            │
  └────────────────────────────────────────────────────────────┘
   Imagens: Amazon ECR · Secrets: Secrets Manager / SSM · Logs: CloudWatch
```

### Principais ferramentas e serviços

| Serviço                                   | Papel                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| **Amazon ECR**                            | Registry privado das imagens Docker                                    |
| **Amazon ECS (Fargate)**                  | Executa e mantém as tasks (containers) da API sem gerenciar servidores |
| **Application Load Balancer**             | Distribui o tráfego entre as tasks e faz o health check               |
| **Amazon RDS for PostgreSQL**             | Banco gerenciado com backups, patches e failover opcional              |
| **AWS Secrets Manager / SSM Parameter Store** | Armazenamento de secrets (senha e URL do banco)                    |
| **AWS Certificate Manager + Route 53**    | Certificado TLS gratuito e DNS                                         |
| **Amazon CloudWatch**                     | Logs (os logs Pino da API saem em JSON) e métricas/alarmes             |
| **IAM**                                   | Permissões da task e do pipeline (OIDC com o GitHub)                   |
| **Terraform / AWS CDK** (opcional)        | Infraestrutura como código, papel parecido com o do `render.yaml`      |

### Onde a API e o banco rodam

- **API:** em *tasks* do ECS no Fargate, em sub-redes privadas de uma VPC, distribuídas em pelo menos duas Availability Zones. Apenas o ALB fica exposto à internet.
- **Banco:** em uma instância **RDS PostgreSQL** em sub-rede privada, sem IP público. O Security Group só aceita conexões na porta 5432 vindas do Security Group das tasks da API.

### Processo de build e deploy

Pipeline no GitHub Actions usando as actions oficiais da AWS:

1. Push na `main` → CI atual (lint, build, testes).
2. `aws-actions/configure-aws-credentials` autentica via **OIDC**, sem chaves de acesso fixas guardadas no GitHub.
3. `aws-actions/amazon-ecr-login`, seguido de `docker build` e `docker push` para o ECR com a tag do **SHA do commit**.
4. `aws-actions/amazon-ecs-render-task-definition` gera uma nova **revisão da task definition** apontando para a imagem nova.
5. `aws-actions/amazon-ecs-deploy-task-definition` atualiza o ECS Service com `wait-for-service-stability: true`.
6. O ECS faz um **rolling update**: sobe as tasks novas, espera o ALB considerar `/health/deep` saudável, transfere o tráfego e só então encerra as antigas, **sem downtime**.

Alternativa: **AWS CodePipeline + CodeBuild** em vez do GitHub Actions, ou **CodeDeploy** para fazer deploy blue/green com troca de tráfego no ALB.

Com várias réplicas, todas executariam `applyMigrations` no startup ao mesmo tempo. O ideal é mover as migrations para uma **task separada** (`aws ecs run-task`) rodada pelo pipeline antes de atualizar o serviço. Outra opção é contar com o lock de migração do `node-pg-migrate`.

### Variáveis de ambiente e secrets

- **Variáveis não sensíveis** (`NODE_ENV`, `PORT`) ficam em `environment` na task definition.
- **Secrets** (`DATABASE_URL`, ou usuário e senha separados) ficam no **Secrets Manager** ou no **SSM Parameter Store** (SecureString) e são referenciados em `secrets` na task definition:
  ```json
  "secrets": [
    { "name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:sa-east-1:<conta>:secret:campus-events/db-url" }
  ]
  ```
  O ECS lê o valor no momento em que a task inicia e o entrega como variável de ambiente. O código da API **não muda**, porque ele continua lendo `process.env.DATABASE_URL`.
- O acesso é controlado por IAM: só a *task execution role* pode ler esses secrets. O RDS pode gerar e **rotacionar automaticamente** a senha do usuário master no Secrets Manager.
- No GitHub fica só o ARN da role usada no OIDC, nenhuma senha.

### Possibilidade de rollback

- **Automático:** o ECS tem o **deployment circuit breaker** (`deploymentCircuitBreaker: { enable: true, rollback: true }`). Se as tasks novas não ficarem saudáveis no health check do ALB, o ECS **volta sozinho** para a última revisão estável.
- **Manual:** toda task definition é versionada (`campus-events-api:12`, `:13`...). Basta apontar o serviço para a revisão anterior:
  ```bash
  aws ecs update-service --cluster campus-events --service api --task-definition campus-events-api:12
  ```
- **Blue/green com CodeDeploy:** a versão antiga continua rodando por um tempo depois da troca, e o rollback é só redirecionar o tráfego de volta.
- **Banco:** backups automáticos do RDS com **point-in-time recovery** e snapshots manuais antes de migrations arriscadas. A recomendação de manter migrations retrocompatíveis continua valendo.

### Vantagens

- **Alta disponibilidade e escalabilidade:** várias réplicas em AZs diferentes, auto scaling por CPU ou requisições e RDS Multi-AZ opcional.
- **Deploy sem downtime e rollback automático** de forma nativa.
- **Segurança de nível corporativo:** rede privada, IAM granular, secrets com rotação, auditoria com CloudTrail.
- **Sem servidores para administrar:** a AWS cuida do SO, dos patches do Fargate e do banco.
- **Padrão de mercado:** muito usado em empresas, o que torna o aprendizado relevante para o currículo.

### Limitações

- **Custo:** ALB, Fargate, RDS e NAT Gateway (ou VPC endpoints) geram cobrança mesmo com pouco tráfego. Para um projeto acadêmico pode passar facilmente de dezenas de dólares por mês, e a camada gratuita da AWS é limitada e temporária.
- **Curva de aprendizado alta:** VPC, sub-redes, Security Groups, IAM, task definitions, ALB e target groups são muitos conceitos antes do primeiro deploy funcionar.
- **Configuração verbosa:** sem infraestrutura como código (Terraform/CDK), a configuração manual no console é difícil de reproduzir. Com IaC, há mais um código para manter.
- **Dependência do provedor (lock-in):** a imagem Docker é portátil, mas a infraestrutura em volta (ECS, IAM, Secrets Manager) é específica da AWS.
- **Exagero para o porte atual:** a Campus Events API é uma aplicação pequena, e boa parte dos recursos só compensa com tráfego e equipe maiores.

### Complexidade comparada ao Render

**Alta.** No Render, um arquivo de 20 linhas cria API, banco, injeção de `DATABASE_URL`, health check e deploy automático. Na AWS, a mesma coisa envolve de 8 a 10 serviços configurados e integrados, permissões IAM e um pipeline com várias etapas. Em troca, a AWS entrega alta disponibilidade, escalabilidade e controle que o Render não oferece no plano gratuito.

---

## Comparação geral

| Critério                    | Render (Parte A)                    | VPS + Docker + Nginx                     | AWS ECS Fargate + RDS                         |
| --------------------------- | ----------------------------------- | ---------------------------------------- | --------------------------------------------- |
| Modelo                      | PaaS                                | IaaS autogerenciado                      | Containers gerenciados (CaaS) em nuvem pública |
| Onde roda a API             | Web Service do Render               | Container na VPS                         | Tasks Fargate em sub-redes privadas           |
| Onde roda o banco           | PostgreSQL gerenciado do Render     | Container Postgres na mesma VPS (volume) | Amazon RDS (privado, opcionalmente Multi-AZ)  |
| Build                       | Render constrói do `Dockerfile`     | GitHub Actions → GHCR                    | GitHub Actions → ECR                          |
| Deploy                      | Automático no push                  | SSH + `docker compose up -d`             | Rolling update / blue-green no ECS            |
| Secrets                     | Painel / `fromDatabase`             | `.env` no servidor + GitHub Secrets      | Secrets Manager / SSM + IAM                   |
| Health check                | `/health/deep` antes de liberar     | `HEALTHCHECK` do Docker + `curl` no CI   | Target group do ALB em `/health/deep`         |
| Rollback                    | 1 clique no painel                  | Subir a tag de imagem anterior (manual/script) | Automático (circuit breaker) ou revisão anterior |
| Downtime no deploy          | Não                                 | Alguns segundos (sem blue/green)         | Não                                           |
| Escalabilidade              | Vertical/horizontal (planos pagos)  | Limitada a uma máquina                   | Auto scaling horizontal                       |
| Custo para o projeto        | Gratuito (com hibernação e banco por 30 dias) | Baixo e fixo                   | Mais alto e variável                          |
| Esforço de operação         | Muito baixo                         | Alto (SO, TLS, backup)                   | Médio (infra gerenciada, mas complexa)        |
| **Complexidade de setup**   | **Baixa**                           | **Média**                                | **Alta**                                      |

## Conclusão

Para o tamanho atual da Campus Events API, o **Render** foi a escolha mais adequada na Parte A: com o `Dockerfile` e o `render.yaml` já existentes, a dupla teve URL pública, banco gerenciado, injeção da `DATABASE_URL`, health check e rollback praticamente sem esforço de infraestrutura. As principais desvantagens são as limitações do plano gratuito (hibernação e expiração do banco).

- A **VPS com Docker e Nginx** seria o caminho natural se o projeto precisasse ficar no ar por mais tempo com custo baixo e sem hibernação. Em troca, a dupla assumiria a operação do servidor.
- O **AWS ECS Fargate + RDS** faz sentido quando a aplicação precisa de alta disponibilidade, escalonamento e requisitos de segurança e auditoria, como em um ambiente de produção de uma instituição. O custo e a complexidade, porém, são desproporcionais para um projeto acadêmico.

Como as três abordagens partem do mesmo `Dockerfile` e da mesma configuração por variáveis de ambiente (`PORT`, `DATABASE_URL`), migrar de uma para outra exigiria mudar **apenas a infraestrutura, não o código da aplicação**. Esse é um benefício direto de seguir as práticas trabalhadas em aula: containerização, configuração externa ao código e health checks padronizados.

## Referências

- Render: [Blueprints (render.yaml)](https://render.com/docs/blueprint-spec), [Health checks](https://render.com/docs/health-checks), [Rollbacks](https://render.com/docs/rollbacks)
- Docker: [Compose file reference](https://docs.docker.com/reference/compose-file/), [HEALTHCHECK](https://docs.docker.com/reference/dockerfile/#healthcheck)
- Nginx: [Reverse proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/) · [Certbot](https://certbot.eff.org/)
- Kamal: [kamal-deploy.org](https://kamal-deploy.org/)
- AWS: [Amazon ECS on Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html), [Passing secrets to ECS containers](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data.html), [Deployment circuit breaker](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html), [Amazon RDS for PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- GitHub Actions: [Deploying to Amazon ECS](https://docs.github.com/en/actions/use-cases-and-examples/deploying/deploying-to-amazon-elastic-container-service), [OIDC na AWS](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
