import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from app.database.base import Base
from app.database.session import get_db
from app.main import app

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://cronica_user:cronica_secret_pass@localhost:5432/cronica_rpg_test",
)

engine_test = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine_test)
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_flexible_multilevel_timeline_complete():
    # 1. Registrar GM e Jogador
    reg_gm = client.post(
        "/api/auth/register",
        json={
            "name": "Mestre Arcano",
            "username": "gm_multilevel",
            "email": "gm_multi@cronica.rpg",
            "password": "secret_password_123",
        },
    )
    assert reg_gm.status_code == 201
    gm_token = reg_gm.json()["access_token"]
    gm_id = reg_gm.json()["user"]["id"]

    reg_player = client.post(
        "/api/auth/register",
        json={
            "name": "Jogador Investigador",
            "username": "player_investigator",
            "email": "player_inv@cronica.rpg",
            "password": "secret_password_123",
        },
    )
    assert reg_player.status_code == 201
    player_token = reg_player.json()["access_token"]
    player_id = reg_player.json()["user"]["id"]

    # 2. Criar Campanha pelo GM
    camp_resp = client.post(
        "/api/campaigns",
        headers=auth_headers(gm_token),
        json={
            "name": "Campanha Arkham 1924",
            "description": "Investigação cósmica com linha do tempo multinível",
            "rpg_system": "Call of Cthulhu",
        },
    )
    assert camp_resp.status_code == 201
    campaign_id = camp_resp.json()["id"]

    # 3. Adicionar Jogador como membro da Campanha
    invite_resp = client.post(
        f"/api/campaigns/{campaign_id}/invitations",
        headers=auth_headers(gm_token),
        json={"email": "player_inv@cronica.rpg"},
    )
    assert invite_resp.status_code == 201
    inv_token = invite_resp.json()["token"]

    accept_resp = client.post(
        f"/api/invitations/{inv_token}/accept",
        headers=auth_headers(player_token),
    )
    assert accept_resp.status_code == 200

    # 4. Inserir Eventos com Níveis de Precisão Diferentes em 1924 e anos negativos
    # Evento Negativo (a.C.)
    evt_bce = client.post(
        f"/api/campaigns/{campaign_id}/events",
        headers=auth_headers(gm_token),
        json={
            "title": "Queda do Meteoro em Atlântida",
            "description": "Cataclismo primordial nas eras antigas.",
            "year": -450,
            "event_type": "canonical",
        },
    )
    assert evt_bce.status_code == 201
    assert evt_bce.json()["year"] == -450
    assert "a.C." in evt_bce.json()["narrative_date"]

    # Evento 1924: Apenas Ano (Contexto Geral do Ano)
    evt_year_only = client.post(
        f"/api/campaigns/{campaign_id}/events",
        headers=auth_headers(gm_token),
        json={
            "title": "Ano da Grande Seca e Inquietação",
            "description": "Contexto geral que cobriu todo o ano de 1924.",
            "year": 1924,
            "event_type": "canonical",
            "sort_order": 0,
        },
    )
    assert evt_year_only.status_code == 201
    assert evt_year_only.json()["year"] == 1924
    assert evt_year_only.json()["month"] is None
    assert evt_year_only.json()["day"] is None

    # Evento 1924: Ano e Mês 3 (Março), sem Dia (Contexto do Mês)
    evt_month_only = client.post(
        f"/api/campaigns/{campaign_id}/events",
        headers=auth_headers(gm_token),
        json={
            "title": "Rumores nas Docas durante o Mês das Tempestades",
            "description": "Ao longo de março, pescadores relatam luzes no mar.",
            "year": 1924,
            "month": 3,
            "event_type": "canonical",
            "sort_order": 0,
        },
    )
    assert evt_month_only.status_code == 201

    # Evento 1924: 15 de Março, com sort_order 0
    evt_day_first = client.post(
        f"/api/campaigns/{campaign_id}/events",
        headers=auth_headers(gm_token),
        json={
            "title": "Chegada do Navio Black Gull",
            "description": "O navio atracou na madrugada com tripulação em silêncio.",
            "year": 1924,
            "month": 3,
            "day": 15,
            "time_label": "04h00",
            "sort_order": 0.0,
            "event_type": "canonical",
        },
    )
    assert evt_day_first.status_code == 201

    # Evento 1924: 15 de Março, com sort_order 1 (desempate no mesmo dia/hora)
    evt_day_tie_breaker = client.post(
        f"/api/campaigns/{campaign_id}/events",
        headers=auth_headers(gm_token),
        json={
            "title": "Polícia isola o Cais 4",
            "description": "Logo após a atracação, viaturas cercam a área.",
            "year": 1924,
            "month": 3,
            "day": 15,
            "time_label": "04h15",
            "sort_order": 1.0,
            "event_type": "canonical",
        },
    )
    assert evt_day_tie_breaker.status_code == 201

    # Evento Colaborativo inserido pelo Jogador em 1924 (Diário do Jogador)
    evt_player = client.post(
        f"/api/campaigns/{campaign_id}/events",
        headers=auth_headers(player_token),
        json={
            "title": "Anotações do Diário de James",
            "description": "Encontrei um símbolo estranho entalhado na madeira do cais.",
            "year": 1924,
            "month": 3,
            "day": 15,
            "time_label": "Manhã",
            "sort_order": 2.0,
            "event_type": "diary",
        },
    )
    assert evt_player.status_code == 201
    assert evt_player.json()["created_by_id"] == player_id
    assert evt_player.json()["event_type"] == "diary"

    # Evento Secreto Privado do Mestre em 1924
    evt_gm_secret = client.post(
        f"/api/campaigns/{campaign_id}/events",
        headers=auth_headers(gm_token),
        json={
            "title": "O Ritual Secreto na Cripta",
            "description": "O culto realizou o sacrifício sem ninguém saber.",
            "year": 1924,
            "month": 10,
            "day": 31,
            "visibility": "private",
            "event_type": "canonical",
        },
    )
    assert evt_gm_secret.status_code == 201

    # 5. Validação de Ordenação Determinística Multinível com NULLS FIRST
    # Query ASC: Ano -450 -> Ano 1924 (Geral ano -> Mês 3 Geral -> Dia 15 sort 0 -> Dia 15 sort 1 -> Dia 15 sort 2 -> Dia 31)
    gm_timeline = client.get(
        f"/api/campaigns/{campaign_id}/events?order=asc",
        headers=auth_headers(gm_token),
    )
    assert gm_timeline.status_code == 200
    items = gm_timeline.json()["items"]
    assert len(items) == 7

    # Ordem exata dos títulos esperada:
    titles = [i["title"] for i in items]
    assert titles[0] == "Queda do Meteoro em Atlântida"  # -450
    assert titles[1] == "Ano da Grande Seca e Inquietação"  # 1924 (month is None)
    assert titles[2] == "Rumores nas Docas durante o Mês das Tempestades"  # 1924-03 (day is None)
    assert titles[3] == "Chegada do Navio Black Gull"  # 1924-03-15 sort_order 0
    assert titles[4] == "Polícia isola o Cais 4"  # 1924-03-15 sort_order 1
    assert titles[5] == "Anotações do Diário de James"  # 1924-03-15 sort_order 2
    assert titles[6] == "O Ritual Secreto na Cripta"  # 1924-10-31

    # 6. Validação de Visibilidade do Jogador vs Mestre
    player_timeline = client.get(
        f"/api/campaigns/{campaign_id}/events?order=asc",
        headers=auth_headers(player_token),
    )
    assert player_timeline.status_code == 200
    p_items = player_timeline.json()["items"]
    p_titles = [i["title"] for i in p_items]

    # O jogador NÃO deve ver o ritual secreto do mestre (privado)
    assert "O Ritual Secreto na Cripta" not in p_titles
    # O jogador DEVE ver seu próprio diário e os públicos do mestre
    assert "Anotações do Diário de James" in p_titles
    assert "Ano da Grande Seca e Inquietação" in p_titles
    assert len(p_items) == 6

    # 7. Validação da Estrutura de Agrupamento Dinâmico (Timeline Tree)
    tree = gm_timeline.json()["timeline_tree"]
    assert len(tree) == 2  # Anos -450 e 1924
    year_1924_group = next(y for y in tree if y["year"] == 1924)
    assert year_1924_group["total_events"] == 6
    assert year_1924_group["canonical_count"] == 5
    assert year_1924_group["player_count"] == 1
    # Evento geral do ano
    assert len(year_1924_group["year_level_events"]) == 1
    assert year_1924_group["year_level_events"][0]["title"] == "Ano da Grande Seca e Inquietação"

    # Meses em 1924
    assert len(year_1924_group["months"]) == 2  # Março (3) e Outubro (10)
    march = next(m for m in year_1924_group["months"] if m["month"] == 3)
    assert len(march["month_level_events"]) == 1
    assert march["month_level_events"][0]["title"] == "Rumores nas Docas durante o Mês das Tempestades"

    # Dias em Março
    assert len(march["days"]) == 1
    day_15 = march["days"][0]
    assert day_15["day"] == 15
    assert day_15["total_events"] == 3  # Black Gull, Polícia e Diário de James consolidados no mesmo nó

    # Endpoint dedicado timeline-tree
    tree_direct = client.get(
        f"/api/campaigns/{campaign_id}/timeline-tree",
        headers=auth_headers(gm_token),
    )
    assert tree_direct.status_code == 200
    assert len(tree_direct.json()) == 2

    # 8. Validação de Permissão de Edição e Exclusão Colaborativa
    player_evt_id = evt_player.json()["id"]
    gm_evt_id = evt_year_only.json()["id"]

    # Jogador edita seu próprio diário com sucesso
    patch_own = client.patch(
        f"/api/events/{player_evt_id}",
        headers=auth_headers(player_token),
        json={"title": "Anotações do Diário de James (Revisadas)"},
    )
    assert patch_own.status_code == 200
    assert patch_own.json()["title"] == "Anotações do Diário de James (Revisadas)"

    # Jogador tenta editar evento do Mestre -> Bloqueado com 403 Forbidden
    patch_other = client.patch(
        f"/api/events/{gm_evt_id}",
        headers=auth_headers(player_token),
        json={"title": "Tentativa Invasiva"},
    )
    assert patch_other.status_code == 403

    # Mestre pode editar qualquer evento (inclusive de jogador)
    gm_edit_player = client.patch(
        f"/api/events/{player_evt_id}",
        headers=auth_headers(gm_token),
        json={"title": "Anotações do Diário de James (Auditadas pelo Mestre)"},
    )
    assert gm_edit_player.status_code == 200
