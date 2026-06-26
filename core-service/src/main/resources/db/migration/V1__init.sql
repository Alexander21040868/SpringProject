
CREATE TABLE families (
    id         UUID         PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    currency   VARCHAR(3)   NOT NULL DEFAULT 'RUB',
    created_at TIMESTAMP    NOT NULL
);

CREATE TABLE memberships (
    id           UUID         PRIMARY KEY,
    family_id    UUID         NOT NULL REFERENCES families (id) ON DELETE CASCADE,
    user_id      UUID         NOT NULL,
    role         VARCHAR(16)  NOT NULL,
    display_name VARCHAR(100),
    email        VARCHAR(254),
    color        VARCHAR(7),
    joined_at    TIMESTAMP    NOT NULL,
    CONSTRAINT ux_membership_family_user UNIQUE (family_id, user_id)
);
CREATE INDEX ix_membership_family ON memberships (family_id);
CREATE INDEX ix_membership_user ON memberships (user_id);

CREATE TABLE invitations (
    id                 UUID        PRIMARY KEY,
    family_id          UUID        NOT NULL REFERENCES families (id) ON DELETE CASCADE,
    email              VARCHAR(254) NOT NULL,
    role               VARCHAR(16) NOT NULL,
    status             VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    invited_by_user_id UUID        NOT NULL,
    invited_by_name    VARCHAR(100),
    created_at         TIMESTAMP   NOT NULL
);
CREATE INDEX ix_invitation_family ON invitations (family_id);
CREATE INDEX ix_invitation_email_status ON invitations (email, status);

CREATE TABLE categories (
    id         UUID        PRIMARY KEY,
    family_id  UUID        NOT NULL REFERENCES families (id) ON DELETE CASCADE,
    name       VARCHAR(60) NOT NULL,
    type       VARCHAR(8)  NOT NULL,
    icon       VARCHAR(50),
    color      VARCHAR(7),
    created_at TIMESTAMP   NOT NULL
);
CREATE INDEX ix_category_family ON categories (family_id);

CREATE TABLE operations (
    id                 UUID           PRIMARY KEY,
    family_id          UUID           NOT NULL REFERENCES families (id) ON DELETE CASCADE,
    type               VARCHAR(8)     NOT NULL,
    amount             NUMERIC(19, 2) NOT NULL,
    currency           VARCHAR(3)     NOT NULL DEFAULT 'RUB',
    op_date            DATE           NOT NULL,
    description        VARCHAR(255),
    category_id        UUID           NOT NULL REFERENCES categories (id),
    member_user_id     UUID           NOT NULL,
    created_by_user_id UUID           NOT NULL,
    created_at         TIMESTAMP      NOT NULL
);
CREATE INDEX ix_operation_family_date ON operations (family_id, op_date);
CREATE INDEX ix_operation_category ON operations (category_id);
CREATE INDEX ix_operation_member ON operations (member_user_id);

CREATE TABLE limits (
    id          UUID           PRIMARY KEY,
    family_id   UUID           NOT NULL REFERENCES families (id) ON DELETE CASCADE,
    category_id UUID           NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    amount      NUMERIC(19, 2) NOT NULL,
    created_at  TIMESTAMP      NOT NULL,
    CONSTRAINT ux_limit_family_category UNIQUE (family_id, category_id)
);
CREATE INDEX ix_limit_family ON limits (family_id);
