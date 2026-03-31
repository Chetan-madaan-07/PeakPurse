import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transaction.entity';

@Injectable()
export class BenchmarkingService {
  private readonly MOCK_LEADERBOARD = [
    { pseudo_name: 'Investor_99', health_score: 95, saving_rate: '45%', city_tier: 'Tier 1' },
    { pseudo_name: 'WealthBuilder', health_score: 92, saving_rate: '40%', city_tier: 'Tier 2' },
    { pseudo_name: 'SaveSmart_IN', health_score: 88, saving_rate: '35%', city_tier: 'Tier 1' },
    { pseudo_name: 'FrugalPro', health_score: 85, saving_rate: '32%', city_tier: 'Tier 3' },
    { pseudo_name: 'Target2030', health_score: 81, saving_rate: '30%', city_tier: 'Tier 1' },
    { pseudo_name: 'RupeeNinja', health_score: 78, saving_rate: '28%', city_tier: 'Tier 2' },
    { pseudo_name: 'GrowthMind', health_score: 75, saving_rate: '25%', city_tier: 'Tier 1' },
    { pseudo_name: 'SteadySaver', health_score: 72, saving_rate: '22%', city_tier: 'Tier 2' },
    { pseudo_name: 'FutureFund', health_score: 68, saving_rate: '20%', city_tier: 'Tier 1' },
    { pseudo_name: 'DailyBudget', health_score: 65, saving_rate: '18%', city_tier: 'Tier 3' },
  ];

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async getMockSummary() {
    // Derive a health score from actual transaction data
    const currentUserScore = await this.computeHealthScore();
    const percentile = Math.min(Math.floor(currentUserScore * 0.95), 99);
    const percentileText = `You are above ${percentile}% of people with similar income to you, and they are saving and investing a lot.`;

    return {
      userProfile: {
        score: currentUserScore,
        percentileText,
      },
      leaderboard: this.MOCK_LEADERBOARD,
    };
  }

  private async computeHealthScore(): Promise<number> {
    try {
      const result = await this.transactionRepository
        .createQueryBuilder('t')
        .select('SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END)', 'income')
        .addSelect('SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END)', 'spent')
        .getRawOne();

      const income = parseFloat(result?.income || '0');
      const spent = parseFloat(result?.spent || '0');

      if (income === 0) return 50; // default if no data

      const savingRate = (income - spent) / income;
      // Map saving rate to 0-100 score: 0% savings = 30, 50%+ savings = 95
      const score = Math.min(95, Math.max(30, Math.round(30 + savingRate * 130)));
      return score;
    } catch {
      return 50;
    }
  }
}
