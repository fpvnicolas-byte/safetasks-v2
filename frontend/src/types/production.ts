export type ProductionStatus = 'draft' | 'proposal_sent' | 'approved' | 'in_progress' | 'completed' | 'canceled';

export interface ProductionItemResponse {
    id: number;
    production_id: number;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface ProductionCrewResponse {
    id: number;
    production_id: number;
    user_id: string; // Changed from number to string
    role: string;
    fee: number;
    full_name?: string;
}

export interface ExpenseResponse {
    id: number;
    production_id: number;
    name: string;
    value: number;
    category: string;
    paid_by?: string; // Assuming this can be optional
}

export interface ClientResponse {
    id: number;
    full_name: string;
    email: string;
    cnpj?: string;
    phone?: string;
    created_at: string;
}

export interface ProductionResponse {
    id: number;
    title: string;
    organization_id: number;
    client_id?: number;
    client?: ClientResponse;
    status: ProductionStatus;
    deadline?: string;
    shooting_sessions?: Array<{ date: string | null, location: string | null }>;
    notes?: string;
    created_at: string;
    updated_at: string;
    payment_method?: string;
    payment_status: string;
    due_date?: string;
    subtotal: number;
    discount: number;
    tax_rate: number;
    tax_amount: number;
    total_value: number;
    total_cost: number;
    profit: number;
    items: ProductionItemResponse[];
    expenses: ExpenseResponse[];
    crew: ProductionCrewResponse[];
}