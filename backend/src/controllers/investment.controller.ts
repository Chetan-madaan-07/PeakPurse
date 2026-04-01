import { Controller, Post, Get, Body, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvestmentService } from '../services/investment.service';
import { Goal } from '../goal.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('investments')
export class InvestmentController {
  constructor(
    private readonly investmentService: InvestmentService,
    @InjectRepository(Goal) private goalRepo: Repository<Goal>,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('goals')
  async createGoal(@Request() req, @Body() body: {
    name: string;
    target_amount: number;
    current_amount?: number;
    target_date: string;
    priority?: string;
  }) {
    if (!body.name || !body.target_amount || !body.target_date) {
      throw new BadRequestException('name, target_amount, and target_date are required.');
    }
    return this.investmentService.createGoal(req.user.id, body as any);
  }

  @UseGuards(JwtAuthGuard)
  @Get('goals')
  async getGoals(@Request() req) {
    return this.investmentService.getUserGoals(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('risk-profile')
  async submitRiskProfile(@Request() req, @Body() body: { answers: number[] }) {
    if (!body.answers || body.answers.length !== 8) {
      throw new BadRequestException('Exactly 8 answers are required.');
    }
    const profile = await this.investmentService.calculateRiskProfile(req.user.id, body.answers);
    const mix = this.investmentService.generateAssetMix(profile);
    return { success: true, data: { risk_profile: profile, strategy: mix } };
  }

  @UseGuards(JwtAuthGuard)
  @Post('feasibility')
  async checkFeasibility(@Request() req, @Body() body: { goalId: string; manualSurplus?: number }) {
    if (!body.goalId) throw new BadRequestException('goalId is required.');
    const result = await this.investmentService.evaluateGoalFeasibility(body.goalId, body.manualSurplus);
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate-plan')
  async generatePlan(@Request() req, @Body() body: { goalId: string; manualSurplus?: number }) {
    if (!body.goalId) throw new BadRequestException('goalId is required.');
    const result = await this.investmentService.generatePlan(req.user.id, body.goalId, body.manualSurplus);
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('retirement-plan')
  async generateRetirementPlan(@Request() req, @Body() body: {
    currentAge: number;
    retirementAge: number;
    lifeExpectancy: number;
    expectedReturnRate: number;
    inflationRate: number;
    includeEPF: boolean;
    stepUpSIP?: boolean;           // NEW: 10% annual increase
    lifestyleRatio?: number;       // NEW: e.g., 0.7 for modest
    manualTargetCorpus?: number;   // NEW: User override
    manualCurrentSavings?: number;
    manualMonthlyExpenses?: number;
  }) {
    if (!body.currentAge || !body.retirementAge || !body.expectedReturnRate || !body.inflationRate) {
      throw new BadRequestException('Missing required retirement parameters.');
    }
    const result = await this.investmentService.generateRetirementPlan(req.user.id, body);
    return { success: true, data: result };
  }

  @Get('seed-test-data')
  async seedTestData() {
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + 5);
    const goal = this.goalRepo.create({
      name: 'Dream Car',
      target_amount: 2000000,
      current_amount: 0,
      target_date: targetDate.toISOString().split('T')[0],
    });
    const saved = await this.goalRepo.save(goal);
    return { message: 'Dummy goal created', goalId: saved.id };
  }
}