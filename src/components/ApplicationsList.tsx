
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ApplicationCard from './ApplicationCard';
import AddApplicationModal from './AddApplicationModal';

interface ApplicationsListProps {
  servers: any[];
  onUpdate: () => void;
}

const ApplicationsList: React.FC<ApplicationsListProps> = ({
  servers,
  onUpdate,
}) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationMetrics, setApplicationMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar aplicações do usuário
      const { data: applicationsData, error: appsError } = await supabase
        .from('aplicacoes')
        .select(`
          *,
          tipos_aplicacao (
            id,
            nome,
            descricao,
            preco_mensal,
            recursos
          ),
          servidores (
            id,
            nome,
            ip
          )
        `)
        .eq('usuario_id', user.id)
        .order('data_criacao', { ascending: false });

      if (appsError) throw appsError;

      // Buscar métricas das aplicações
      if (applicationsData && applicationsData.length > 0) {
        const appIds = applicationsData.map(app => app.id);
        
        const { data: metricsData, error: metricsError } = await supabase
          .from('aplicacao_metricas')
          .select('*')
          .in('aplicacao_id', appIds)
          .order('timestamp', { ascending: false });

        if (metricsError) throw metricsError;
        setApplicationMetrics(metricsData || []);
      }

      setApplications(applicationsData || []);
    } catch (error: any) {
      console.error('Erro ao carregar aplicações:', error);
      toast({
        title: "Erro ao carregar aplicações",
        description: "Não foi possível carregar as aplicações.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplicationAdded = () => {
    loadApplications();
    onUpdate();
  };

  const handleConfigure = (application: any) => {
    // TODO: Implementar modal de configuração
    toast({
      title: "Em desenvolvimento",
      description: "A configuração avançada será implementada em breve.",
    });
  };

  const filteredApplications = applications.filter(app =>
    app.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.tipos_aplicacao?.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.servidores?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Aplicações Monitoradas</CardTitle>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Aplicação
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Barra de Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar aplicações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>

          {/* Lista de Aplicações */}
          {filteredApplications.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {applications.length === 0 ? 'Nenhuma aplicação configurada' : 'Nenhuma aplicação encontrada'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {applications.length === 0 
                  ? 'Adicione aplicações para começar a monitorar seus serviços.'
                  : 'Tente ajustar os termos de pesquisa.'
                }
              </p>
              {applications.length === 0 && (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeira Aplicação
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  applicationMetrics={applicationMetrics}
                  onUpdate={loadApplications}
                  onConfigure={handleConfigure}
                />
              ))}
            </div>
          )}

          {/* Estatísticas Rápidas */}
          {applications.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{applications.length}</div>
                <div className="text-sm text-muted-foreground">Total de Aplicações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {applications.filter(app => app.status === 'ativo').length}
                </div>
                <div className="text-sm text-muted-foreground">Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {applications.reduce((sum, app) => sum + (app.tipos_aplicacao?.preco_mensal || 0), 0).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Custo/Mês (R$)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {new Set(applications.map(app => app.tipos_aplicacao?.nome)).size}
                </div>
                <div className="text-sm text-muted-foreground">Tipos Diferentes</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddApplicationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onApplicationAdded={handleApplicationAdded}
        servers={servers}
      />
    </>
  );
};

export default ApplicationsList;
