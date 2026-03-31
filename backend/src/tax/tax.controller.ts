import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { TaxService } from './tax.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get('profile')
  getProfile(@Request() req, @Query('fy') fy: string = '2025-26') {
    return this.taxService.getOrCreate(req.user.id, fy);
  }

  @Post('profile')
  updateProfile(@Request() req, @Body() body: any) {
    const { fy = '2025-26', ...data } = body;
    return this.taxService.update(req.user.id, fy, data);
  }

  @Get('comparison')
  getComparison(@Request() req, @Query('fy') fy: string = '2025-26') {
    return this.taxService.getComparison(req.user.id, fy);
  }
}
