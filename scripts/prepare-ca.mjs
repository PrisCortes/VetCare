import { rootCertificates } from 'node:tls';
import { X509Certificate } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from './environment.mjs';

// Autoridades públicas incluidas en Node; nunca confiar en un certificado
// descargado del servidor sin verificar su cadena.
if (rootCertificates.length === 0) throw new Error('Node no contiene autoridades de confianza.');
for (const certificate of rootCertificates) new X509Certificate(certificate);
const directory = join(root, 'storage', 'certificates');
await mkdir(directory, { recursive: true });
const target = join(directory, 'public-roots.pem');
await writeFile(target, rootCertificates.join('\n') + '\n', { mode: 0o600 });
console.log('Autoridades públicas preparadas. Esto todavía no verifica el servidor MariaDB.');
console.log('Configura esta línea en .env:');
console.log('DB_SSL_CA=' + target.replaceAll('\\', '/'));
