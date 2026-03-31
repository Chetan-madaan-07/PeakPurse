import { Injectable } from '@nestjs/common';

export interface CAProfile {
  id: string;
  full_name: string;
  icai_number: string;
  city: string;
  expertise_tags: string[];
  aggregate_rating: number;
  phone_number: string;
  remote_available: boolean;
}

export const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat',
];

@Injectable()
export class CaService {
  private readonly MOCK_CA_DIRECTORY: CAProfile[] = [
    // ── Mumbai (5) ──────────────────────────────────────────────────────────
    { id: 'ca-101', full_name: 'CA Priya Patel', icai_number: '654321', city: 'Mumbai', expertise_tags: ['Audit', 'Corporate Tax', 'FEMA'], aggregate_rating: 4.9, phone_number: '+91-9998887776', remote_available: true },
    { id: 'ca-102', full_name: 'CA Rohit Desai', icai_number: '234567', city: 'Mumbai', expertise_tags: ['GST', 'Transfer Pricing', 'FEMA'], aggregate_rating: 4.7, phone_number: '+91-9876501234', remote_available: true },
    { id: 'ca-103', full_name: 'CA Neha Shah', icai_number: '345678', city: 'Mumbai', expertise_tags: ['Startup Advisory', 'Fundraising', 'Direct Tax'], aggregate_rating: 4.8, phone_number: '+91-9765412300', remote_available: true },
    { id: 'ca-104', full_name: 'CA Amit Joshi', icai_number: '456789', city: 'Mumbai', expertise_tags: ['NRI Taxation', 'Wealth Management', '80C Planning'], aggregate_rating: 4.6, phone_number: '+91-9654323456', remote_available: false },
    { id: 'ca-105', full_name: 'CA Kavita Mehta', icai_number: '567890', city: 'Mumbai', expertise_tags: ['Company Law', 'Audit', 'GST'], aggregate_rating: 4.5, phone_number: '+91-9543234567', remote_available: false },

    // ── Delhi (5) ────────────────────────────────────────────────────────────
    { id: 'ca-201', full_name: 'CA Ramesh Sharma', icai_number: '123456', city: 'Delhi', expertise_tags: ['Direct Tax', 'Startup Advisory', 'GST'], aggregate_rating: 4.8, phone_number: '+91-9876543210', remote_available: true },
    { id: 'ca-202', full_name: 'CA Sunita Gupta', icai_number: '223344', city: 'Delhi', expertise_tags: ['Income Tax', 'ITR Filing', '80C Planning'], aggregate_rating: 4.7, phone_number: '+91-9765432109', remote_available: true },
    { id: 'ca-203', full_name: 'CA Deepak Verma', icai_number: '334455', city: 'Delhi', expertise_tags: ['GST', 'Audit', 'Company Law'], aggregate_rating: 4.6, phone_number: '+91-9654321098', remote_available: false },
    { id: 'ca-204', full_name: 'CA Pooja Agarwal', icai_number: '445566', city: 'Delhi', expertise_tags: ['NRI Taxation', 'FEMA', 'Transfer Pricing'], aggregate_rating: 4.9, phone_number: '+91-9543210987', remote_available: true },
    { id: 'ca-205', full_name: 'CA Manish Kapoor', icai_number: '556677', city: 'Delhi', expertise_tags: ['Corporate Tax', 'Mergers & Acquisitions', 'Audit'], aggregate_rating: 4.5, phone_number: '+91-9432109876', remote_available: false },

    // ── Bengaluru (5) ────────────────────────────────────────────────────────
    { id: 'ca-301', full_name: 'CA Arjun Reddy', icai_number: '112233', city: 'Bengaluru', expertise_tags: ['GST', 'Individual Taxation', 'Startup Advisory'], aggregate_rating: 4.6, phone_number: '+91-9123456789', remote_available: false },
    { id: 'ca-302', full_name: 'CA Divya Krishnan', icai_number: '667788', city: 'Bengaluru', expertise_tags: ['ESOP Taxation', 'Startup Advisory', 'Direct Tax'], aggregate_rating: 4.9, phone_number: '+91-9012345678', remote_available: true },
    { id: 'ca-303', full_name: 'CA Suresh Rao', icai_number: '778899', city: 'Bengaluru', expertise_tags: ['Audit', 'Company Law', 'GST'], aggregate_rating: 4.7, phone_number: '+91-8901234567', remote_available: true },
    { id: 'ca-304', full_name: 'CA Ananya Iyer', icai_number: '889900', city: 'Bengaluru', expertise_tags: ['NRI Taxation', 'FEMA', '80C Planning'], aggregate_rating: 4.8, phone_number: '+91-8890123456', remote_available: true },
    { id: 'ca-305', full_name: 'CA Kiran Murthy', icai_number: '990011', city: 'Bengaluru', expertise_tags: ['Transfer Pricing', 'Corporate Tax', 'Audit'], aggregate_rating: 4.5, phone_number: '+91-8789012345', remote_available: false },

    // ── Hyderabad (5) ────────────────────────────────────────────────────────
    { id: 'ca-401', full_name: 'CA Venkat Rao', icai_number: '101112', city: 'Hyderabad', expertise_tags: ['GST', 'Direct Tax', 'Audit'], aggregate_rating: 4.7, phone_number: '+91-8678901234', remote_available: true },
    { id: 'ca-402', full_name: 'CA Lakshmi Prasad', icai_number: '121314', city: 'Hyderabad', expertise_tags: ['Company Law', 'Startup Advisory', 'FEMA'], aggregate_rating: 4.8, phone_number: '+91-8567890123', remote_available: true },
    { id: 'ca-403', full_name: 'CA Ravi Shankar', icai_number: '131415', city: 'Hyderabad', expertise_tags: ['Income Tax', 'ITR Filing', '80C Planning'], aggregate_rating: 4.6, phone_number: '+91-8456789012', remote_available: false },
    { id: 'ca-404', full_name: 'CA Padma Reddy', icai_number: '141516', city: 'Hyderabad', expertise_tags: ['NRI Taxation', 'Wealth Management', 'Direct Tax'], aggregate_rating: 4.9, phone_number: '+91-8345678901', remote_available: true },
    { id: 'ca-405', full_name: 'CA Srinivas Kumar', icai_number: '151617', city: 'Hyderabad', expertise_tags: ['Audit', 'GST', 'Transfer Pricing'], aggregate_rating: 4.5, phone_number: '+91-8234567890', remote_available: false },

    // ── Chennai (5) ──────────────────────────────────────────────────────────
    { id: 'ca-501', full_name: 'CA Vikram Nair', icai_number: '161718', city: 'Chennai', expertise_tags: ['Audit', 'GST', 'Company Law'], aggregate_rating: 4.5, phone_number: '+91-9654321098', remote_available: false },
    { id: 'ca-502', full_name: 'CA Meenakshi Sundaram', icai_number: '171819', city: 'Chennai', expertise_tags: ['Direct Tax', 'NRI Taxation', 'FEMA'], aggregate_rating: 4.8, phone_number: '+91-8123456789', remote_available: true },
    { id: 'ca-503', full_name: 'CA Rajesh Balaji', icai_number: '181920', city: 'Chennai', expertise_tags: ['GST', 'Startup Advisory', 'Income Tax'], aggregate_rating: 4.7, phone_number: '+91-8012345678', remote_available: true },
    { id: 'ca-504', full_name: 'CA Geetha Raman', icai_number: '192021', city: 'Chennai', expertise_tags: ['Audit', 'Company Law', '80C Planning'], aggregate_rating: 4.6, phone_number: '+91-7901234567', remote_available: false },
    { id: 'ca-505', full_name: 'CA Subramaniam V', icai_number: '202122', city: 'Chennai', expertise_tags: ['Transfer Pricing', 'Corporate Tax', 'FEMA'], aggregate_rating: 4.9, phone_number: '+91-7890123456', remote_available: true },

    // ── Kolkata (5) ──────────────────────────────────────────────────────────
    { id: 'ca-601', full_name: 'CA Sourav Banerjee', icai_number: '212223', city: 'Kolkata', expertise_tags: ['Direct Tax', 'Audit', 'GST'], aggregate_rating: 4.7, phone_number: '+91-7789012345', remote_available: true },
    { id: 'ca-602', full_name: 'CA Rina Chatterjee', icai_number: '222324', city: 'Kolkata', expertise_tags: ['Income Tax', 'ITR Filing', 'Company Law'], aggregate_rating: 4.8, phone_number: '+91-7678901234', remote_available: true },
    { id: 'ca-603', full_name: 'CA Debashis Ghosh', icai_number: '232425', city: 'Kolkata', expertise_tags: ['NRI Taxation', 'FEMA', 'Wealth Management'], aggregate_rating: 4.6, phone_number: '+91-7567890123', remote_available: false },
    { id: 'ca-604', full_name: 'CA Anindita Roy', icai_number: '242526', city: 'Kolkata', expertise_tags: ['Startup Advisory', 'GST', 'Audit'], aggregate_rating: 4.9, phone_number: '+91-7456789012', remote_available: true },
    { id: 'ca-605', full_name: 'CA Partha Sarathi', icai_number: '252627', city: 'Kolkata', expertise_tags: ['Corporate Tax', 'Transfer Pricing', 'Audit'], aggregate_rating: 4.5, phone_number: '+91-7345678901', remote_available: false },

    // ── Pune (5) ─────────────────────────────────────────────────────────────
    { id: 'ca-701', full_name: 'CA Sachin Kulkarni', icai_number: '262728', city: 'Pune', expertise_tags: ['GST', 'Direct Tax', 'Startup Advisory'], aggregate_rating: 4.8, phone_number: '+91-7234567890', remote_available: true },
    { id: 'ca-702', full_name: 'CA Madhuri Deshpande', icai_number: '272829', city: 'Pune', expertise_tags: ['Audit', 'Company Law', 'Income Tax'], aggregate_rating: 4.7, phone_number: '+91-7123456789', remote_available: true },
    { id: 'ca-703', full_name: 'CA Nikhil Joshi', icai_number: '282930', city: 'Pune', expertise_tags: ['NRI Taxation', '80C Planning', 'FEMA'], aggregate_rating: 4.6, phone_number: '+91-7012345678', remote_available: false },
    { id: 'ca-704', full_name: 'CA Swati Patil', icai_number: '293031', city: 'Pune', expertise_tags: ['Corporate Tax', 'Transfer Pricing', 'GST'], aggregate_rating: 4.9, phone_number: '+91-6901234567', remote_available: true },
    { id: 'ca-705', full_name: 'CA Rahul Bhosale', icai_number: '303132', city: 'Pune', expertise_tags: ['Audit', 'Startup Advisory', 'Direct Tax'], aggregate_rating: 4.5, phone_number: '+91-6890123456', remote_available: false },

    // ── Ahmedabad (5) ────────────────────────────────────────────────────────
    { id: 'ca-801', full_name: 'CA Sunita Mehta', icai_number: '313233', city: 'Ahmedabad', expertise_tags: ['Income Tax', 'NRI Taxation', '80C Planning'], aggregate_rating: 4.7, phone_number: '+91-9765432100', remote_available: true },
    { id: 'ca-802', full_name: 'CA Hitesh Shah', icai_number: '323334', city: 'Ahmedabad', expertise_tags: ['GST', 'Audit', 'Company Law'], aggregate_rating: 4.8, phone_number: '+91-6789012345', remote_available: true },
    { id: 'ca-803', full_name: 'CA Bhavna Trivedi', icai_number: '333435', city: 'Ahmedabad', expertise_tags: ['Direct Tax', 'Startup Advisory', 'FEMA'], aggregate_rating: 4.6, phone_number: '+91-6678901234', remote_available: false },
    { id: 'ca-804', full_name: 'CA Jignesh Patel', icai_number: '343536', city: 'Ahmedabad', expertise_tags: ['Corporate Tax', 'Transfer Pricing', 'Audit'], aggregate_rating: 4.9, phone_number: '+91-6567890123', remote_available: true },
    { id: 'ca-805', full_name: 'CA Minal Gandhi', icai_number: '353637', city: 'Ahmedabad', expertise_tags: ['Wealth Management', 'NRI Taxation', '80C Planning'], aggregate_rating: 4.5, phone_number: '+91-6456789012', remote_available: false },

    // ── Jaipur (5) ───────────────────────────────────────────────────────────
    { id: 'ca-901', full_name: 'CA Rajendra Sharma', icai_number: '363738', city: 'Jaipur', expertise_tags: ['Direct Tax', 'GST', 'Audit'], aggregate_rating: 4.7, phone_number: '+91-6345678901', remote_available: true },
    { id: 'ca-902', full_name: 'CA Priti Agarwal', icai_number: '373839', city: 'Jaipur', expertise_tags: ['Income Tax', 'ITR Filing', 'Company Law'], aggregate_rating: 4.8, phone_number: '+91-6234567890', remote_available: true },
    { id: 'ca-903', full_name: 'CA Vikash Gupta', icai_number: '383940', city: 'Jaipur', expertise_tags: ['NRI Taxation', 'FEMA', 'Wealth Management'], aggregate_rating: 4.6, phone_number: '+91-6123456789', remote_available: false },
    { id: 'ca-904', full_name: 'CA Seema Mathur', icai_number: '394041', city: 'Jaipur', expertise_tags: ['Startup Advisory', 'GST', '80C Planning'], aggregate_rating: 4.9, phone_number: '+91-6012345678', remote_available: true },
    { id: 'ca-905', full_name: 'CA Ashok Singhvi', icai_number: '404142', city: 'Jaipur', expertise_tags: ['Corporate Tax', 'Audit', 'Transfer Pricing'], aggregate_rating: 4.5, phone_number: '+91-5901234567', remote_available: false },

    // ── Surat (5) ────────────────────────────────────────────────────────────
    { id: 'ca-1001', full_name: 'CA Haresh Desai', icai_number: '414243', city: 'Surat', expertise_tags: ['GST', 'Direct Tax', 'Audit'], aggregate_rating: 4.7, phone_number: '+91-5890123456', remote_available: true },
    { id: 'ca-1002', full_name: 'CA Nisha Patel', icai_number: '424344', city: 'Surat', expertise_tags: ['Income Tax', 'Company Law', 'NRI Taxation'], aggregate_rating: 4.8, phone_number: '+91-5789012345', remote_available: true },
    { id: 'ca-1003', full_name: 'CA Kalpesh Shah', icai_number: '434445', city: 'Surat', expertise_tags: ['Startup Advisory', 'FEMA', 'Transfer Pricing'], aggregate_rating: 4.6, phone_number: '+91-5678901234', remote_available: false },
    { id: 'ca-1004', full_name: 'CA Varsha Mehta', icai_number: '444546', city: 'Surat', expertise_tags: ['Audit', '80C Planning', 'Wealth Management'], aggregate_rating: 4.9, phone_number: '+91-5567890123', remote_available: true },
    { id: 'ca-1005', full_name: 'CA Dinesh Kothari', icai_number: '454647', city: 'Surat', expertise_tags: ['Corporate Tax', 'GST', 'Company Law'], aggregate_rating: 4.5, phone_number: '+91-5456789012', remote_available: false },
  ];

  getCities(): string[] {
    return CITIES;
  }

  getByCity(city: string): CAProfile[] {
    return this.MOCK_CA_DIRECTORY.filter(
      ca => ca.city.toLowerCase() === city.toLowerCase(),
    );
  }

  getMockDirectory(): CAProfile[] {
    return this.MOCK_CA_DIRECTORY;
  }
}
