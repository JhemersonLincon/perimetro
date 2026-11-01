# CRÔNICA — Plataforma Web de Gerenciamento Narrativo de Campanhas de RPG

O **CRÔNICA** é uma plataforma web projetada para organização, documentação histórica e visualização de campanhas de RPG de mesa, tendo como núcleo uma **linha do tempo interativa** capaz de conectar acontecimentos, personagens (PJs), NPCs, localidades, organizações e sessões de jogo com controle granular de visibilidade.

---

## 1. Arquitetura Técnica e Tecnologias

O sistema adota uma arquitetura cliente-servidor em camadas com separação estrita de responsabilidades:

### Front-end (`/frontend`)
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (Identidade visual editorial/investigativa em tema escuro)
- **React Router v6** (Rotas públicas, privadas e layout contextual de campanha)
- **TanStack Query v5** (Gerenciamento de cache, invalidação reativa e sincronização com a API)
- **React Hook Form** + **Zod** (Validação estruturada de formulários)
- **Lucide React** (Ícones vetoriais consistentes)

### Back-end (`/backend`)
- **Python 3.12+** + **FastAPI**
- **SQLAlchemy 2.0** (ORM e modelagem relacional)
- **Pydantic v2** (Schemas de validação de entrada e saída)
- **Alembic** (Versionamento e migrações de banco de dados)
- **PyJWT** + **bcrypt** (Autenticação stateless via JWT e hash seguro de senhas)
- **Pytest** + **HTTPX** (Suíte de testes automatizados de integração)

### Banco de Dados
- **PostgreSQL 16+**

---

## 2. Como Executar o Projeto

### Opção A — Utilizando Docker e Docker Compose (Recomendado)

1. Copie o arquivo de variáveis de ambiente de exemplo:
   ```bash
   cp .env.example .env
   ```
2. Suba os containers (PostgreSQL, Back-end FastAPI com migrações automáticas e Front-end Vite):
   ```bash
   docker compose up --build
   ```
3. Acesse os serviços:
   - **Aplicação Web (Front-end):** `http://localhost:5173`
   - **API REST (Back-end):** `http://localhost:8000/api`
   - **Documentação Interativa (Swagger / OpenAPI):** `http://localhost:8000/docs`

Os dados do PostgreSQL são persistidos no volume Docker `postgres_data`.

---

### Opção B — Execução Local (Desenvolvimento)

#### 1. Banco de Dados PostgreSQL
Certifique-se de possuir uma instância PostgreSQL ativa em `localhost:5432` com o banco `cronica_rpg` e configure a variável `DATABASE_URL` no arquivo `.env`.

#### 2. Back-end (FastAPI + Alembic)
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. Front-end (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 3. Executando os Testes Automatizados

A suíte de testes valida todos os cenários do MVP (Autenticação, Campanhas, Convites e Participantes, Entidades, Linha do Tempo Gregoriana/Fictícia/Sem Data, Sessões, Controle de Visibilidade em 3 Níveis e Isolamento entre Campanhas):

```bash
cd backend
.\.venv\Scripts\pytest.exe -v
```

---

## 4. Decisões Arquiteturais Importantes

1. **Datas Narrativas e Calendários Fictícios (`calendar_utils.py`):**
   - Não utilizamos o tipo `DATE` nativo do banco para datas narrativas, pois campanhas de RPG frequentemente utilizam calendários próprios (com quantidade variável de meses e dias por mês, ou anos negativos/remotos).
   - A tabela `timeline_events` armazena `calendar_type`, `narrative_year`, `narrative_month`, `narrative_day`, `narrative_time`, `narrative_date` (rótulo formatado) e `sort_key` (`BIGINT`).
   - Sempre que um evento é criado/editado — ou quando o Mestre altera a configuração do calendário da campanha — o serviço recalcula `sort_key` com base nos dias acumulados de cada mês do calendário configurado, garantindo ordenação cronológica exata diretamente no SQL.
   - Eventos marcados com `date_is_unknown = true` permanecem com `sort_key = NULL` e são retornados em uma seção separada (`undated_items`), sem atribuição de datas artificiais.

2. **Controle de Visibilidade no Servidor (`public`, `private`, `restricted`):**
   - Aplicado a **Entidades**, **Acontecimentos** e **Sessões**.
   - A filtragem ocorre diretamente nas consultas SQL dos repositórios (`EntityRepository`, `EventRepository`, `SessionRepository`) e nos serviços. Jogadores jamais recebem registros `private` ou registros `restricted` para os quais não estejam explicitamente autorizados na tabela `record_permissions`.

3. **Isolamento Estrito entre Campanhas:**
   - Todas as rotas de campanha validam a participação do usuário (`get_campaign_and_member`).
   - Ao vincular entidades ou sessões a um acontecimento, o serviço verifica se todos os IDs pertencem à mesma campanha, impedindo associações cruzadas entre campanhas distintas.

---

## 5. Principais Endpoints da API REST

### Autenticação (`/api/auth`)
- `POST /api/auth/register` — Cadastro de novo usuário.
- `POST /api/auth/login` — Login com e-mail e senha (retorna JWT).
- `POST /api/auth/logout` — Encerramento de sessão.
- `GET /api/auth/me` — Dados do usuário autenticado.
- `PATCH /api/auth/profile` — Edição de perfil e alteração de senha.
- `POST /api/auth/forgot-password` — Geração de token de recuperação de senha.
- `POST /api/auth/reset-password` — Redefinição de senha com token.

### Campanhas e Participantes (`/api/campaigns`)
- `GET /api/campaigns` — Lista campanhas do usuário autenticado.
- `POST /api/campaigns` — Cria nova campanha (usuário torna-se Mestre `gm`).
- `GET /api/campaigns/{campaign_id}` — Detalhes da campanha.
- `GET /api/campaigns/{campaign_id}/dashboard` — Indicadores reais e atividade recente.
- `PATCH /api/campaigns/{campaign_id}` — Atualiza configurações e calendário (Mestre).
- `DELETE /api/campaigns/{campaign_id}` — Exclui campanha e registros dependentes (Mestre).
- `GET /api/campaigns/{campaign_id}/members` — Lista participantes da campanha.
- `POST /api/campaigns/{campaign_id}/invitations` — Gera convite por e-mail ou código (Mestre).
- `POST /api/invitations/{token}/accept` — Aceita convite e ingressa como Jogador.
- `DELETE /api/campaigns/{campaign_id}/members/{user_id}` — Remove participante (Mestre).

### Entidades (`/api/campaigns/{campaign_id}/entities` e `/api/entities`)
- `GET /api/campaigns/{campaign_id}/entities` — Lista entidades com busca e filtros por categoria, status e visibilidade.
- `POST /api/campaigns/{campaign_id}/entities` — Cadastra entidade (Mestre).
- `GET /api/entities/{entity_id}` — Detalhes da entidade + histórico de acontecimentos e sessões.
- `PATCH /api/entities/{entity_id}` — Edita entidade e permissões (Mestre).
- `DELETE /api/entities/{entity_id}` — Exclui entidade (Mestre).

### Linha do Tempo e Acontecimentos (`/api/campaigns/{campaign_id}/events` e `/api/events`)
- `GET /api/campaigns/{campaign_id}/events` — Lista acontecimentos ordenados cronologicamente com filtros combináveis (`search`, `category`, `character_id`, `npc_id`, `location_id`, `organization_id`, `session_id`, `year_from`, `year_to`, `visibility`, `order`).
- `POST /api/campaigns/{campaign_id}/events` — Cria acontecimento (Mestre).
- `GET /api/events/{event_id}` — Detalhes do acontecimento.
- `PATCH /api/events/{event_id}` — Atualiza acontecimento (Mestre).
- `DELETE /api/events/{event_id}` — Exclui acontecimento (Mestre).

### Sessões (`/api/campaigns/{campaign_id}/sessions` e `/api/sessions`)
- `GET /api/campaigns/{campaign_id}/sessions` — Lista sessões cronologicamente.
- `POST /api/campaigns/{campaign_id}/sessions` — Registra nova sessão com número único na campanha (Mestre).
- `GET /api/sessions/{session_id}` — Detalhes da sessão e acontecimentos associados.
- `PATCH /api/sessions/{session_id}` — Edita sessão (Mestre).
- `POST /api/sessions/{session_id}/events/{event_id}` — Associa acontecimento à sessão (Mestre).
- `DELETE /api/sessions/{session_id}/events/{event_id}` — Remove associação de acontecimento (Mestre).
- `DELETE /api/sessions/{session_id}` — Exclui sessão (Mestre).
