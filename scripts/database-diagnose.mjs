import {spawnSync} from 'node:child_process';
import {root,loadEnvironment,phpCommand} from './environment.mjs';

loadEnvironment();
const php=phpCommand();
const code=`require 'server/database.php';try{\\VetCare\\centralDatabase();echo json_encode(['status'=>'available','code'=>'DB_OK','tls'=>true]);}catch(\\Throwable $error){echo json_encode(['status'=>'unavailable','code'=>\\VetCare\\databaseDiagnosticCode($error)]);}`;
const result=spawnSync(php.binary,[...php.args,'-r',code],{cwd:root,encoding:'utf8',windowsHide:true});
if(result.stdout)process.stdout.write(result.stdout.trim()+"\n");
if(result.error||result.status!==0||!result.stdout){console.log(JSON.stringify({status:'unavailable',code:'DB_DIAGNOSTIC_FAILED'}));process.exitCode=1;}
