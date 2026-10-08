CREATE TABLE IF NOT EXISTS vc_patients (
 id CHAR(36) PRIMARY KEY,
 owner_id CHAR(36) NOT NULL,
 name VARCHAR(200) NOT NULL,
 species VARCHAR(80) NOT NULL,
 breed VARCHAR(200) NOT NULL DEFAULT '',
 birth_date DATE NULL,
 age_value INT NULL,
 age_unit VARCHAR(10) NULL,
 age_reference DATE NULL,
 active TINYINT NOT NULL DEFAULT 1,
 version INT NOT NULL,
 created_by CHAR(32) NOT NULL,
 updated_by CHAR(32) NOT NULL,
 created_at BIGINT NOT NULL,
 updated_at BIGINT NOT NULL,
 INDEX (owner_id,active), INDEX (active,name),
 FOREIGN KEY (owner_id) REFERENCES vc_owners(id),
 FOREIGN KEY (created_by) REFERENCES vc_auth_users(id),
 FOREIGN KEY (updated_by) REFERENCES vc_auth_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS vc_patient_versions (
 patient_id CHAR(36) NOT NULL,
 version INT NOT NULL,
 actor_id CHAR(32) NOT NULL,
 snapshot LONGTEXT NOT NULL,
 created_at BIGINT NOT NULL,
 PRIMARY KEY (patient_id,version),
 FOREIGN KEY (patient_id) REFERENCES vc_patients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS vc_patient_operations (
 operation_id CHAR(36) PRIMARY KEY,
 actor_id CHAR(32) NOT NULL,
 payload_hash CHAR(64) NOT NULL,
 result LONGTEXT NOT NULL,
 created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
