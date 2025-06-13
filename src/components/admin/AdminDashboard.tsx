
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TestTube, Code } from 'lucide-react';
import UserManagement from './UserManagement';
import SubscriptionManagement from './SubscriptionManagement';
import PaymentSettings from './PaymentSettings';
import NotificationSettings from './NotificationSettings';
import AlertsManagement from './AlertsManagement';
import ServerManagement from './ServerManagement';
import SimpleMonitoringGuide from './SimpleMonitoringGuide';
import AlertTestModal from './AlertTestModal';

const AdminDashboard = () => {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsTestModalOpen(true)}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            Testar Alertas
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="servers">Servidores</TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            Scripts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionManagement />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsManagement />
        </TabsContent>

        <TabsContent value="servers">
          <ServerManagement />
        </TabsContent>

        <TabsContent value="monitoring">
          <SimpleMonitoringGuide />
        </TabsContent>
      </Tabs>

      <AlertTestModal 
        isOpen={isTestModalOpen} 
        onClose={() => setIsTestModalOpen(false)} 
      />
    </div>
  );
};

export default AdminDashboard;
