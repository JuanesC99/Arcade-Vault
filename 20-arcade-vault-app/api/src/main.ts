import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Solo el salón puede llamar a esta API desde el navegador.
  app.enableCors({
    origin: (process.env.ORIGENES ?? 'http://localhost:3000').split(','),
    credentials: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const puerto = Number(process.env.PORT ?? 3001);
  await app.listen(puerto);
  console.log(`API del salón escuchando en http://localhost:${puerto}/api`);
}
await bootstrap();
