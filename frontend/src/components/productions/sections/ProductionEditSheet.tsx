'use client';

import { Save, X } from 'lucide-react';
import { Button } from ../../components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from ../../components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from ../../components/ui/tabs';
import { GeneralTab } from './tabs/GeneralTab';
import { FinancialTab } from './tabs/FinancialTab';
import { ItemsTab } from './tabs/ItemsTab';
import { CrewTab } from './tabs/CrewTab';
import { ExpensesTab } from './tabs/ExpensesTab';

type ProductionStatus = 'draft' | 'proposal_sent' | 'approved' | 'in_progress' | 'completed' | 'canceled';

interface ProductionEditSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedProduction: any; // Temporário - será tipado depois
    isEditing: boolean;
    onSave: () => void;
    onCancel: () => void;
    editForm: {
        title: string;
        status: ProductionStatus;
        deadline: string;
        shooting_sessions: Array<{ date: string | null, location: string | null }>;
        payment_method: string;
        payment_status: string;
        due_date: string;
        discount: number;
        tax_rate: number;
        notes: string;
    };
    onEditFormChange: (updates: Partial<ProductionEditSheetProps['editForm']>) => void;
    onAddShootingSession: () => void;
    onRemoveShootingSession: (index: number) => void;
    onUpdateShootingSessionDate: (index: number, value: string) => void;
    onUpdateShootingSessionLocation: (index: number, value: string) => void;

    // Para ItemsTab
    services: any[];
    selectedService: any;
    newItemQuantity: number;
    onServicesChange: (services: any[]) => void;
    onSelectedServiceChange: (service: any) => void;
    onNewItemQuantityChange: (quantity: number) => void;
    onFetchServices: () => Promise<void>;

    // Para CrewTab
    users: any[];
    selectedUser: any;
    newCrewRole: string;
    newCrewFee: number;
    onUsersChange: (users: any[]) => void;
    onSelectedUserChange: (user: any) => void;
    onNewCrewRoleChange: (role: string) => void;
    onNewCrewFeeChange: (fee: number) => void;
    onFetchUsers: () => Promise<void>;

    // Para ExpensesTab
    newExpenseName: string;
    newExpenseValue: number;
    newExpenseCategory: string;
    onNewExpenseNameChange: (name: string) => void;
    onNewExpenseValueChange: (value: number) => void;
    onNewExpenseCategoryChange: (category: string) => void;

    // Para atualização do selectedProduction
    onUpdateSelectedProduction: (production: any) => void;
}

export function ProductionEditSheet({
  open,
  onOpenChange,
  selectedProduction,
  isEditing,
  onSave,
  onCancel,
  editForm,
  onEditFormChange,
  onAddShootingSession,
  onRemoveShootingSession,
  onUpdateShootingSessionDate,
  onUpdateShootingSessionLocation,
  // ItemsTab
  services,
  selectedService,
  newItemQuantity,
  onServicesChange,
  onSelectedServiceChange,
  onNewItemQuantityChange,
  onFetchServices,
  // CrewTab
  users,
  selectedUser,
  newCrewRole,
  newCrewFee,
  onUsersChange,
  onSelectedUserChange,
  onNewCrewRoleChange,
  onNewCrewFeeChange,
  onFetchUsers,
  // ExpensesTab
  newExpenseName,
  newExpenseValue,
  newExpenseCategory,
  onNewExpenseNameChange,
  onNewExpenseValueChange,
  onNewExpenseCategoryChange,
  // Update selectedProduction
  onUpdateSelectedProduction
}: ProductionEditSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 [&>button]:hidden">
                <SheetHeader className="border-b border-white/10 pb-4 relative">
                    <div className="flex items-center justify-between w-full pr-12">
                        <SheetTitle className="text-slate-50">
                            {selectedProduction?.title}
                        </SheetTitle>
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={onSave}
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={!isEditing}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Salvar
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onCancel}
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

                {selectedProduction && (
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
                                    selectedProduction={selectedProduction}
                                    isEditing={isEditing}
                                    editForm={editForm}
                                    onEditFormChange={onEditFormChange}
                                    onAddShootingSession={onAddShootingSession}
                                    onRemoveShootingSession={onRemoveShootingSession}
                                    onUpdateShootingSessionDate={onUpdateShootingSessionDate}
                                    onUpdateShootingSessionLocation={onUpdateShootingSessionLocation}
                                />
                            </TabsContent>

              <TabsContent value="financial" className="space-y-6 mt-6">
                <FinancialTab
                  selectedProduction={selectedProduction}
                  isEditing={isEditing}
                />
              </TabsContent>

              <TabsContent value="items" className="space-y-6 mt-6">
                <ItemsTab
                  selectedProduction={selectedProduction}
                  services={services}
                  selectedService={selectedService}
                  newItemQuantity={newItemQuantity}
                  onServicesChange={onServicesChange}
                  onSelectedServiceChange={onSelectedServiceChange}
                  onNewItemQuantityChange={onNewItemQuantityChange}
                  onFetchServices={onFetchServices}
                  onUpdateSelectedProduction={onUpdateSelectedProduction}
                />
              </TabsContent>

              <TabsContent value="crew" className="space-y-6 mt-6">
                <CrewTab
                  selectedProduction={selectedProduction}
                  users={users}
                  selectedUser={selectedUser}
                  newCrewRole={newCrewRole}
                  newCrewFee={newCrewFee}
                  onUsersChange={onUsersChange}
                  onSelectedUserChange={onSelectedUserChange}
                  onNewCrewRoleChange={onNewCrewRoleChange}
                  onNewCrewFeeChange={onNewCrewFeeChange}
                  onFetchUsers={onFetchUsers}
                  onUpdateSelectedProduction={onUpdateSelectedProduction}
                />
              </TabsContent>

              <TabsContent value="expenses" className="space-y-6 mt-6">
                <ExpensesTab
                  selectedProduction={selectedProduction}
                  newExpenseName={newExpenseName}
                  newExpenseValue={newExpenseValue}
                  newExpenseCategory={newExpenseCategory}
                  onNewExpenseNameChange={onNewExpenseNameChange}
                  onNewExpenseValueChange={onNewExpenseValueChange}
                  onNewExpenseCategoryChange={onNewExpenseCategoryChange}
                  onUpdateSelectedProduction={onUpdateSelectedProduction}
                />
              </TabsContent>
                        </Tabs>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
