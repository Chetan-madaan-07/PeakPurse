import { Controller, Post, Body, BadRequestException, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvestmentService } from '../services/investment.service';
import { Goal } from '../goal.entity';

@Controller('investments')
export class InvestmentController {
  constructor(
    private readonly investmentService: InvestmentService,
    @InjectRepository(Goal) private goalRepo: Repository<Goal>
  ) {}

  /**
   * Cheat Code Endpoint to create a dummy goal for testing
   * GET /api/investments/seed-test-data
   */
  @Get('seed-test-data')
  async seedTestData() {
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + 5); 

    const dummyGoal = this.goalRepo.create({
      name: 'Hackathon Dream Car',
      target_amount: 2000000,
      current_amount: 0,
      target_date: targetDate.toISOString().split('T')[0],
    });

    const savedGoal = await this.goalRepo.save(dummyGoal);
    return { message: 'Dummy goal created! Use this ID for testing:', goalId: savedGoal.id };
  }

  /**
   * Endpoint for Step 2 of the Frontend UI: Submitting the Quiz
   * POST /api/investments/risk-profile
   */
  @Post('risk-profile')
  async submitRiskProfile(@Body() body: { userId: string; answers: number[] }) {
    if (!body.userId || !body.answers) {
      throw new BadRequestException('userId and answers array are required.');
    }

    const profile = await this.investmentService.calculateRiskProfile(body.userId, body.answers);
    const mix = this.investmentService.generateAssetMix(profile);
    
    return {
      success: true,
      data: {
        risk_profile: profile,
        strategy: mix
      }
    };
  }

  /**
   * Endpoint for Step 3 of the Frontend UI: Checking Goal Feasibility
   * POST /api/investments/feasibility
   */
  @Post('feasibility')
  async checkFeasibility(@Body() body: { goalId: string; manualSurplus?: number }) {
    if (!body.goalId) {
      throw new BadRequestException('goalId is required.');
    }

    const result = await this.investmentService.evaluateGoalFeasibility(body.goalId, body.manualSurplus);
    
    return {
      success: true,
      data: result
    };
  }
}