import { loadEnvironment, port } from './environment.mjs';
import { startServices } from './services.mjs';
loadEnvironment();
try {
  const services = await startServices({ webPort: port(process.env.WEB_PORT, 5173), apiPort: port(process.env.API_PORT, 8787) });
  console.log(`VetCare web: ${services.url}\nAPI: ${services.url}/api/v1/health\nCtrl+C para cerrar ambos procesos.`);
  let stopping = false;
  const stop = async () => { if (stopping) return; stopping = true; await services.stop(); process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
} catch (error) { console.error(error.message); process.exitCode = 1; }
