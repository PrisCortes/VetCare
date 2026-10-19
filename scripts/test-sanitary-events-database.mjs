import {spawnSync} from 'node:child_process';
import {root,loadEnvironment,phpCommand} from './environment.mjs';
loadEnvironment();const php=phpCommand();const result=spawnSync(php.binary,[...php.args,'tests/sanitary-events-database.php'],{cwd:root,encoding:'utf8',windowsHide:true});
if(result.stdout)process.stdout.write(result.stdout);if(result.stderr)process.stderr.write(result.stderr);process.exitCode=result.status===0?0:1;
