import './config.js';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'node:path';
import { AppModule } from './app.module.js';
import { RAIZ } from './config.js';

const app = await NestFactory.create<NestExpressApplication>(AppModule);

// Encabezados de seguridad HTTP: solo se ejecutan scripts propios y la página no se
// puede incrustar
// en otro sitio. HSTS y la mejora a HTTPS se apagan porque en el aula la API corre
// sin HTTPS.
app.use(
  helmet({
    contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
    strictTransportSecurity: false,
  }),
);

// Todo cuerpo que llega se valida contra su DTO; los campos que sobran se rechazan.
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);

// Documentación interactiva de la API en /docs.
const documento = new DocumentBuilder()
  .setTitle('API de La Espiga')
  .setVersion('2.0.0')
  .addBearerAuth()
  .build();
SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, documento));

app.useStaticAssets(join(RAIZ, 'public'));
const puerto = process.env.PUERTO ?? 3000;
await app.listen(puerto);
console.log(
  `API de La Espiga en http://localhost:${puerto}  (documentación en /docs)`,
);
