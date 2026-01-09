
'use client';

import { Save, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { GeneralTab } from './tabs/GeneralTab';
import { FinancialTab } from './tabs/FinancialTab';
import { ItemsTab } from './tabs/ItemsTab';
import { CrewTab } from './tabs/CrewTab';
import { ExpensesTab } from './tabs/ExpensesTab';
import { useState, useEffect } from 'react';
import { productionsApi, servicesApi, usersApi } from '@/lib/api';
import { toast } from 'sonner';

// --- Start Frontend Interfaces (Temporary Workaround) ---
export type ProductionStatus = 'draft' | 'proposal_sent' | 'approved' | 'in_progress' | 'completed' | 'canceled';

export interface ProductionItemResponse {
    id: number;
    production_id?: number;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    service_id?: number;
}

export interface ProductionCrewResponse {
    id: number;
    production_id?: number;
    user_id: string;
    role: string;
    fee: number;
    full_name?: string;
}

export interface ExpenseResponse {
    id: number;
    production_id?: number;
    name: string;
    value: number;
    category: string;
    paid_by?: string;
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

export interface ServiceResponse {
    id: number;
    name: string;
    description: string | null;
    default_price: number;
    unit: string | null;
    organization_id: number;
}
// --- End Frontend Interfaces (Temporary Workaround) ---

interface ProductionEditSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    production: ProductionResponse;
    onUpdate: () => void;
}

export function ProductionEditSheet({
    open,
    onOpenChange,
    production,
    onUpdate,
}: ProductionEditSheetProps) {
    const [localItems, setLocalItems] = useState<ProductionItemResponse[]>([]);
    const [localCrew, setLocalCrew] = useState<ProductionCrewResponse[]>([]);
    const [localExpenses, setLocalExpenses] = useState<ExpenseResponse[]>([]);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const [selectedService, setSelectedService] = useState<ServiceResponse | null>(null);
    const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
    const [newCrewRole, setNewCrewRole] = useState<string>('');
    const [newCrewFee, setNewCrewFee] = useState<number>(0);
    const [newExpenseName, setNewExpenseName] = useState<string>('');
    const [newExpenseValue, setNewExpenseValue] = useState<number>(0);
    const [newExpenseCategory, setNewExpenseCategory] = useState<string>('Outros');

    const [editForm, setEditForm] = useState({
        title: production.title || '',
        status: production.status || 'draft' as ProductionStatus,
        deadline: production.deadline ? new Date(production.deadline).toISOString().split('T')[0] : '',
        shooting_sessions: production.shooting_sessions || [],
        payment_method: production.payment_method || '',
        payment_status: production.payment_status || 'pending',
        due_date: production.due_date ? new Date(production.due_date).toISOString().split('T')[0] : '',
        discount: production.discount || 0,
        tax_rate: production.tax_rate || 0,
        notes: production.notes || '',
    });

    const [services, setServices] = useState<ServiceResponse[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        if (production) {
            setLocalItems(production.items || []);
            setLocalCrew(production.crew || []);
            setLocalExpenses(production.expenses || []);
            setEditForm({
                title: production.title || '',
                status: production.status || 'draft' as ProductionStatus,
                deadline: production.deadline ? new Date(production.deadline).toISOString().split('T')[0] : '',
                shooting_sessions: production.shooting_sessions || [],
                payment_method: production.payment_method || '',
                payment_status: production.payment_status || 'pending',
                due_date: production.due_date ? new Date(production.due_date).toISOString().split('T')[0] : '',
                discount: production.discount || 0,
                tax_rate: production.tax_rate || 0,
                notes: production.notes || '',
            });
            setIsEditing(false);
        }
    }, [production]);

    const fetchServices = async () => {
        try {
            const data = await servicesApi.getServices();
            setServices(data);
        } catch (error) {
            console.error('Failed to fetch services:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await usersApi.getUsers();

            // API pode retornar array direto OU objeto com propriedade 'users'
            const usersArray = Array.isArray(data) ? data : (data.users || []);

            setUsers(usersArray);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setUsers([]);
        }
    };

    const handleLocalAddItem = (service: ServiceResponse, quantity: number) => {
        if (service && quantity > 0) {
            const newId = -Date.now();
            const newItem: ProductionItemResponse = {
                id: newId,
                service_id: service.id,
                name: service.name,
                quantity: quantity,
                unit_price: service.default_price,
                total_price: quantity * service.default_price,
            };
            setLocalItems(prev => [...prev, newItem]);
            setSelectedService(null);
            setNewItemQuantity(1);
            setIsEditing(true);

            toast.success('Item adicionado', {
                description: `${service.name} foi adicionado à lista.`,
            });
        }
    };

    const handleLocalRemoveItem = (itemId: number) => {
        const itemToRemove = localItems.find(item => item.id === itemId);
        setLocalItems(prev => prev.filter(item => item.id !== itemId));
        setIsEditing(true);

        if (itemToRemove) {
            toast.info('Item removido', {
                description: `${itemToRemove.name} foi removido da lista.`,
            });
        }
    };

    const handleLocalAddCrewMember = (selectedUserId: string, role: string, fee: number) => {
        console.group('🔍 handleLocalAddCrewMember CALLED');
        console.log('📦 selectedUserId:', selectedUserId, 'type:', typeof selectedUserId);
        console.log('📦 role:', role);
        console.log('📦 fee (reais):', fee);
        console.log('📦 users array:', users);

        if (selectedUserId && role.trim() && fee >= 0) {
            console.log('✅ Validation passed');

            const user = users.find(u => u.id === selectedUserId);  // Compare strings directly

            console.log('📦 Found user:', user);

            if (user) {
                console.log('✅ User found, creating member...');
                // 🔄 CONVERTER REAIS PARA CENTAVOS
                const feeInCents = Math.round(fee * 100);
                console.log('💰 Fee converted to cents:', feeInCents);

                const newId = -Date.now();
                const newMember: ProductionCrewResponse = {
                    id: newId,
                    user_id: user.id,  // UUID string
                    full_name: user.full_name,
                    role: role,
                    fee: feeInCents,  // Store in cents
                };

                setLocalCrew(prev => [...prev, newMember]);
                setNewCrewRole('');
                setNewCrewFee(0);
                setIsEditing(true);

                toast.success('Membro adicionado', {
                    description: `${user.full_name} foi adicionado à equipe.`,
                });
            }
        }
        console.groupEnd();
    };

    const handleLocalRemoveCrewMember = (crewId: number) => {
        const memberToRemove = localCrew.find(member => member.id === crewId);
        setLocalCrew(prev => prev.filter(member => member.id !== crewId));
        setIsEditing(true);

        if (memberToRemove) {
            toast.info('Membro removido', {
                description: `${memberToRemove.full_name} foi removido da equipe.`,
            });
        }
    };

    const handleLocalAddExpense = (name: string, value: number, category: string) => {
        if (name.trim() && value > 0 && category.trim()) {
            // 🔄 CONVERTER REAIS PARA CENTAVOS
            const valueInCents = Math.round(value * 100);
            console.log('💰 Expense value converted to cents:', valueInCents);

            const newId = -Date.now();
            const newExpense: ExpenseResponse = {
                id: newId,
                name: name,
                value: valueInCents,  // Store in cents
                category: category,
            };
            setLocalExpenses(prev => [...prev, newExpense]);
            setNewExpenseName('');
            setNewExpenseValue(0);
            setNewExpenseCategory('Outros');
            setIsEditing(true);

            toast.success('Despesa adicionada', {
                description: `${name} foi adicionada à lista.`,
            });
        }
    };

    const handleLocalRemoveExpense = (expenseId: number) => {
        const expenseToRemove = localExpenses.find(expense => expense.id === expenseId);
        setLocalExpenses(prev => prev.filter(expense => expense.id !== expenseId));
        setIsEditing(true);

        if (expenseToRemove) {
            toast.info('Despesa removida', {
                description: `${expenseToRemove.name} foi removida da lista.`,
            });
        }
    };

    const handleEditFormChange = (updates: Partial<typeof editForm>) => {
        setEditForm(prev => ({ ...prev, ...updates }));
        setIsEditing(true);
    };

    const handleAddShootingSession = () => {
        setEditForm(prev => ({
            ...prev,
            shooting_sessions: [...prev.shooting_sessions, { date: null, location: null }]
        }));
        setIsEditing(true);
    };

    const handleRemoveShootingSession = (index: number) => {
        setEditForm(prev => ({
            ...prev,
            shooting_sessions: prev.shooting_sessions.filter((_, i) => i !== index)
        }));
        setIsEditing(true);
    };

    const handleUpdateShootingSessionDate = (index: number, value: string) => {
        setEditForm(prev => ({
            ...prev,
            shooting_sessions: prev.shooting_sessions.map((session, i) =>
                i === index ? { ...session, date: value } : session
            )
        }));
        setIsEditing(true);
    };

    const handleUpdateShootingSessionLocation = (index: number, value: string) => {
        setEditForm(prev => ({
            ...prev,
            shooting_sessions: prev.shooting_sessions.map((session, i) =>
                i === index ? { ...session, location: value } : session
            )
        }));
        setIsEditing(true);
    };


    const handleSave = async () => {
        if (!production) return;

        const payload = {
            ...editForm,
            // 🔒 CONVERTER STRINGS VAZIAS EM NULL PARA DATAS
            deadline: editForm.deadline || null,
            due_date: editForm.due_date || null,
            payment_method: editForm.payment_method || null,

            // 🔒 SANEAR PAYLOAD: Remover IDs negativos (itens novos não devem ter ID)
            items: localItems.map(({ id, ...item }) =>
                id < 0 ? item : { id, ...item }
            ),
            // 🔒 SANEAR PAYLOAD: Remover full_name (não é campo do backend) e IDs negativos
            crew: localCrew.map(({ id, full_name, ...member }) =>
                id < 0 ? member : { id, ...member }
            ),
            // 🔒 SANEAR PAYLOAD: Remover IDs negativos
            expenses: localExpenses.map(({ id, ...expense }) =>
                id < 0 ? expense : { id, ...expense }
            ),
        };

        console.group('📤 SENDING PAYLOAD');
        console.log('📦 Production ID:', production.id);
        console.log('📦 Full Payload:', JSON.stringify(payload, null, 2));
        console.log('📦 Items Count:', payload.items?.length || 0);
        console.log('📦 Items Detail:', payload.items);
        console.log('📦 Crew Count:', payload.crew?.length || 0);
        console.log('📦 Expenses Count:', payload.expenses?.length || 0);
        console.log('📦 Edit Form:', editForm);
        console.groupEnd();

        try {
            await productionsApi.updateProduction(production.id, payload);

            toast.success('Produção salva com sucesso!', {
                description: 'Todas as alterações foram aplicadas.',
            });

            onUpdate();
            onOpenChange(false);
        } catch (error: any) {
            console.group('🔴 ERROR DETAILS');
            console.error('❌ FULL ERROR OBJECT:', error);
            console.error('❌ ERROR MESSAGE:', error.message);
            console.error('❌ ERROR NAME:', error.name);

            // Axios-specific properties
            console.error('❌ RESPONSE:', error?.response);
            console.error('❌ RESPONSE STATUS:', error?.response?.status);
            console.error('❌ RESPONSE HEADERS:', error?.response?.headers);
            console.error('❌ RESPONSE DATA:', error?.response?.data);
            console.error('❌ RESPONSE DATA TYPE:', typeof error?.response?.data);

            // Request details
            console.error('❌ REQUEST URL:', error?.config?.url);
            console.error('❌ REQUEST METHOD:', error?.config?.method);
            console.error('❌ REQUEST DATA:', error?.config?.data);

            console.groupEnd();

            // Extract error message safely (Pydantic returns array of errors)
            let errorMessage = 'Check your data and try again.';

            if (error?.response?.data?.detail) {
                const detail = error.response.data.detail;

                // If it's a Pydantic validation error array
                if (Array.isArray(detail)) {
                    errorMessage = detail.map((err: any) =>
                        `${err.loc?.join(' → ') || 'Field'}: ${err.msg || 'Validation error'}`
                    ).join(', ');
                } else if (typeof detail === 'string') {
                    errorMessage = detail;
                }
            } else if (error?.response?.status === 422) {
                errorMessage = 'Validation error (422). Check browser console for full payload details.';
            }

            toast.error('Failed to save production', {
                description: errorMessage,
            });
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
        if (production) {
            setLocalItems(production.items || []);
            setLocalCrew(production.crew || []);
            setLocalExpenses(production.expenses || []);
            setEditForm({
                title: production.title || '',
                status: production.status || 'draft' as ProductionStatus,
                deadline: production.deadline ? new Date(production.deadline).toISOString().split('T')[0] : '',
                shooting_sessions: production.shooting_sessions || [],
                payment_method: production.payment_method || '',
                payment_status: production.payment_status || 'pending',
                due_date: production.due_date ? new Date(production.due_date).toISOString().split('T')[0] : '',
                discount: production.discount || 0,
                tax_rate: production.tax_rate || 0,
                notes: production.notes || '',
            });
            setIsEditing(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 [&>button]:hidden">
                <SheetHeader className="border-b border-white/10 pb-4 relative">
                    <div className="flex items-center justify-between w-full pr-12">
                        <SheetTitle className="text-slate-50">
                            {production?.title}
                        </SheetTitle>
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={handleSave}
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={!isEditing}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Salvar
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary text-slate-400 hover:text-slate-300"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </SheetHeader>

                {production && (
                    <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)] pr-4">
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-5 bg-slate-900/50">
                                <TabsTrigger value="general">Geral</TabsTrigger>
                                <TabsTrigger value="financial">Financeiro</TabsTrigger>
                                <TabsTrigger value="items">Itens</TabsTrigger>
                                <TabsTrigger value="crew">Equipe</TabsTrigger>
                                <TabsTrigger value="expenses">Despesas</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-6 mt-6">
                                <GeneralTab
                                    selectedProduction={production}
                                    isEditing={true}
                                    editForm={editForm}
                                    onEditFormChange={handleEditFormChange}
                                    onAddShootingSession={handleAddShootingSession}
                                    onRemoveShootingSession={handleRemoveShootingSession}
                                    onUpdateShootingSessionDate={handleUpdateShootingSessionDate}
                                    onUpdateShootingSessionLocation={handleUpdateShootingSessionLocation}
                                />
                            </TabsContent>

                            <TabsContent value="financial" className="space-y-6 mt-6">
                                <FinancialTab
                                    selectedProduction={production}
                                    isEditing={isEditing}
                                />
                            </TabsContent>

                            <TabsContent value="items" className="space-y-6 mt-6">
                                <ItemsTab
                                    items={localItems}
                                    services={services}
                                    selectedService={selectedService}
                                    newItemQuantity={newItemQuantity}
                                    onSelectedServiceChange={setSelectedService}
                                    onNewItemQuantityChange={setNewItemQuantity}
                                    onFetchServices={fetchServices}
                                    onAddItem={handleLocalAddItem}
                                    onRemoveItem={handleLocalRemoveItem}
                                />
                            </TabsContent>

                            <TabsContent value="crew" className="space-y-6 mt-6">
                                <CrewTab
                                    crew={localCrew}
                                    users={users}
                                    newCrewRole={newCrewRole}
                                    newCrewFee={newCrewFee}
                                    onNewCrewRoleChange={setNewCrewRole}
                                    onNewCrewFeeChange={setNewCrewFee}
                                    onFetchUsers={fetchUsers}
                                    onAddCrewMember={handleLocalAddCrewMember}
                                    onRemoveCrewMember={handleLocalRemoveCrewMember}
                                />
                            </TabsContent>

                            <TabsContent value="expenses" className="space-y-6 mt-6">
                                <ExpensesTab
                                    expenses={localExpenses}
                                    newExpenseName={newExpenseName}
                                    newExpenseValue={newExpenseValue}
                                    newExpenseCategory={newExpenseCategory}
                                    onNewExpenseNameChange={setNewExpenseName}
                                    onNewExpenseValueChange={setNewExpenseValue}
                                    onNewExpenseCategoryChange={setNewExpenseCategory}
                                    onAddExpense={handleLocalAddExpense}
                                    onRemoveExpense={handleLocalRemoveExpense}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
