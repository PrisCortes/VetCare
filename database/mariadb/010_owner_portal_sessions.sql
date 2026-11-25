CREATE TABLE IF NOT EXISTS vc_owner_portal_sessions (
 token_hash CHAR(64) PRIMARY KEY,
 owner_id CHAR(36) NOT NULL,
 csrf CHAR(64) NOT NULL,
 created_at BIGINT NOT NULL,
 last_seen BIGINT NOT NULL,
 expires_at BIGINT NOT NULL,
 FOREIGN KEY (owner_id) REFERENCES vc_owners(id),
 INDEX (owner_id), INDEX (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vc_owner_portal_audit (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 owner_id CHAR(36) NULL,
 event VARCHAR(40) NOT NULL,
 address_hash CHAR(64) NULL,
 created_at BIGINT NOT NULL,
 FOREIGN KEY (owner_id) REFERENCES vc_owners(id),
 INDEX (owner_id), INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
