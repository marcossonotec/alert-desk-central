
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AddUserModal from './AddUserModal';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          assinaturas!inner(
            plano,
            status,
            preco_mensal
          )
        `)
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (plano: string) => {
    const colors = {
      free: 'bg-gray-500',
      profissional: 'bg-blue-500',
      empresarial: 'bg-purple-500',
      admin: 'bg-red-500'
    };
    return colors[plano as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-muted-foreground text-sm">Total de Usuários</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.assinaturas?.some((s: any) => s.status === 'ativa')).length}
              </p>
              <p className="text-muted-foreground text-sm">Usuários Ativos</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.plano_ativo !== 'free').length}
              </p>
              <p className="text-muted-foreground text-sm">Planos Pagos</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                R$ {users.reduce((total, u) => {
                  const subscription = u.assinaturas?.find((s: any) => s.status === 'ativa');
                  return total + (subscription?.preco_mensal || 0);
                }, 0).toFixed(2)}
              </p>
              <p className="text-muted-foreground text-sm">Receita Mensal</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por email, nome ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuários */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando usuários...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3">Nome</th>
                    <th className="text-left py-3">Email</th>
                    <th className="text-left py-3">Empresa</th>
                    <th className="text-left py-3">Plano</th>
                    <th className="text-left py-3">Status</th>
                    <th className="text-left py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border">
                      <td className="py-3">{user.nome_completo || 'N/A'}</td>
                      <td className="py-3">{user.email}</td>
                      <td className="py-3">{user.empresa || 'N/A'}</td>
                      <td className="py-3">
                        <Badge className={`${getStatusBadge(user.plano_ativo)} text-white`}>
                          {user.plano_ativo}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge 
                          variant={
                            user.assinaturas?.some((s: any) => s.status === 'ativa') 
                              ? 'default' : 'secondary'
                          }
                        >
                          {user.assinaturas?.some((s: any) => s.status === 'ativa') ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserAdded={loadUsers}
      />
    </div>
  );
};

export default UserManagement;
