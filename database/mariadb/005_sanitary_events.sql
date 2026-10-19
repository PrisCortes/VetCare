CREATE TABLE IF NOT EXISTS vc_vaccinations (
 id CHAR(36) PRIMARY KEY,
 patient_id CHAR(36) NOT NULL,
 date DATE NOT NULL,
 product VARCHAR(200) NOT NULL,
 application VARCHAR(200) NULL,
 next_date DATE NULL,
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
CREATE TABLE IF NOT EXISTS vc_vaccination_versions (
 vaccination_id CHAR(36) NOT NULL,
 version INT NOT NULL,
 actor_id CHAR(32) NOT NULL,
 snapshot LONGTEXT NOT NULL,
 created_at BIGINT NOT NULL,
 PRIMARY KEY (vaccination_id,version),
 FOREIGN KEY (vaccination_id) REFERENCES vc_vaccinations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS vc_dewormings (
 id CHAR(36) PRIMARY KEY,
 patient_id CHAR(36) NOT NULL,
 date DATE NOT NULL,
 product VARCHAR(200) NOT NULL,
 weight_g INT NULL,
 next_date DATE NULL,
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
CREATE TABLE IF NOT EXISTS vc_deworming_versions (
 deworming_id CHAR(36) NOT NULL,
 version INT NOT NULL,
 actor_id CHAR(32) NOT NULL,
 snapshot LONGTEXT NOT NULL,
 created_at BIGINT NOT NULL,
 PRIMARY KEY (deworming_id,version),
 FOREIGN KEY (deworming_id) REFERENCES vc_dewormings(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS vc_sanitary_operations (
 operation_id CHAR(36) PRIMARY KEY,
 actor_id CHAR(32) NOT NULL,
 payload_hash CHAR(64) NOT NULL,
 result LONGTEXT NOT NULL,
 created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
