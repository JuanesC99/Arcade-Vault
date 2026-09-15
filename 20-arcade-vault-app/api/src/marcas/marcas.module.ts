import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MarcasController } from './marcas.controller.js';
import { MarcasService } from './marcas.service.js';

@Module({
  imports: [AuthModule],
  controllers: [MarcasController],
  providers: [MarcasService],
})
export class MarcasModule {}
