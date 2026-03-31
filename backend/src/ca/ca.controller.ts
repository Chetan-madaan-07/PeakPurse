import { Controller, Get, Query } from '@nestjs/common';
import { CaService } from './ca.service';

@Controller('ca')
export class CaController {
  constructor(private readonly caService: CaService) {}

  // GET /api/ca/cities — list of all available cities
  @Get('cities')
  getCities() {
    return this.caService.getCities();
  }

  // GET /api/ca/mock-directory?city=Mumbai — filter by city, or return all
  @Get('mock-directory')
  getMockDirectory(@Query('city') city?: string) {
    if (city) return this.caService.getByCity(city);
    return this.caService.getMockDirectory();
  }
}
