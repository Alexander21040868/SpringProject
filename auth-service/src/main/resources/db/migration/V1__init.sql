
CREATE TABLE users (
    id               UUID         PRIMARY KEY,
    email            VARCHAR(254) NOT NULL,
    password_hash    VARCHAR(100) NOT NULL,
    name             VARCHAR(100) NOT NULL,
    default_currency VARCHAR(3)   NOT NULL DEFAULT 'RUB',
    system_role      VARCHAR(16)  NOT NULL DEFAULT 'USER',
    enabled          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP    NOT NULL,
    updated_at       TIMESTAMP    NOT NULL
);

CREATE UNIQUE INDEX ux_users_email ON users (email);

CREATE TABLE refresh_tokens (
    id         UUID        PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP   NOT NULL,
    revoked    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP   NOT NULL
);

CREATE UNIQUE INDEX ux_refresh_token_hash ON refresh_tokens (token_hash);
CREATE INDEX ix_refresh_user ON refresh_tokens (user_id);
