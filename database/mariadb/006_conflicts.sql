CREATE TABLE IF NOT EXISTS vc_sync_conflicts (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 entity_type ENUM('owner','patient','consultation') NOT NULL,
 entity_id CHAR(36) NOT NULL,
 operation_id CHAR(36) NOT NULL UNIQUE,
 actor_id CHAR(32) NOT NULL,
 base_version INT NOT NULL,
 displaced_version INT NOT NULL,
 winning_version INT NOT NULL,
 policy VARCHAR(40) NOT NULL,
 displaced_snapshot LONGTEXT NOT NULL,
 winning_snapshot LONGTEXT NOT NULL,
 created_at BIGINT NOT NULL,
 INDEX (entity_type,entity_id,created_at),
 FOREIGN KEY (actor_id) REFERENCES vc_auth_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
