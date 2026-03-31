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

  /** POST /api/investments/goals — create a goal */
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

  /** GET /api/investments/goals — list user's goals */
  @UseGuards(JwtAuthGuard)
  @Get('goals')
  async getGoals(@Request() req) {
    return this.investmentService.getUserGoals(req.user.id);
  }

  /** POST /api/investments/risk-profile — submit 8-question quiz */
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

  /** POST /api/investments/feasibility — check goal feasibility */
  @UseGuards(JwtAuthGuard)
  @Post('feasibility')
  async checkFeasibility(@Request() req, @Body() body: { goalId: string; manualSurplus?: number }) {
    if (!body.goalId) throw new BadRequestException('goalId is required.');
    const result = await this.investmentService.evaluateGoalFeasibility(body.goalId, body.manualSurplus);
    return { success: true, data: result };
  }

  /** POST /api/investments/generate-plan — full plan with SIP + scenarios */
  @UseGuards(JwtAuthGuard)
  @Post('generate-plan')
  async generatePlan(@Request() req, @Body() body: { goalId: string; manualSurplus?: number }) {
    if (!body.goalId) throw new BadRequestException('goalId is required.');
    const result = await this.investmentService.generatePlan(req.user.id, body.goalId, body.manualSurplus);
    return { success: true, data: result };
  }

  /** GET /api/investments/seed-test-data — dev helper */
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
