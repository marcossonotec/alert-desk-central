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
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import UpgradeModal from '@/components/UpgradeModal';
import { useNavigate } from 'react-router-dom';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';

interface OptimizedSidebarProps {
  userProfile: any;
  servers: any[];
  onOpenWhatsApp: () => void;
}

const OptimizedSidebar: React.FC<OptimizedSidebarProps> = ({
  userProfile,
  servers,
  onOpenWhatsApp,
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const navigate = useNavigate();
  const { metrics, alerts } = useRealtimeMetrics();

  const getPlanInfo = (plan: string) => {
    switch (plan) {
      case 'free':
        return { 
          name: 'Gratuito', 
          color: 'bg-muted text-muted-foreground',
          maxServers: 1
        };
      case 'profissional':
        return { 
          name: 'Profissional', 
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
          maxServers: 2
        };
      case 'empresarial':
        return { 
          name: 'Empresarial', 
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
          maxServers: '∞'
        };
      default:
        return { 
          name: 'Gratuito', 
          color: 'bg-muted text-muted-foreground',
          maxServers: 1
        };
    }
  };

  const planInfo = getPlanInfo(userProfile?.plano_ativo || 'free');
  const activeServers = servers.filter(s => s.status === 'ativo');
  
  // Calculate real-time stats
  const recentMetrics = metrics.filter(m => 
    new Date().getTime() - new Date(m.timestamp).getTime() < 5 * 60 * 1000 // Last 5 minutes
  );
  const serversWithRecentMetrics = new Set(recentMetrics.map(m => m.servidor_id));
  const onlineServers = serversWithRecentMetrics.size;
  const alertCount = alerts.filter(a => a.ativo).length;

  return (
    <>
      <div className="w-80 bg-card border-l border-border h-screen overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* User Profile - Simplified */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User className="h-5 w-5" />
                <span>Perfil</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-foreground">
                  {userProfile?.nome_completo || 'Usuário'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.email}
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge className={planInfo.color}>
                  {planInfo.name}
                </Badge>
                {userProfile?.plano_ativo !== 'empresarial' && (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => setShowUpgradeModal(true)}
                    className="h-7 px-2 text-xs"
                  >
                    <ArrowUp className="h-3 w-3 mr-1" />
                    Upgrade
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Real-time Metrics Dashboard */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Activity className="h-5 w-5" />
                <span>Status em Tempo Real</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Servidores</span>
                  </div>
                  <div className="text-lg font-bold">
                    {activeServers.length}/{planInfo.maxServers}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Online</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {onlineServers}
                  </div>
                </div>
              </div>

              {alertCount > 0 && (
                <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-orange-700 dark:text-orange-300">
                      Alertas Ativos
                    </span>
                  </div>
                  <Badge variant="destructive" className="h-5">
                    {alertCount}
                  </Badge>
                </div>
              )}

              {/* Current System Status */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Status do Sistema:</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Operacional</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Consolidated */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/profile')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={onOpenWhatsApp}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              
              {userProfile?.plano_ativo !== 'empresarial' && (
                <Button 
                  onClick={() => setShowUpgradeModal(true)}
                  variant="outline" 
                  className="w-full justify-start text-primary border-primary/20 hover:bg-primary/5"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Planos Premium
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

export default OptimizedSidebar;