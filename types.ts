
export enum UserRole {
  USER = 'USER'
}

export interface Tenant {
  id: string;
  name: string;
}

export interface CompanyGroup {
  id: string;
  name: string;
  tenantId: string;
}

export interface Company {
  id: string;
  name: string;
  groupId: string;
  tenantId: string;
}

export interface Branch {
  id: string;
  cnpj: string;
  name: string;
  companyId: string;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  tenantId: string;
  companyId: string; // Linked directly to a company
  confirmed: boolean;
}

export interface TaxRateYear {
  year: number;
  percIBS: number;
  percCBS: number;
  percReducICMS: number;
}

export interface SpedC100 {
  cnpj: string;
  dtDoc: string;
  indOper: number; // 0=In, 1=Out
  vlDoc: number;
  vlBcIcms: number;
  vlIcms: number;
  vlPis: number;
  vlCofins: number;
}

export interface SpedC500 {
  cnpj: string;
  dtDoc: string;
  vlDoc: number;
  vlBcIcms: number;
  vlIcms: number;
  vlPis: number;
  vlCofins: number;
}

export interface SpedD100 {
  cnpj: string;
  dtDoc: string;
  indOper: number;
  vlDoc: number;
  vlBcIcms: number;
  vlIcms: number;
  vlPis: number;
  vlCofins: number;
}

export interface SpedData {
  c100: SpedC100[];
  c500: SpedC500[]; // Credits
  c600: SpedC500[]; // Debits
  d100: SpedD100[];
}
