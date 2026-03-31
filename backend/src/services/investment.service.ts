import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, RiskProfile } from '../user.entity';
import { Goal, GoalFeasibility } from '../goal.entity';
import { InvestmentPlan } from '../investment-plan.entity';
import { TransactionService } from './transaction.service';
import { AuditService } from './audit.service';

@Injectable()
export class InvestmentService {
  private readonly logger = new Logger(InvestmentService.name);

  // Requirement 20.3: Mandatory SEBI Disclaimer
  public readonly SEBI_DISCLAIMER = "Disclaimer: PeakPurse is not a SEBI-registered RIA. These recommendations are educational model portfolios and not personalized investment advice.";

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Goal) private goalRepository: Repository<Goal>,
    @InjectRepository(InvestmentPlan) private planRepository: Repository<InvestmentPlan>,
    private transactionService: TransactionService,
    private auditService: AuditService, // Phase 6: Requirement 4 - Audit Injection
  ) {}

  /**
   * Phase 2: Risk Profiler
   * Scores the 8-question quiz and saves results to the user record.
   */
  async calculateRiskProfile(userId: string, answers: number[]): Promise<RiskProfile> {
    if (answers.length !== 8) {
      throw new BadRequestException('Exactly 8 answers are required for the risk profile.');
    }

    const totalScore = answers.reduce((sum, score) => sum + score, 0);
    let profile = RiskProfile.CONSERVATIVE;

    if (totalScore >= 21) {
      profile = RiskProfile.AGGRESSIVE;
    } else if (totalScore >= 11) {
      profile = RiskProfile.MODERATE;
    }

    await this.userRepository.update(userId, { risk_profile: profile });

    // Phase 6: Audit Logging for Risk Profile updates
    await this.auditService.log('RISK_PROFILE_UPDATED', userId, { 
      score: totalScore, 
      assigned_profile: profile 
    });

    return profile;
  }

  /**
   * Phase 4: Asset Allocation
   * Maps profile to category-level allocations (SEBI compliant - no specific funds).
   */
  generateAssetMix(profile: RiskProfile) {
    let mix;
    let scenarios;

    switch (profile) {
      case RiskProfile.AGGRESSIVE:
        mix = { equity_funds: 0.8, debt_funds: 0.2 };
        scenarios = { conservative: 0.08, base: 0.12, optimistic: 0.15 };
        break;
      case RiskProfile.MODERATE:
        mix = { equity_funds: 0.5, debt_funds: 0.5 };
        scenarios = { conservative: 0.07, base: 0.10, optimistic: 0.12 };
        break;
      case RiskProfile.CONSERVATIVE:
      default:
        mix = { equity_funds: 0.2, debt_funds: 0.8 };
        scenarios = { conservative: 0.05, base: 0.07, optimistic: 0.09 };
        break;
    }

    return { asset_mix: mix, return_rates: scenarios, disclaimer: this.SEBI_DISCLAIMER };
  }

  /**
   * Phase 3: Feasibility Engine
   * Calculates if a goal is reachable and flags budget conflicts.
   */
  async evaluateGoalFeasibility(goalId: string, manualSurplus?: number) {
    const goal = await this.goalRepository.findOne({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found');

    const targetDate = new Date(goal.target_date);
    const today = new Date();
    
    let monthsRemaining = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());
    
    // Phase 6: Edge Case - Zero Months (Error 422)
    if (monthsRemaining <= 0) {
      throw new BadRequestException('Target date must be at least 1 month in the future');
    }

    // Property 18: Monthly savings MUST round up to nearest rupee
    const requiredMonthly = Math.ceil((Number(goal.target_amount) - Number(goal.current_amount)) / monthsRemaining);

    let activeSurplus = manualSurplus;

    if (activeSurplus === undefined) {
      const surplusData = await this.transactionService.calculateMonthlySurplus();
      
      // Zero Transaction History Fallback
      if (!surplusData.hasHistory) {
        return {
          requires_manual_input: true,
          message: "No transaction history found. Please provide estimated monthly savings.",
          required_monthly: requiredMonthly
        };
      }
      activeSurplus = surplusData.surplus;
    }

    // Phase 3: Classification Logic (1.5x Surplus Rule)
    let feasibility = GoalFeasibility.UNREALISTIC;
    if (requiredMonthly <= activeSurplus) {
      feasibility = GoalFeasibility.ACHIEVABLE;
    } else if (requiredMonthly <= 1.5 * activeSurplus) {
      feasibility = GoalFeasibility.STRETCHED;
    }

    goal.feasibility = feasibility;
    await this.goalRepository.save(goal);

    // Property 36: Trigger budget_conflict if total SIP > surplus
    const budgetConflict = requiredMonthly > activeSurplus;

    // Phase 6: Audit Logging for Feasibility Check
    await this.auditService.log('GOAL_FEASIBILITY_CHECK', goal.user_id, {
      goal_id: goal.id,
      required_monthly: requiredMonthly,
      feasibility: feasibility,
      budget_conflict: budgetConflict
    });

    return {
      goal_id: goal.id,
      feasibility,
      required_monthly: requiredMonthly,
      surplus_used: activeSurplus,
      budget_conflict: budgetConflict
    };
  }
}