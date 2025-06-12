
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building, Phone, MessageSquare, CreditCard, LogOut, Bell, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';
import UpgradeModal from '@/components/UpgradeModal';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '',
    empresa: '',
    telefone: '',
    whatsapp: '',
    email: '',
    email_notificacoes: '',
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        nome_completo: data.nome_completo || '',
        empresa: data.empresa || '',
        telefone: data.telefone || '',
        whatsapp: data.whatsapp || '',
        email: data.email || '',
        email_notificacoes: data.email_notificacoes || '',
      });
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
      toast({
        title: "Erro ao carregar perfil",
        description: "Não foi possível carregar seus dados.",
        variant: "destructive"
      });
    }
  };

  const formatWhatsAppNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Se não começar com 55, adiciona
    if (numbers.length > 0 && !numbers.startsWith('55')) {
      return '+55' + numbers;
    }
    
    // Se começar com 55, adiciona o +
    if (numbers.startsWith('55')) {
      return '+' + numbers;
    }
    
    return value;
  };

  const validateWhatsAppNumber = (number: string) => {
    // Remove caracteres não numéricos
    const numbers = number.replace(/\D/g, '');
    
    // Verifica se tem pelo menos 13 dígitos (+55 + DDD + 9 dígitos)
    if (numbers.length < 13) {
      return false;
    }
    
    // Verifica se começa com 55 (código do Brasil)
    if (!numbers.startsWith('55')) {
      return false;
    }
    
    return true;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatWhatsAppNumber(value);
    setFormData({ ...formData, whatsapp: formatted });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validar WhatsApp se preenchido
    if (formData.whatsapp && !validateWhatsAppNumber(formData.whatsapp)) {
      toast({
        title: "Número WhatsApp inválido",
        description: "Use o formato: +55 11 99999-9999 (com código do país +55)",
        variant: "destructive"
      });
      return;
    }

    // Validar email de notificações se preenchido
    if (formData.email_notificacoes && !validateEmail(formData.email_notificacoes)) {
      toast({
        title: "Email de notificações inválido",
        description: "Digite um email válido para receber notificações.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome_completo: formData.nome_completo,
          empresa: formData.empresa,
          telefone: formData.telefone,
          whatsapp: formData.whatsapp,
          email_notificacoes: formData.email_notificacoes || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });

      loadProfile();
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getPlanName = (plan: string) => {
    const plans = {
      free: 'Gratuito',
      profissional: 'Profissional',
      empresarial: 'Empresarial',
      admin: 'Administrador'
    };
    return plans[plan as keyof typeof plans] || plan;
  };

  const getPlanColor = (plan: string) => {
    const colors = {
      free: 'bg-gray-500',
      profissional: 'bg-blue-500',
      empresarial: 'bg-purple-500',
      admin: 'bg-red-500'
    };
    return colors[plan as keyof typeof colors] || 'bg-gray-500';
  };

  const getNotificationEmail = () => {
    return formData.email_notificacoes || formData.email;
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-primary">
                FlowServ
              </h1>
              <span className="ml-4 text-muted-foreground">Configurações</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground"
              >
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <User className="h-5 w-5 mr-2" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nome_completo" className="text-foreground">
                      Nome Completo
                    </Label>
                    <Input
                      id="nome_completo"
                      value={formData.nome_completo}
                      onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      Email de Autenticação
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        value={formData.email}
                        disabled
                        className="bg-muted border-border text-muted-foreground pr-10"
                      />
                      <ShieldCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Este email é usado para fazer login e não pode ser alterado
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email_notificacoes" className="text-foreground">
                      Email para Notificações (Opcional)
                    </Label>
                    <div className="relative">
                      <Input
                        id="email_notificacoes"
                        value={formData.email_notificacoes}
                        onChange={(e) => setFormData({ ...formData, email_notificacoes: e.target.value })}
                        placeholder={formData.email}
                        className="bg-background border-border text-foreground pr-10"
                      />
                      <Bell className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-blue-600">
                      ✅ Este email receberá todos os alertas e notificações do sistema
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Se não preenchido, as notificações serão enviadas para o email de autenticação
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="empresa" className="text-foreground">
                      Empresa
                    </Label>
                    <Input
                      id="empresa"
                      value={formData.empresa}
                      onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-foreground">
                      Telefone
                    </Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-foreground">
                      WhatsApp para Alertas
                    </Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleWhatsAppChange}
                      placeholder="+55 11 99999-9999"
                      className="bg-background border-border text-foreground"
                    />
                    <div className="space-y-1">
                      <p className="text-xs text-blue-600">
                        ✅ Este número será usado para enviar alertas via WhatsApp
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Formato obrigatório: +55 (código do país) + DDD + número
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Disponível apenas em planos pagos com Evolution API configurada
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plan Info */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Plano Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <Badge className={`${getPlanColor(profile.plano_ativo)} text-white text-lg px-4 py-2`}>
                    {getPlanName(profile.plano_ativo)}
                  </Badge>
                  
                  {profile.plano_ativo !== 'empresarial' && profile.plano_ativo !== 'admin' && (
                    <Button 
                      onClick={() => setShowUpgradeModal(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Fazer Upgrade
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-border text-foreground"
                  onClick={() => navigate('/dashboard')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
                
                {profile.plano_ativo === 'admin' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-border text-foreground"
                    onClick={() => navigate('/admin')}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Painel Admin
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Notifications Configuration */}
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-800 dark:text-blue-200 text-sm">
                  <Bell className="h-4 w-4 mr-2 inline" />
                  Configuração de Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Autenticação:</p>
                      <p className="text-blue-700 dark:text-blue-300">{formData.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Notificações:</p>
                      <p className="text-blue-700 dark:text-blue-300">{getNotificationEmail()}</p>
                    </div>
                  </div>

                  {formData.whatsapp && (
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">WhatsApp:</p>
                        <p className="text-blue-700 dark:text-blue-300">{formData.whatsapp}</p>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-blue-600 dark:text-blue-400 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                    Os alertas serão enviados para estes contatos quando configurados nos servidores.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={profile.plano_ativo}
      />
    </div>
  );
};

export default Profile;
