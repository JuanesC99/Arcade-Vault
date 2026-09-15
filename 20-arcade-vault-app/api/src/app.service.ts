import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  salud() {
    return { ok: true, servicio: 'arcade-vault-api', hora: new Date().toISOString() };
  }
}
