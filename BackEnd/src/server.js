import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`Serveur démarré sur le port ${env.port} (${env.nodeEnv})`);
});
