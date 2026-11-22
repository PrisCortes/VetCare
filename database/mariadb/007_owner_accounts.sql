CREATE TABLE IF NOT EXISTS vc_owner_accounts (
 owner_id CHAR(36) PRIMARY KEY,
 username VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 active TINYINT NOT NULL DEFAULT 1,
 created_at BIGINT NOT NULL,
 updated_at BIGINT NOT NULL,
 FOREIGN KEY (owner_id) REFERENCES vc_owners(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
