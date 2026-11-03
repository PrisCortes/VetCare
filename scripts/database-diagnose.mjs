import {spawnSync} from 'node:child_process';
import {root,loadEnvironment,phpCommand} from './environment.mjs';

loadEnvironment();
const php=phpCommand();
const code=`require 'server/database.php';try{\\VetCare\\centralDatabase();echo json_encode(['status'=>'available','code'=>'DB_OK','tls'=>true]);}catch(\\Throwable $error){$message=strtolower($error->getMessage());$code='DB_CONNECTION_FAILED';if(in_array($error->getMessage(),['DB_NOT_CONFIGURED','DB_INVALID_CONFIGURATION','DB_CA_REQUIRED','DB_TLS_REQUIRED'],true))$code=$error->getMessage();elseif(str_contains($message,'access denied')||str_contains($message,'[1045]'))$code='DB_AUTH_FAILED';elseif(str_contains($message,'unknown database')||str_contains($message,'[1049]'))$code='DB_DATABASE_NOT_FOUND';elseif(str_contains($message,'certificate')||str_contains($message,'ssl')||str_contains($message,'tls')||str_contains($message,'[2026]'))$code='DB_TLS_HANDSHAKE_FAILED';elseif(str_contains($message,'getaddrinfo'))$code='DB_DNS_FAILED';elseif(str_contains($message,'[2002]')||str_contains($message,'connection refused')||str_contains($message,'timed out'))$code='DB_NETWORK_FAILED';echo json_encode(['status'=>'unavailable','code'=>$code]);}`;
const result=spawnSync(php.binary,[...php.args,'-r',code],{cwd:root,encoding:'utf8',windowsHide:true});
if(result.stdout)process.stdout.write(result.stdout.trim()+"\n");
if(result.error||result.status!==0||!result.stdout){console.log(JSON.stringify({status:'unavailable',code:'DB_DIAGNOSTIC_FAILED'}));process.exitCode=1;}
