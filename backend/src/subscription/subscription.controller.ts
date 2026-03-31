import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './create-subscription.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req) {
    return this.subscriptionService.findAll(req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Request() req, @Param('id') id: string) {
    return this.subscriptionService.delete(req.user.id, id);
  }

  @Get('notifications')
  getNotifications(@Request() req) {
    return this.subscriptionService.getNotifications(req.user.id);
  }

  @Post('notifications/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(@Request() req, @Param('id') id: string) {
    return this.subscriptionService.markRead(req.user.id, id);
  }
}
