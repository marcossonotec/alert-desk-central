
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Crown, 
  Server, 
  MessageSquare, 
  ArrowUp,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';
import UpgradeModal from '@/components/UpgradeModal';

interface DashboardSidebarProps {
  userProfile: any;
  servers: any[];
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  userProfile,
  servers,
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const getPlanInfo = (plan: string) => {
    switch (plan) {
      case 'free':
        return { 
          name: 'Gratuito', 
          color: 'bg-gray-100 text-gray-800',
          maxServers: 1,
          whatsappInstances: 0
        };
      case 'profissional':
        return { 
          name: 'Profissional', 
          color: 'bg-blue-100 text-blue-800',
          maxServers: 2,
          whatsappInstances: 1
        };
      case 'empresarial':
        return { 
          name: 'Empresarial', 
          color: 'bg-purple-100 text-purple-800',
          maxServers: '∞',
          whatsappInstances: 1
        };
      default:
        return { 
          name: 'Gratuito', 
          color: 'bg-gray-100 text-gray-800',
          maxServers: 1,
          whatsappInstances: 0
        };
    }
  };

  const planInfo = getPlanInfo(userProfile?.plano_ativo || 'free');

  return (
    <>
      <div className="w-80 bg-card border-l border-border h-screen overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User className="h-5 w-5" />
                <span>Perfil do Usuário</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-foreground">
                  {userProfile?.nome_completo || 'Usuário'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.email}
                </p>
              </div>
              
              {userProfile?.empresa && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Empresa:</span>
                  <span className="text-sm font-medium">{userProfile.empresa}</span>
                </div>
              )}
              
              {userProfile?.telefone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{userProfile.telefone}</span>
                </div>
              )}
              
              {userProfile?.whatsapp && (
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{userProfile.whatsapp}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Membro desde {new Date(userProfile?.data_criacao).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Plan Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Crown className="h-5 w-5" />
                <span>Plano Atual</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={planInfo.color}>
                  {planInfo.name}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Servidores</span>
                  </div>
                  <span className="text-sm font-medium">
                    {servers.length}/{planInfo.maxServers}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">WhatsApp</span>
                  </div>
                  <span className="text-sm font-medium">
                    0/{planInfo.whatsappInstances}
                  </span>
                </div>
              </div>
              
              {userProfile?.plano_ativo === 'free' && (
                <Button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Fazer Upgrade
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas de Uso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Servidores Ativos</span>
                <span className="font-medium">{servers.filter(s => s.status === 'ativo').length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Servidores</span>
                <span className="font-medium">{servers.length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Último Login</span>
                <span className="font-medium text-sm">Agora</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Configurar Email
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Configurar WhatsApp
              </Button>
              
              {userProfile?.plano_ativo !== 'empresarial' && (
                <Button 
                  onClick={() => setShowUpgradeModal(true)}
                  variant="outline" 
                  className="w-full justify-start border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Ver Planos
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={userProfile?.plano_ativo || 'free'}
      />
    </>
  );
};

export default DashboardSidebar;
