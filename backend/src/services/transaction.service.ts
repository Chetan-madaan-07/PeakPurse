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

      } catch (error: any) { // <--- FIXED ERROR TYPING HERE
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
   * Requirement 8: Subscription Intelligence Scanner
   * Identifies recurring patterns (at least 2 occurrences) within a ±5% variance.
   */
  async scanForSubscriptionLeakage(): Promise<Array<{ merchant: string; amount: number; frequency: string }>> {
    const transactions = await this.transactionRepository.find({
      order: { merchant_name: 'ASC', date: 'ASC' }
    });

    // Grouping by merchant name 
    const grouped = transactions.reduce((acc, tx) => {
      const name = tx.merchant_name || 'Unknown';
      acc[name] = acc[name] || [];
      acc[name].push(tx);
      return acc;
    }, {});

    const subscriptions = [];

    for (const merchant in grouped) {
      const txs = grouped[merchant];
      if (txs.length < 2) continue; // Must have at least 2 consecutive occurrences 

      for (let i = 0; i < txs.length - 1; i++) {
        const amt1 = Math.abs(Number(txs[i].amount));
        const amt2 = Math.abs(Number(txs[i + 1].amount));
        
        // Detection Logic: ±5% variance check 
        const variance = Math.abs(amt1 - amt2) / amt1;
        
        if (variance <= 0.05) {
          subscriptions.push({
            merchant,
            amount: amt1,
            frequency: 'monthly' // Rule-based detection 
          });
          break;
        }
      }
    }
    return subscriptions;
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

  /**
   * Phase 3: Calculate average monthly surplus (Income - Expenses)
   * Strictly handles the zero-transaction edge case for the Investment Advisory System.
   */
  async calculateMonthlySurplus(): Promise<{ surplus: number; hasHistory: boolean; average_income?: number; average_expenses?: number }> {
    // 1. Check if we have ANY transaction data at all 
    const count = await this.transactionRepository.count();
    
    // THE ZERO-TRANSACTION EDGE CASE FALLBACK 
    if (count === 0) {
      this.logger.warn('Zero transaction history detected. Triggering manual surplus fallback.');
      return { 
        surplus: 0, 
        hasHistory: false // This flag tells the Investment Engine to ask for manual input! 
      };
    }

    // 2. If we DO have transactions, calculate the real average monthly surplus 
    const stats = await this.getTransactionStats();
    
    // Find out how many months of data we actually have
    const dates = await this.transactionRepository.query(`
      SELECT MIN(date) as start_date, MAX(date) as end_date FROM transactions
    `);
    
    let monthsOfData = 1;
    if (dates[0]?.start_date && dates[0]?.end_date) {
      const start = new Date(dates[0].start_date);
      const end = new Date(dates[0].end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      monthsOfData = Math.max(1, diffDays / 30); // Minimum 1 month to prevent dividing by zero 
    }

    // Surplus = Average Monthly Income - Average Monthly Expenses 
    const avgMonthlyIncome = stats.totalIncome / monthsOfData;
    const avgMonthlyExpense = stats.totalSpent / monthsOfData;
    const surplus = avgMonthlyIncome - avgMonthlyExpense;

    return {
      surplus: Math.round(surplus * 100) / 100, // Round to 2 decimal places 
      hasHistory: true,
      average_income: avgMonthlyIncome,
      average_expenses: avgMonthlyExpense
    };
  }

  // --- FINANCIAL HEALTH SCORE ENGINE ---
  async generateFinancialHealthScore(): Promise<{ score: number, status: string, details: string }> {
    try {
      // 1. Grab the user's monthly income and expenses using the surplus calculator
      const surplusData = await this.calculateMonthlySurplus(); 

      // 2. Default baseline score
      let score = 50; 
      let status = "Fair";
      let details = "Not enough transaction history to calculate a highly accurate score yet.";

      if (surplusData && surplusData.hasHistory) {
        const income = surplusData.average_income || 0;
        const expenses = surplusData.average_expenses || 0;
        const surplus = surplusData.surplus || 0;

        if (income > 0) {
          // Calculate Savings Rate (The golden rule of financial health)
          const savingsRate = (surplus / income) * 100;

          if (savingsRate >= 30) { 
            score = 95; 
            status = "Excellent"; 
            details = `Outstanding! You are saving ${savingsRate.toFixed(1)}% of your income.`;
          }
          else if (savingsRate >= 15) { 
            score = 80; 
            status = "Good"; 
            details = `Solid financial habits. You are saving ${savingsRate.toFixed(1)}% of your income.`;
          }
          else if (savingsRate > 0) { 
            score = 60; 
            status = "Fair"; 
            details = `You are living within your means, but your savings rate (${savingsRate.toFixed(1)}%) could be optimized.`;
          }
          else { 
            score = 35; 
            status = "Needs Attention"; 
            details = "Your monthly expenses are currently exceeding your income. Let's look for optimization areas.";
          }
        }
      }

      // In the future, you can save this score to a 'UserHealth' database table here!

      return { score, status, details };

    } catch (error: any) { // <--- FIXED ERROR TYPING HERE
      this.logger.error('Failed to generate health score', error.message);
      return { score: 0, status: "Error", details: "Calculation failed" };
    }
  }
}