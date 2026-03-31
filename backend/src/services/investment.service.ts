import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, RiskProfile } from '../user.entity';
import { Goal, GoalFeasibility, GoalPriority } from '../goal.entity';
import { InvestmentPlan } from '../investment-plan.entity';
import { TransactionService } from './transaction.service';
import { AuditService } from './audit.service';

export interface CreateGoalDto {
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date: string;
  priority?: GoalPriority;
}

@Injectable()
export class InvestmentService {
  private readonly logger = new Logger(InvestmentService.name);

  public readonly SEBI_DISCLAIMER =
    'Disclaimer: PeakPurse is not a SEBI-registered RIA. These recommendations are educational model portfolios and not personalized investment advice.';

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Goal) private goalRepository: Repository<Goal>,
    @InjectRepository(InvestmentPlan) private planRepository: Repository<InvestmentPlan>,
    private transactionService: TransactionService,
    private auditService: AuditService,
  ) {}

  // ─── Goal Management ────────────────────────────────────────────────────────

  async createGoal(userId: string, dto: CreateGoalDto): Promise<Goal> {
    const goal = this.goalRepository.create({
      user_id: userId,
      name: dto.name,
      target_amount: dto.target_amount,
      current_amount: dto.current_amount ?? 0,
      target_date: dto.target_date,
      priority: dto.priority ?? GoalPriority.MEDIUM,
    });
    return this.goalRepository.save(goal);
  }

  async getUserGoals(userId: string): Promise<Goal[]> {
    return this.goalRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  // ─── Risk Profiler ───────────────────────────────────────────────────────────

  async calculateRiskProfile(userId: string, answers: number[]): Promise<RiskProfile> {
    if (answers.length !== 8) {
      throw new BadRequestException('Exactly 8 answers are required for the risk profile.');
    }

    const totalScore = answers.reduce((sum, score) => sum + score, 0);
    let profile = RiskProfile.CONSERVATIVE;
    if (totalScore >= 21) profile = RiskProfile.AGGRESSIVE;
    else if (totalScore >= 11) profile = RiskProfile.MODERATE;

    await this.userRepository.update(userId, { risk_profile: profile });
    await this.auditService.log('RISK_PROFILE_UPDATED', userId, { score: totalScore, assigned_profile: profile });

    return profile;
  }

  generateAssetMix(profile: RiskProfile) {
    let mix: Record<string, number>;
    let rates: Record<string, number>;

    switch (profile) {
      case RiskProfile.AGGRESSIVE:
        mix = { equity_funds: 0.8, debt_funds: 0.2 };
        rates = { conservative: 0.08, base: 0.12, optimistic: 0.15 };
        break;
      case RiskProfile.MODERATE:
        mix = { equity_funds: 0.5, debt_funds: 0.5 };
        rates = { conservative: 0.07, base: 0.10, optimistic: 0.12 };
        break;
      default:
        mix = { equity_funds: 0.2, debt_funds: 0.8 };
        rates = { conservative: 0.05, base: 0.07, optimistic: 0.09 };
    }

    return { asset_mix: mix, return_rates: rates, disclaimer: this.SEBI_DISCLAIMER };
  }

  // ─── Feasibility Engine ──────────────────────────────────────────────────────

  async evaluateGoalFeasibility(goalId: string, manualSurplus?: number) {
    const goal = await this.goalRepository.findOne({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found');

    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const monthsRemaining =
      (targetDate.getFullYear() - today.getFullYear()) * 12 +
      (targetDate.getMonth() - today.getMonth());

    if (monthsRemaining <= 0) {
      throw new BadRequestException('Target date must be at least 1 month in the future');
    }

    // Property 18: always round up
    const requiredMonthly = Math.ceil(
      (Number(goal.target_amount) - Number(goal.current_amount)) / monthsRemaining,
    );

    let activeSurplus = manualSurplus;

    if (activeSurplus === undefined) {
      const surplusData = await this.transactionService.calculateMonthlySurplus();
      if (!surplusData.hasHistory) {
        return {
          requires_manual_input: true,
          message: 'No transaction history found. Please provide your estimated monthly savings.',
          required_monthly: requiredMonthly,
          months_remaining: monthsRemaining,
        };
      }
      activeSurplus = surplusData.surplus;
    }

    let feasibility = GoalFeasibility.UNREALISTIC;
    if (requiredMonthly <= activeSurplus) feasibility = GoalFeasibility.ACHIEVABLE;
    else if (requiredMonthly <= 1.5 * activeSurplus) feasibility = GoalFeasibility.STRETCHED;

    goal.feasibility = feasibility;
    await this.goalRepository.save(goal);

    const budgetConflict = requiredMonthly > activeSurplus;

    await this.auditService.log('GOAL_FEASIBILITY_CHECK', goal.user_id, {
      goal_id: goal.id,
      required_monthly: requiredMonthly,
      feasibility,
      budget_conflict: budgetConflict,
    });

    // Generate alternative suggestions for non-achievable goals
    const alternatives = this.generateAlternatives(
      Number(goal.target_amount) - Number(goal.current_amount),
      activeSurplus,
      monthsRemaining,
      feasibility,
    );

    return {
      goal_id: goal.id,
      goal_name: goal.name,
      feasibility,
      required_monthly: requiredMonthly,
      surplus_used: activeSurplus,
      months_remaining: monthsRemaining,
      budget_conflict: budgetConflict,
      alternatives,
    };
  }

  // ─── Full Plan Generation ────────────────────────────────────────────────────

  async generatePlan(userId: string, goalId: string, manualSurplus?: number): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const feasibility = await this.evaluateGoalFeasibility(goalId, manualSurplus);
    if ((feasibility as any).requires_manual_input) return feasibility;

    const { asset_mix, return_rates } = this.generateAssetMix(user.risk_profile);
    const goal = await this.goalRepository.findOne({ where: { id: goalId } });

    const remaining = Number(goal.target_amount) - Number(goal.current_amount);
    const monthsRemaining = (feasibility as any).months_remaining;

    // SIP calculation using future value formula: FV = P * [((1+r)^n - 1) / r] * (1+r)
    const computeSIP = (annualRate: number) => {
      const r = annualRate / 12;
      const n = monthsRemaining;
      if (r === 0) return Math.ceil(remaining / n);
      return Math.ceil(remaining / (((Math.pow(1 + r, n) - 1) / r) * (1 + r)));
    };

    const return_scenarios = {
      conservative: computeSIP(return_rates.conservative),
      base: computeSIP(return_rates.base),
      optimistic: computeSIP(return_rates.optimistic),
    };

    // Tax benefit: ELSS qualifies for 80C up to ₹1.5L/year
    const elssAllocation = asset_mix.equity_funds ?? 0;
    const annualSIP = return_scenarios.base * 12;
    const tax_benefit_80c = Math.min(annualSIP * elssAllocation, 150000);

    // Save plan
    const plan = this.planRepository.create({
      user_id: userId,
      goal_id: goalId,
      risk_profile: user.risk_profile,
      asset_mix,
      return_scenarios,
      monthly_sip: return_scenarios.base,
      budget_conflict: (feasibility as any).budget_conflict,
      tax_benefit_80c,
    });
    await this.planRepository.save(plan);

    await this.auditService.log('INVESTMENT_PLAN_GENERATED', userId, {
      goal_id: goalId,
      risk_profile: user.risk_profile,
      monthly_sip: return_scenarios.base,
    });

    return {
      plan_id: plan.id,
      goal_name: goal.name,
      risk_profile: user.risk_profile,
      feasibility: (feasibility as any).feasibility,
      asset_mix,
      return_scenarios,
      monthly_sip: return_scenarios.base,
      tax_benefit_80c,
      budget_conflict: (feasibility as any).budget_conflict,
      alternatives: (feasibility as any).alternatives,
      disclaimer: this.SEBI_DISCLAIMER,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private generateAlternatives(
    remaining: number,
    surplus: number,
    months: number,
    feasibility: GoalFeasibility,
  ) {
    if (feasibility === GoalFeasibility.ACHIEVABLE) return null;

    // Option A: Lower contribution → extend timeline
    const extendedMonths = Math.ceil(remaining / (surplus * 0.8));
    const extendedDate = new Date();
    extendedDate.setMonth(extendedDate.getMonth() + extendedMonths);

    // Option B: Higher contribution → keep original date
    const higherSIP = Math.ceil(remaining / months);

    return {
      option_a: {
        label: 'Extend timeline',
        monthly_sip: Math.ceil(surplus * 0.8),
        new_target_months: extendedMonths,
        new_target_date: extendedDate.toISOString().split('T')[0],
      },
      option_b: {
        label: 'Increase contribution',
        monthly_sip: higherSIP,
        original_months: months,
      },
    };
  }
}
