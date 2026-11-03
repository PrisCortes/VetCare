<?php
declare(strict_types=1);
namespace VetCare;
use PDO;

/** Conserva ambas ramas cuando una operación offline no parte de la versión visible. */
function recordSyncConflict(PDO $db,string $type,string $id,string $operation,array $actor,int $baseVersion,int $displacedVersion,int $winningVersion,array $displaced,array $winner): array {
    $policy='server_commit_order_lww_v1';
    $created=time();
    $db->prepare('INSERT INTO vc_sync_conflicts(entity_type,entity_id,operation_id,actor_id,base_version,displaced_version,winning_version,policy,displaced_snapshot,winning_snapshot,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
        ->execute([$type,$id,$operation,$actor['id'],$baseVersion,$displacedVersion,$winningVersion,$policy,json_encode($displaced,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),json_encode($winner,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),$created]);
    return ['detected'=>true,'policy'=>$policy,'baseVersion'=>$baseVersion,'displacedVersion'=>$displacedVersion,'winningVersion'=>$winningVersion];
}
