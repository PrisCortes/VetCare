CREATE TABLE IF NOT EXISTS vc_consultations (
 id CHAR(36) PRIMARY KEY,
 patient_id CHAR(36) NOT NULL,
 date DATE NOT NULL,
 reason TEXT NOT NULL,
 treatment TEXT NULL,
 notes TEXT NULL,
 weight_g INT NULL,
 temperature_cent INT NULL,
 heart_rate INT NULL,
 respiratory_rate INT NULL,
 age_snapshot TEXT NOT NULL,
 version INT NOT NULL,
 created_by CHAR(32) NOT NULL,
 updated_by CHAR(32) NOT NULL,
 created_at BIGINT NOT NULL,
 updated_at BIGINT NOT NULL,
 INDEX (patient_id,date,id),
 FOREIGN KEY (patient_id) REFERENCES vc_patients(id),
 FOREIGN KEY (created_by) REFERENCES vc_auth_users(id),
 FOREIGN KEY (updated_by) REFERENCES vc_auth_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS vc_consultation_versions (
 consultation_id CHAR(36) NOT NULL,
 version INT NOT NULL,
 actor_id CHAR(32) NOT NULL,
 snapshot LONGTEXT NOT NULL,
 created_at BIGINT NOT NULL,
 PRIMARY KEY (consultation_id,version),
 FOREIGN KEY (consultation_id) REFERENCES vc_consultations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS vc_consultation_operations (
 operation_id CHAR(36) PRIMARY KEY,
 actor_id CHAR(32) NOT NULL,
 payload_hash CHAR(64) NOT NULL,
 result LONGTEXT NOT NULL,
 created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
