import { Controller, Get, UseGuards } from '@nestjs/common';
import { BenchmarkingService } from './benchmarking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('benchmark')
export class BenchmarkingController {
  constructor(private readonly benchmarkingService: BenchmarkingService) {}

  @UseGuards(JwtAuthGuard)
  @Get('mock-summary')
  getMockSummary() {
    return this.benchmarkingService.getMockSummary();
  }
}
