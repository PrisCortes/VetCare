CREATE TABLE IF NOT EXISTS vc_owners (
 id CHAR(36) PRIMARY KEY,
 name VARCHAR(200) NOT NULL,
 phone VARCHAR(50) NOT NULL DEFAULT '',
 address VARCHAR(500) NOT NULL DEFAULT '',
 locality VARCHAR(200) NOT NULL DEFAULT '',
 active TINYINT NOT NULL DEFAULT 1,
 version INT NOT NULL,
 created_by CHAR(32) NOT NULL,
 updated_by CHAR(32) NOT NULL,
 created_at BIGINT NOT NULL,
 updated_at BIGINT NOT NULL,
 INDEX (active,name),
 FOREIGN KEY (created_by) REFERENCES vc_auth_users(id),
 FOREIGN KEY (updated_by) REFERENCES vc_auth_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS vc_owner_versions (
 owner_id CHAR(36) NOT NULL,
 version INT NOT NULL,
 actor_id CHAR(32) NOT NULL,
 snapshot LONGTEXT NOT NULL,
 created_at BIGINT NOT NULL,
 PRIMARY KEY (owner_id,version),
 FOREIGN KEY (owner_id) REFERENCES vc_owners(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS vc_owner_operations (
 operation_id CHAR(36) PRIMARY KEY,
 actor_id CHAR(32) NOT NULL,
 payload_hash CHAR(64) NOT NULL,
 result LONGTEXT NOT NULL,
 created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
