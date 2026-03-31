import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Subscription } from './subscription.entity';
import { Notification } from './notification.entity';
import { CreateSubscriptionDto } from './create-subscription.dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(userId: string, dto: CreateSubscriptionDto): Promise<Subscription> {
    const next_renewal = this.computeNextRenewal(dto.start_date, dto.billing_cycle);
    const sub = this.subscriptionRepository.create({
      ...dto,
      end_date: dto.end_date || null,
      user_id: userId,
      next_renewal,
    });
    return this.subscriptionRepository.save(sub);
  }

  private computeNextRenewal(startDate: string, cycle: string): string {
    const date = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Advance until next_renewal is in the future
    while (date <= today) {
      switch (cycle) {
        case 'weekly':   date.setDate(date.getDate() + 7); break;
        case 'monthly':  date.setMonth(date.getMonth() + 1); break;
        case 'quarterly':date.setMonth(date.getMonth() + 3); break;
        case 'yearly':   date.setFullYear(date.getFullYear() + 1); break;
        default:         date.setMonth(date.getMonth() + 1);
      }
    }
    return date.toISOString().split('T')[0];
  }

  async findAll(userId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { user_id: userId },
      order: { next_renewal: 'ASC' },
    });
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.subscriptionRepository.delete({ id, user_id: userId });
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user_id: userId, is_read: false },
      order: { created_at: 'DESC' },
    });
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, user_id: userId },
      { is_read: true },
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkRenewals() {
    this.logger.log('Running subscription renewal check...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    const due = await this.subscriptionRepository
      .createQueryBuilder('s')
      .where('s.next_renewal = :date', { date: tomorrowStr })
      .getMany();

    for (const sub of due) {
      const message = `Your subscription for ${sub.merchant_name} is due tomorrow for ₹${sub.amount}.`;
      const notification = this.notificationRepository.create({
        user_id: sub.user_id,
        message,
      });
      await this.notificationRepository.save(notification);
      this.logger.log(`Notification created for user ${sub.user_id}: ${message}`);
    }
  }
}
