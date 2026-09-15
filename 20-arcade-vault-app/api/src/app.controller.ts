import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Latido para saber si el salón tiene servidor detrás. */
  @Get('salud')
  salud() {
    return this.appService.salud();
  }
}
