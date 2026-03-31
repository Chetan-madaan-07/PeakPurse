import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxProfile } from './tax.entity';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(TaxProfile)
    private taxRepository: Repository<TaxProfile>,
  ) {}

  async getOrCreate(userId: string, fy: string): Promise<TaxProfile> {
    let profile = await this.taxRepository.findOne({ where: { user_id: userId, financial_year: fy } });
    if (!profile) {
      profile = this.taxRepository.create({ user_id: userId, financial_year: fy });
      profile = await this.taxRepository.save(profile);
    }
    return profile;
  }

  async update(userId: string, fy: string, data: Partial<TaxProfile>): Promise<TaxProfile> {
    let profile = await this.getOrCreate(userId, fy);
    Object.assign(profile, data);

    // Compute both regimes
    const { old: tax_old, new: tax_new } = this.computeBothRegimes(profile);
    profile.tax_old_regime = tax_old;
    profile.tax_new_regime = tax_new;

    // Recommended savings = unused 80C room
    const used80c = Number(profile.deduction_80c);
    profile.recommended_savings = Math.max(0, 150000 - used80c);

    return this.taxRepository.save(profile);
  }

  async getComparison(userId: string, fy: string) {
    const profile = await this.getOrCreate(userId, fy);
    const { old: tax_old, new: tax_new } = this.computeBothRegimes(profile);
    const better = tax_old <= tax_new ? 'old' : 'new';
    const saving = Math.abs(tax_old - tax_new);

    return {
      profile,
      tax_old_regime: tax_old,
      tax_new_regime: tax_new,
      recommended_regime: better,
      potential_saving: saving,
      deduction_opportunities: this.getDeductionOpportunities(profile),
      disclaimer: 'This is an educational estimate. Consult a CA or ERI for official ITR filing.',
    };
  }

  // ─── Tax computation ─────────────────────────────────────────────────────────

  private computeBothRegimes(p: TaxProfile) {
    const income = Number(p.gross_income);

    // Old regime: apply all deductions
    const totalDeductions = Number(p.standard_deduction) +
      Math.min(Number(p.deduction_80c), 150000) +
      Math.min(Number(p.deduction_80d), 25000) +
      Math.min(Number(p.deduction_80ccd), 50000);
    const taxableOld = Math.max(0, income - totalDeductions);
    const old = this.slabTaxOld(taxableOld);

    // New regime: only standard deduction (₹75K from FY25-26)
    const taxableNew = Math.max(0, income - 75000);
    const newTax = this.slabTaxNew(taxableNew);

    return { old: Math.round(old), new: Math.round(newTax) };
  }

  private slabTaxOld(income: number): number {
    if (income <= 250000) return 0;
    if (income <= 500000) return (income - 250000) * 0.05;
    if (income <= 1000000) return 12500 + (income - 500000) * 0.20;
    return 112500 + (income - 1000000) * 0.30;
  }

  private slabTaxNew(income: number): number {
    // FY 2024-25 new regime slabs
    if (income <= 300000) return 0;
    if (income <= 600000) return (income - 300000) * 0.05;
    if (income <= 900000) return 15000 + (income - 600000) * 0.10;
    if (income <= 1200000) return 45000 + (income - 900000) * 0.15;
    if (income <= 1500000) return 90000 + (income - 1200000) * 0.20;
    return 150000 + (income - 1500000) * 0.30;
  }

  private getDeductionOpportunities(p: TaxProfile) {
    const opps = [];
    const used80c = Number(p.deduction_80c);
    if (used80c < 150000) opps.push({ section: '80C', message: `You can invest ₹${(150000 - used80c).toLocaleString('en-IN')} more in ELSS/PPF/LIC to maximize 80C deduction.` });
    const used80d = Number(p.deduction_80d);
    if (used80d < 25000) opps.push({ section: '80D', message: `You can claim up to ₹${(25000 - used80d).toLocaleString('en-IN')} more via health insurance premiums.` });
    const used80ccd = Number(p.deduction_80ccd);
    if (used80ccd < 50000) opps.push({ section: '80CCD(1B)', message: `Invest ₹${(50000 - used80ccd).toLocaleString('en-IN')} in NPS for additional deduction over 80C limit.` });
    return opps;
  }
}
