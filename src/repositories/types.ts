export type PayeeCategory = "SCHOOL" | "LANDLORD" | "HOSPITAL" | "UTILITY" | "OTHER";
export type RemittanceStatus = "PENDING" | "CLAIMED" | "REJECTED" | "REFUNDED";

export interface PayeeView {
  address: string;
  name: string;
  category: PayeeCategory;
  verified: boolean;
  registeredAt: string;
}

export interface RemittanceView {
  id: number;
  sender: string;
  payee: string;
  token: string;
  amount: string;
  reference: string;
  expiresAt: string;
  status: RemittanceStatus;
  sentAt: string;
  sentTx: string;
  settledAt: string | null;
  settledTx: string | null;
}

export interface RemittanceDetail extends RemittanceView {
  /** Null if the payee has not been indexed yet. */
  payeeProfile: PayeeView | null;
}

export interface Page {
  limit: number;
  offset: number;
}

export interface ListPayeesQuery extends Page {
  q?: string;
  category?: PayeeCategory;
  verified?: boolean;
}

export interface ListRemittancesQuery extends Page {
  sender?: string;
  payee?: string;
  status?: RemittanceStatus;
}

export interface Stats {
  remittances: number;
  pending: number;
  claimed: number;
  payees: number;
  verifiedPayees: number;
}

/** Read side used by the HTTP routes. Swappable so routes can be tested without Postgres. */
export interface ReadRepository {
  listPayees(query: ListPayeesQuery): Promise<PayeeView[]>;
  getPayee(address: string): Promise<PayeeView | null>;
  listRemittances(query: ListRemittancesQuery): Promise<RemittanceView[]>;
  getRemittance(id: number): Promise<RemittanceDetail | null>;
  stats(): Promise<Stats>;
}
