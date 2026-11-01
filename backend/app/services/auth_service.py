from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_password_reset_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def register(self, data: RegisterRequest) -> TokenResponse:
        email_clean = data.email.strip().lower()
        username_clean = data.username.strip()

        if self.user_repo.get_by_email(email_clean):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este endereço de e-mail já está cadastrado.",
            )
        if self.user_repo.get_by_username(username_clean):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este nome de usuário já está em uso.",
            )

        user = User(
            name=data.name.strip(),
            username=username_clean,
            email=email_clean,
            password_hash=hash_password(data.password),
            avatar_url=data.avatar_url.strip() if data.avatar_url else None,
        )
        user = self.user_repo.create(user)
        token = create_access_token(subject=user.id)
        return TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        )

    def login(self, data: LoginRequest) -> TokenResponse:
        user = self.user_repo.get_by_email(data.email.strip().lower())
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha incorretos.",
            )
        token = create_access_token(subject=user.id)
        return TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        )

    def update_profile(self, current_user: User, data: ProfileUpdateRequest) -> UserResponse:
        if data.name is not None:
            current_user.name = data.name.strip()
        if data.username is not None:
            new_username = data.username.strip()
            existing = self.user_repo.get_by_username(new_username)
            if existing and existing.id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Este nome de usuário já está em uso por outra conta.",
                )
            current_user.username = new_username
        if data.avatar_url is not None:
            current_user.avatar_url = data.avatar_url.strip() or None

        if data.new_password:
            if not data.current_password or not verify_password(
                data.current_password, current_user.password_hash
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A senha atual informada está incorreta.",
                )
            current_user.password_hash = hash_password(data.new_password)

        updated = self.user_repo.update(current_user)
        return UserResponse.model_validate(updated)

    def forgot_password(self, data: ForgotPasswordRequest) -> ForgotPasswordResponse:
        user = self.user_repo.get_by_email(data.email.strip().lower())
        reset_token = None
        if user:
            reset_token = create_password_reset_token(user.email)
        return ForgotPasswordResponse(
            message="Se o e-mail estiver cadastrado, um código de recuperação foi gerado.",
            reset_token=reset_token,
        )

    def reset_password(self, data: ResetPasswordRequest) -> dict:
        payload = decode_token(data.token.strip())
        if not payload or payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de recuperação inválido ou expirado.",
            )
        email = payload.get("sub")
        user = self.user_repo.get_by_email(email) if email else None
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado.",
            )
        user.password_hash = hash_password(data.new_password)
        self.user_repo.update(user)
        return {"message": "Senha redefinida com sucesso. Você já pode realizar login."}
