import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return { status: 'ok' };
  }

  @Get('health')
  getHealth() {
    return { status: 'healthy' };
  }
}
