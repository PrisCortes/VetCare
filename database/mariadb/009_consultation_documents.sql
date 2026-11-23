CREATE TABLE IF NOT EXISTS vc_consultation_documents (
 consultation_id CHAR(36) PRIMARY KEY,
 consultation_version INT NOT NULL,
 token_hash CHAR(64) NOT NULL UNIQUE,
 created_by CHAR(32) NOT NULL,
 created_at BIGINT NOT NULL,
 revoked_at BIGINT NULL,
 INDEX (token_hash,revoked_at),
 FOREIGN KEY (consultation_id) REFERENCES vc_consultations(id),
 FOREIGN KEY (created_by) REFERENCES vc_auth_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
