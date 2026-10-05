CREATE TABLE IF NOT EXISTS vc_auth_users (
 id CHAR(32) PRIMARY KEY,
 username VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 name VARCHAR(160) NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 role ENUM('administrador','veterinario') NOT NULL,
 active TINYINT NOT NULL DEFAULT 1,
 created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS vc_auth_sessions (
 token_hash CHAR(64) PRIMARY KEY,
 user_id CHAR(32) NOT NULL,
 csrf CHAR(64) NOT NULL,
 created_at BIGINT NOT NULL,
 last_seen BIGINT NOT NULL,
 expires_at BIGINT NOT NULL,
 FOREIGN KEY (user_id) REFERENCES vc_auth_users(id),
 INDEX (user_id), INDEX (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS vc_auth_limits (
 bucket CHAR(64) PRIMARY KEY,
 attempts INT NOT NULL,
 window_start BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS vc_auth_audit (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 actor_id CHAR(32) NULL,
 event VARCHAR(40) NOT NULL,
 subject_id CHAR(32) NULL,
 created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
