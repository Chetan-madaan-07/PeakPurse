import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from '../transaction.entity';
import { MLTransactionResponse } from './file-upload.service';

export interface ProcessedTransactionResult {
  total: number;
  added: number;
  duplicates: number;
  errors: string[];
  transactions: Transaction[];
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  /**
   * Process ML service response and save transactions to database
   */
  async processMLResponse(mlResponse: MLTransactionResponse): Promise<ProcessedTransactionResult> {
    const result: ProcessedTransactionResult = {
      total: 0,
      added: 0,
      duplicates: 0,
      errors: [],
      transactions: [],
    };

    if (!mlResponse.success) {
      result.errors.push('ML service returned unsuccessful response');
      return result;
    }

    const mlTransactions = mlResponse.data.transactions;
    result.total = mlTransactions.length;

    this.logger.log(`Processing ${mlTransactions.length} transactions from ML service`);

    for (const mlTx of mlTransactions) {
      try {
        // Check if transaction already exists (deduplication)
        const existingTx = await this.transactionRepository.findOne({
          where: { hash: mlTx.transaction_hash },
        });

        if (existingTx) {
          result.duplicates++;
          this.logger.debug(`Duplicate transaction skipped: ${mlTx.transaction_hash}`);
          continue;
        }

        // Map ML response to database entity
        const transaction = this.mapMLTransactionToEntity(mlTx);
        
        // Save to database
        const savedTx = await this.transactionRepository.save(transaction);
        result.added++;
        result.transactions.push(savedTx);

        this.logger.debug(`Transaction saved: ${savedTx.hash}`);

      } catch (error) {
        const errorMsg = `Failed to process transaction ${mlTx.transaction_hash}: ${error.message}`;
        result.errors.push(errorMsg);
        this.logger.error(errorMsg);
      }
    }

    this.logger.log(`Transaction processing complete: ${result.added} added, ${result.duplicates} duplicates, ${result.errors.length} errors`);
    return result;
  }

  /**
   * Map ML service transaction to database entity
   */
  private mapMLTransactionToEntity(mlTx: any): Transaction {
    return {
      hash: mlTx.transaction_hash,
      date: mlTx.date,
      amount: mlTx.amount,
      merchant_name: mlTx.merchant_name,
      description: mlTx.description,
      category: mlTx.category,
      category_source: mlTx.category_source,
      is_recurring: mlTx.is_recurring,
      tax_relevant: mlTx.tax_relevant,
      confidence: mlTx.confidence,
      page_number: mlTx.page_number,
      transaction_index: mlTx.transaction_index,
      raw_tokens: mlTx.raw_tokens,
      processed_at: mlTx.processed_at,
      processor_version: mlTx.processor_version,
    } as Transaction;
  }

  /**
   * Get all transactions for a user (with pagination)
   */
  async getTransactions(page: number = 1, limit: number = 50): Promise<{ transactions: Transaction[]; total: number; page: number; totalPages: number }> {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      order: { date: 'DESC', created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get transactions by category
   */
  async getTransactionsByCategory(category: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { category },
      order: { date: 'DESC' },
    });
  }

  /**
   * Get transactions by date range
   */
  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      order: { date: 'DESC' },
    });
  }

  /**
   * Get spending summary by category
   */
  async getSpendingByCategory(): Promise<Array<{ category: string; total: number; count: number }>> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.category', 'category')
      .addSelect('SUM(transaction.amount)', 'total')
      .addSelect('COUNT(transaction.id)', 'count')
      .where('transaction.amount < :amount', { amount: 0 }) // Only expenses
      .groupBy('transaction.category')
      .orderBy('total', 'DESC')
      .getRawMany();

    return result.map(item => ({
      category: item.category,
      total: parseFloat(item.total),
      count: parseInt(item.count),
    }));
  }

  /**
   * Delete a transaction (soft delete by updating)
   */
  async deleteTransaction(hash: string): Promise<boolean> {
    const result = await this.transactionRepository.delete({ hash });
    return result.affected > 0;
  }

  /**
   * Update transaction category
   */
  async updateTransactionCategory(hash: string, newCategory: string, categorySource: string = 'user_override'): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({ where: { hash } });
    
    if (!transaction) {
      throw new Error(`Transaction with hash ${hash} not found`);
    }

    transaction.category = newCategory;
    transaction.category_source = categorySource;
    
    return this.transactionRepository.save(transaction);
  }

  /**
   * Find a single transaction by its unique hash
   */
  async findByHash(hash: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({ where: { hash } });
  }


  /**
   * Get transaction statistics
   */
  async getTransactionStats(): Promise<{
    totalTransactions: number;
    totalSpent: number;
    totalIncome: number;
    averageTransaction: number;
    categoriesCount: number;
  }> {
    const [stats] = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COUNT(transaction.id)', 'totalTransactions')
      .addSelect('SUM(CASE WHEN transaction.amount < 0 THEN ABS(transaction.amount) ELSE 0 END)', 'totalSpent')
      .addSelect('SUM(CASE WHEN transaction.amount > 0 THEN transaction.amount ELSE 0 END)', 'totalIncome')
      .addSelect('AVG(ABS(transaction.amount))', 'averageTransaction')
      .addSelect('COUNT(DISTINCT transaction.category)', 'categoriesCount')
      .getRawMany();

    return {
      totalTransactions: parseInt(stats.totalTransactions) || 0,
      totalSpent: parseFloat(stats.totalSpent) || 0,
      totalIncome: parseFloat(stats.totalIncome) || 0,
      averageTransaction: parseFloat(stats.averageTransaction) || 0,
      categoriesCount: parseInt(stats.categoriesCount) || 0,
    };
  }
}
