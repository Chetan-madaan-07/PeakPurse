import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  Body, 
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TransactionService } from '../services/transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async getTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    return this.transactionService.getTransactions(pageNum, limitNum);
  }

  @Get('stats')
  async getTransactionStats() {
    return this.transactionService.getTransactionStats();
  }

  @Get('category/:category')
  async getTransactionsByCategory(@Param('category') category: string) {
    if (!category || category.trim().length === 0) {
      throw new BadRequestException('Category is required');
    }

    return this.transactionService.getTransactionsByCategory(category.trim());
  }

  @Get('date-range')
  async getTransactionsByDateRange(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Both start_date and end_date are required');
    }

    // Basic date validation
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (start > end) {
      throw new BadRequestException('Start date must be before end date');
    }

    return this.transactionService.getTransactionsByDateRange(startDate, endDate);
  }

  @Get('spending-by-category')
  async getSpendingByCategory() {
    return this.transactionService.getSpendingByCategory();
  }

  @Post(':hash/category')
  async updateTransactionCategory(
    @Param('hash') hash: string,
    @Body() body: { category: string; category_source?: string },
  ) {
    if (!hash || hash.trim().length === 0) {
      throw new BadRequestException('Transaction hash is required');
    }

    if (!body.category || body.category.trim().length === 0) {
      throw new BadRequestException('Category is required');
    }

    try {
      return this.transactionService.updateTransactionCategory(
        hash.trim(),
        body.category.trim(),
        body.category_source || 'user_override',
      );
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get(':hash')
  async getTransactionByHash(@Param('hash') hash: string) {
    if (!hash || hash.trim().length === 0) {
      throw new BadRequestException('Transaction hash is required');
    }

    const transaction = await this.transactionService.findByHash(hash.trim());

    if (!transaction) {
      throw new NotFoundException(`Transaction with hash ${hash} not found`);
    }

    return transaction;
  }

  @Post(':hash/delete')
  async deleteTransaction(@Param('hash') hash: string) {
    if (!hash || hash.trim().length === 0) {
      throw new BadRequestException('Transaction hash is required');
    }

    const deleted = await this.transactionService.deleteTransaction(hash.trim());

    if (!deleted) {
      throw new NotFoundException(`Transaction with hash ${hash} not found`);
    }

    return {
      success: true,
      message: `Transaction ${hash} deleted successfully`,
    };
  }
}
