import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://cronica_user:cronica_secret_pass@localhost:5432/cronica_rpg_test",
)

from app.database.base import Base
from app.database.session import get_db
from app.main import app

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

STATE: dict = {}


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_01_auth_and_user_management():
    """Testa cadastro, login, perfil e recuperação de senha (Seção 4 e 14.4)."""
    reg_gm = client.post(
        "/api/auth/register",
        json={
            "name": "Mestre Helena",
            "username": "helena_gm",
            "email": "helena@cronica.rpg",
            "password": "StrongPassword123!",
        },
    )
    assert reg_gm.status_code == 201, reg_gm.text
    STATE["gm_token"] = reg_gm.json()["access_token"]
    STATE["gm_id"] = reg_gm.json()["user"]["id"]

    # Duplicidade de e-mail bloqueada
    dup = client.post(
        "/api/auth/register",
        json={
            "name": "Outra",
            "username": "outra_user",
            "email": "helena@cronica.rpg",
            "password": "StrongPassword123!",
        },
    )
    assert dup.status_code == 409

    # Login e consulta /me
    login_gm = client.post(
        "/api/auth/login",
        json={"email": "helena@cronica.rpg", "password": "StrongPassword123!"},
    )
    assert login_gm.status_code == 200
    me_resp = client.get("/api/auth/me", headers=auth_headers(STATE["gm_token"]))
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "helena_gm"

    # Atualização de perfil
    prof_resp = client.patch(
        "/api/auth/profile",
        headers=auth_headers(STATE["gm_token"]),
        json={"name": "Mestre Helena Vance"},
    )
    assert prof_resp.status_code == 200
    assert prof_resp.json()["name"] == "Mestre Helena Vance"

    # Recuperação de senha
    forgot_resp = client.post("/api/auth/forgot-password", json={"email": "helena@cronica.rpg"})
    assert forgot_resp.status_code == 200
    reset_token = forgot_resp.json()["reset_token"]
    assert reset_token is not None

    reset_resp = client.post(
        "/api/auth/reset-password",
        json={"token": reset_token, "new_password": "NewStrongPassword123!"},
    )
    assert reset_resp.status_code == 200


def test_02_campaign_creation_and_editing():
    """Testa criação, listagem e edição de campanhas e calendário fictício (Seção 5 e Cenário 1)."""
    camp_resp = client.post(
        "/api/campaigns",
        headers=auth_headers(STATE["gm_token"]),
        json={
            "name": "Arquivo Obsidiana: Queda de Valen",
            "description": "Investigação ocultista nos arquivos imperiais de Valen.",
            "rpg_system": "Call of Cthulhu / Investigativo",
            "start_date": "2026-10-15",
            "status": "active",
            "calendar_config": {
                "type": "fictional",
                "era_name": "E.V.",
                "months": [
                    {"name": "Brumário", "days": 30},
                    {"name": "Solstício", "days": 30},
                    {"name": "Cinzas", "days": 35},
                ],
            },
        },
    )
    assert camp_resp.status_code == 201, camp_resp.text
    campaign = camp_resp.json()
    STATE["campaign_id"] = campaign["id"]
    assert campaign["user_role"] == "gm"
    assert campaign["calendar_config"]["type"] == "fictional"

    # Edição da campanha
    patch_resp = client.patch(
        f"/api/campaigns/{STATE['campaign_id']}",
        headers=auth_headers(STATE["gm_token"]),
        json={"description": "Investigação ocultista atualizada."},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["description"] == "Investigação ocultista atualizada."


def test_03_participants_and_invitations():
    """Testa convite, aceitação e controle de participantes (Seção 5.3 e Cenário 2)."""
    reg_p1 = client.post(
        "/api/auth/register",
        json={
            "name": "Jogador Dante",
            "username": "dante_player",
            "email": "dante@cronica.rpg",
            "password": "PlayerPassword123!",
        },
    )
    assert reg_p1.status_code == 201
    STATE["p1_token"] = reg_p1.json()["access_token"]
    STATE["p1_id"] = reg_p1.json()["user"]["id"]

    reg_p2 = client.post(
        "/api/auth/register",
        json={
            "name": "Jogadora Sofia",
            "username": "sofia_player",
            "email": "sofia@cronica.rpg",
            "password": "PlayerPassword123!",
        },
    )
    assert reg_p2.status_code == 201
    STATE["p2_token"] = reg_p2.json()["access_token"]
    STATE["p2_id"] = reg_p2.json()["user"]["id"]

    inv_resp = client.post(
        f"/api/campaigns/{STATE['campaign_id']}/invitations",
        headers=auth_headers(STATE["gm_token"]),
        json={"email": "dante@cronica.rpg", "expires_in_days": 7},
    )
    assert inv_resp.status_code == 201
    invite_token = inv_resp.json()["token"]

    accept_resp = client.post(
        f"/api/invitations/{invite_token}/accept",
        headers=auth_headers(STATE["p1_token"]),
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["user_role"] == "player"

    inv2_resp = client.post(
        f"/api/campaigns/{STATE['campaign_id']}/invitations",
        headers=auth_headers(STATE["gm_token"]),
        json={"expires_in_days": 7},
    )
    accept2_resp = client.post(
        f"/api/invitations/{inv2_resp.json()['token']}/accept",
        headers=auth_headers(STATE["p2_token"]),
    )
    assert accept2_resp.status_code == 200

    members_resp = client.get(
        f"/api/campaigns/{STATE['campaign_id']}/members",
        headers=auth_headers(STATE["gm_token"]),
    )
    assert members_resp.status_code == 200
    assert len(members_resp.json()) == 3


def test_04_entities_crud_and_filtering():
    """Testa cadastro, edição, busca e filtragem de entidades (Seção 7 e Cenário 3)."""
    campaign_id = STATE["campaign_id"]
    gm_token = STATE["gm_token"]

    char_resp = client.post(
        f"/api/campaigns/{campaign_id}/entities",
        headers=auth_headers(gm_token),
        json={
            "name": "Inspetor Arthur Vance",
            "category": "character",
            "description": "Investigador forense veterano.",
            "extra_info": "Carrega um relógio quebrado às 03:17.",
            "status": "ativo",
            "visibility": "public",
        },
    )
    assert char_resp.status_code == 201
    STATE["char_id"] = char_resp.json()["id"]

    npc_resp = client.post(
        f"/api/campaigns/{campaign_id}/entities",
        headers=auth_headers(gm_token),
        json={
            "name": "Arquivista Malakor",
            "category": "npc",
            "description": "Guardião do Subsolo Sete.",
            "status": "desaparecido",
            "visibility": "public",
        },
    )
    assert npc_resp.status_code == 201
    STATE["npc_id"] = npc_resp.json()["id"]

    loc_resp = client.post(
        f"/api/campaigns/{campaign_id}/entities",
        headers=auth_headers(gm_token),
        json={
            "name": "Biblioteca Subterrânea de Valen",
            "category": "location",
            "description": "Complexo de cofres sob a catedral antiga.",
            "status": "ativa",
            "visibility": "public",
        },
    )
    assert loc_resp.status_code == 201
    STATE["loc_id"] = loc_resp.json()["id"]

    org_resp = client.post(
        f"/api/campaigns/{campaign_id}/entities",
        headers=auth_headers(gm_token),
        json={
            "name": "Ordem do Selo Cinzento",
            "category": "organization",
            "description": "Sociedade secreta que monitora artefatos proibidos.",
            "status": "ativa",
            "visibility": "private",
        },
    )
    assert org_resp.status_code == 201
    STATE["org_id"] = org_resp.json()["id"]

    # Filtro por categoria
    filter_char = client.get(
        f"/api/campaigns/{campaign_id}/entities?category=character",
        headers=auth_headers(gm_token),
    )
    assert filter_char.status_code == 200
    assert filter_char.json()["total"] == 1

    # Jogador não pode cadastrar ou editar entidades
    forbidden_ent = client.post(
        f"/api/campaigns/{campaign_id}/entities",
        headers=auth_headers(STATE["p1_token"]),
        json={
            "name": "Tentativa Inválida",
            "category": "npc",
            "description": "Teste",
            "status": "ativo",
            "visibility": "public",
        },
    )
    assert forbidden_ent.status_code == 403


def test_05_sessions_registration_and_uniqueness():
    """Testa cadastro de sessões e unicidade do número de sessão (Seção 9 e Cenário 7)."""
    campaign_id = STATE["campaign_id"]
    gm_token = STATE["gm_token"]

    sess1_resp = client.post(
        f"/api/campaigns/{campaign_id}/sessions",
        headers=auth_headers(gm_token),
        json={
            "session_number": 1,
            "title": "O Cofre Violado",
            "real_date": "2026-10-20",
            "summary": "Os investigadores encontraram o cofre aberto no Subsolo Sete.",
            "status": "realizada",
            "notes": "Pista deixada para a sessão 2.",
            "visibility": "public",
        },
    )
    assert sess1_resp.status_code == 201
    STATE["sess1_id"] = sess1_resp.json()["id"]

    dup_sess = client.post(
        f"/api/campaigns/{campaign_id}/sessions",
        headers=auth_headers(gm_token),
        json={
            "session_number": 1,
            "title": "Sessão Duplicada",
            "summary": "Deve falhar",
            "status": "planejada",
        },
    )
    assert dup_sess.status_code == 409


def test_06_timeline_events_and_chronological_navigation():
    """Testa criação, ordenação cronológica e filtros combináveis da linha do tempo (Seção 8, Cenários 4 e 5)."""
    campaign_id = STATE["campaign_id"]
    gm_token = STATE["gm_token"]

    evt_later = client.post(
        f"/api/campaigns/{campaign_id}/events",
        headers=auth_headers(gm_token),
        json={
            "title": "Descoberta do Manuscrito Queimado",
            "description": "Arthur encontrou páginas rasgadas na Biblioteca.",
            "narrative_year": 412,
            "narrative_month": 2,
            "narrative_day": 14,
            "narrative_time": "22:30",
            "category": "descoberta",
            "session_id": STATE["sess1_id"],
            "visibility": "public",
            "entity_ids": [STATE["char_id"], STATE["loc_id"]],
        },
    )
    assert evt_later.status_code == 201
    STATE["evt_later_id"] = evt_later.json()["id"]

    evt_earlier = client.post(
        f"/api/campaigns/{campaign_id}/events",
        headers=auth_headers(gm_token),
        json={
            "title": "Desaparecimento do Arquivista Malakor",
            "description": "Malakor foi visto pela última vez trancando a galeria norte.",
            "narrative_year": 412,
            "narrative_month": 1,
            "narrative_day": 5,
            "narrative_time": "03:15",
            "category": "desaparecimento",
            "visibility": "public",
            "entity_ids": [STATE["npc_id"], STATE["loc_id"]],
        },
    )
    assert evt_earlier.status_code == 201
    STATE["evt_earlier_id"] = evt_earlier.json()["id"]

    evt_undated = client.post(
        f"/api/campaigns/{campaign_id}/events",
        headers=auth_headers(gm_token),
        json={
            "title": "Fundação do Arquivo Imperial",
            "description": "Lenda antiga sobre a construção das primeiras criptas.",
            "date_is_unknown": True,
            "category": "historico",
            "visibility": "public",
            "entity_ids": [STATE["loc_id"]],
        },
    )
    assert evt_undated.status_code == 201

    # Ordem crescente: Mês 1 vem antes do Mês 2
    timeline_asc = client.get(
        f"/api/campaigns/{campaign_id}/events?order=asc",
        headers=auth_headers(gm_token),
    )
    assert timeline_asc.status_code == 200
    dated_items = timeline_asc.json()["items"]
    undated_items = timeline_asc.json()["undated_items"]
    assert len(dated_items) == 2
    assert dated_items[0]["id"] == STATE["evt_earlier_id"]
    assert dated_items[1]["id"] == STATE["evt_later_id"]
    assert len(undated_items) == 1

    # Filtro por personagem
    by_char = client.get(
        f"/api/campaigns/{campaign_id}/events?character_id={STATE['char_id']}",
        headers=auth_headers(gm_token),
    )
    assert by_char.status_code == 200
    assert len(by_char.json()["items"]) == 1
    assert by_char.json()["items"][0]["id"] == STATE["evt_later_id"]


def test_07_entity_history_and_session_links():
    """Testa histórico de acontecimentos de uma entidade e associação com sessões (Cenários 6 e 7)."""
    loc_detail = client.get(
        f"/api/entities/{STATE['loc_id']}",
        headers=auth_headers(STATE["p1_token"]),
    )
    assert loc_detail.status_code == 200
    assert len(loc_detail.json()["related_events"]) == 3
    assert len(loc_detail.json()["related_sessions"]) == 1

    # Vincula evt_earlier à sessão 1 e depois desvincula
    link_resp = client.post(
        f"/api/sessions/{STATE['sess1_id']}/events/{STATE['evt_earlier_id']}",
        headers=auth_headers(STATE["gm_token"]),
    )
    assert link_resp.status_code == 200
    assert len(link_resp.json()["events"]) == 2

    unlink_resp = client.delete(
        f"/api/sessions/{STATE['sess1_id']}/events/{STATE['evt_earlier_id']}",
        headers=auth_headers(STATE["gm_token"]),
    )
    assert unlink_resp.status_code == 200
    assert len(unlink_resp.json()["events"]) == 1


def test_08_visibility_and_permissions():
    """Testa controle de visibilidade Privado, Público e Restrito no back-end (Seção 10 e Cenário 8)."""
    campaign_id = STATE["campaign_id"]
    gm_token = STATE["gm_token"]

    evt_private = client.post(
        f"/api/campaigns/{campaign_id}/events",
        headers=auth_headers(gm_token),
        json={
            "title": "Conspiração Secreta do Selo Cinzento",
            "description": "Informação exclusiva do Mestre.",
            "narrative_year": 412,
            "narrative_month": 2,
            "narrative_day": 15,
            "category": "revelacao",
            "visibility": "private",
            "entity_ids": [STATE["org_id"]],
        },
    )
    assert evt_private.status_code == 201
    evt_private_id = evt_private.json()["id"]

    evt_restricted = client.post(
        f"/api/campaigns/{campaign_id}/events",
        headers=auth_headers(gm_token),
        json={
            "title": "Visão Particular de Dante",
            "description": "Apenas Dante teve acesso a este fragmento de memória.",
            "narrative_year": 412,
            "narrative_month": 2,
            "narrative_day": 16,
            "category": "revelacao",
            "visibility": "restricted",
            "allowed_user_ids": [STATE["p1_id"]],
        },
    )
    assert evt_restricted.status_code == 201
    evt_restricted_id = evt_restricted.json()["id"]

    # Jogador 1 (Dante) vê o restrito a ele, mas NÃO vê o privado
    p1_events = client.get(
        f"/api/campaigns/{campaign_id}/events",
        headers=auth_headers(STATE["p1_token"]),
    )
    p1_event_ids = {e["id"] for e in p1_events.json()["items"]}
    assert evt_restricted_id in p1_event_ids
    assert evt_private_id not in p1_event_ids

    # Acesso direto ao evento privado por Dante é bloqueado com 403
    direct_priv = client.get(
        f"/api/events/{evt_private_id}",
        headers=auth_headers(STATE["p1_token"]),
    )
    assert direct_priv.status_code == 403

    # Jogadora 2 (Sofia) não vê nem o privado nem o restrito de Dante
    p2_events = client.get(
        f"/api/campaigns/{campaign_id}/events",
        headers=auth_headers(STATE["p2_token"]),
    )
    p2_event_ids = {e["id"] for e in p2_events.json()["items"]}
    assert evt_restricted_id not in p2_event_ids
    assert evt_private_id not in p2_event_ids


def test_09_campaign_isolation():
    """Testa isolamento completo de dados entre campanhas diferentes (Seção 16 e Cenário 9)."""
    reg_outsider = client.post(
        "/api/auth/register",
        json={
            "name": "Usuário Externo",
            "username": "outsider_user",
            "email": "outsider@cronica.rpg",
            "password": "OutsiderPassword123!",
        },
    )
    outsider_token = reg_outsider.json()["access_token"]

    other_camp = client.post(
        "/api/campaigns",
        headers=auth_headers(outsider_token),
        json={
            "name": "Outra Campanha Isolada",
            "description": "Dados completamente separados.",
            "rpg_system": "D&D 5e",
        },
    )
    other_camp_id = other_camp.json()["id"]
    other_ent = client.post(
        f"/api/campaigns/{other_camp_id}/entities",
        headers=auth_headers(outsider_token),
        json={
            "name": "Entidade de Outra Campanha",
            "category": "npc",
            "description": "Isolada",
            "status": "ativo",
            "visibility": "public",
        },
    )
    other_ent_id = other_ent.json()["id"]

    # Usuário externo não consegue acessar campanha da qual não participa
    outsider_access = client.get(
        f"/api/campaigns/{STATE['campaign_id']}",
        headers=auth_headers(outsider_token),
    )
    assert outsider_access.status_code == 403

    # Mestre não consegue vincular entidade de outra campanha ao seu evento
    cross_camp_evt = client.post(
        f"/api/campaigns/{STATE['campaign_id']}/events",
        headers=auth_headers(STATE["gm_token"]),
        json={
            "title": "Tentativa de Associação Cruzada",
            "description": "Não permitido",
            "narrative_year": 412,
            "narrative_month": 1,
            "narrative_day": 1,
            "category": "outro",
            "entity_ids": [other_ent_id],
        },
    )
    assert cross_camp_evt.status_code == 400


def test_10_campaign_cover_image_upload():
    """Testa upload, validação (JPG/PNG/WebP), servir estático e criação de campanha com capa local."""
    from pathlib import Path
    from app.core.config import settings

    gm_token = STATE["gm_token"]
    created_files: list[Path] = []

    try:
        # 1. Sem autenticação deve falhar (401)
        unauth = client.post(
            "/api/campaigns/cover",
            files={"file": ("capa.png", b"\x89PNG\r\n\x1a\n" + b"\x00" * 16, "image/png")},
        )
        assert unauth.status_code == 401

        # 2. Upload PNG, JPG e WebP válidos
        samples = [
            ("capa.png", b"\x89PNG\r\n\x1a\n" + b"\x00" * 24, "image/png", ".png"),
            ("capa.jpg", b"\xff\xd8\xff\xe0" + b"\x00" * 24, "image/jpeg", ".jpg"),
            ("capa.webp", b"RIFF\x24\x00\x00\x00WEBP" + b"\x00" * 20, "image/webp", ".webp"),
        ]

        last_cover_url = None
        for fname, payload_bytes, mime, expected_ext in samples:
            up_resp = client.post(
                "/api/campaigns/cover",
                headers=auth_headers(gm_token),
                files={"file": (fname, payload_bytes, mime)},
            )
            assert up_resp.status_code == 201, up_resp.text
            body = up_resp.json()
            assert body["cover_url"].startswith("/api/uploads/campaigns/")
            assert body["filename"].endswith(expected_ext)
            assert body["content_type"] == mime
            assert body["size"] == len(payload_bytes)
            last_cover_url = body["cover_url"]

            saved_path = Path(settings.UPLOAD_DIR) / "campaigns" / body["filename"]
            created_files.append(saved_path)
            assert saved_path.exists()

            # Verifica que o arquivo é servido via StaticFiles
            get_resp = client.get(body["cover_url"])
            assert get_resp.status_code == 200
            assert get_resp.content == payload_bytes

        # 3. Criação da campanha com a cover_url gerada
        camp_with_cover = client.post(
            "/api/campaigns",
            headers=auth_headers(gm_token),
            json={
                "name": "Campanha com Capa Local",
                "description": "Teste completo de capa.",
                "rpg_system": "Ordem Paranormal",
                "cover_url": last_cover_url,
            },
        )
        assert camp_with_cover.status_code == 201, camp_with_cover.text
        assert camp_with_cover.json()["cover_url"] == last_cover_url

        # 4. Formato proibido ou arquivo forjado deve ser rejeitado (400)
        bad_mime = client.post(
            "/api/campaigns/cover",
            headers=auth_headers(gm_token),
            files={"file": ("evil.svg", b"<svg></svg>", "image/svg+xml")},
        )
        assert bad_mime.status_code == 400

        spoofed_jpg = client.post(
            "/api/campaigns/cover",
            headers=auth_headers(gm_token),
            files={"file": ("fake.jpg", b"NOT_A_REAL_IMAGE_CONTENT", "image/jpeg")},
        )
        assert spoofed_jpg.status_code == 400

        empty_file = client.post(
            "/api/campaigns/cover",
            headers=auth_headers(gm_token),
            files={"file": ("empty.png", b"", "image/png")},
        )
        assert empty_file.status_code == 400
    finally:
        for fp in created_files:
            if fp.exists():
                fp.unlink()
