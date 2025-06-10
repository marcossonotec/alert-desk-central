
# DeskTools - Plataforma de Monitoramento de Servidores SaaS

## 📋 Visão Geral

DeskTools é uma plataforma SaaS completa para monitoramento de servidores em tempo real, com sistema de alertas inteligentes e gestão multi-tenant para agências. A solução oferece monitoramento abrangente de recursos de servidor, notificações personalizáveis e painéis administrativos avançados.

## 🚀 Funcionalidades Principais

### 🔧 Monitoramento de Servidores
- **Monitoramento em Tempo Real**: CPU, memória, disco e rede
- **Integração com Hetzner Cloud**: APIs nativas para coleta de métricas
- **Status Automático**: Online, warning e offline baseado em thresholds
- **Histórico de Métricas**: Armazenamento e visualização de dados históricos

### 🚨 Sistema de Alertas
- **Alertas Configuráveis**: CPU, memória, disco e status offline
- **Múltiplos Canais**: Email e WhatsApp
- **Thresholds Personalizáveis**: Limites específicos por servidor
- **Histórico de Notificações**: Rastreamento completo de alertas enviados

### 💳 Sistema de Pagamentos
- **Integração Dupla**: Stripe e MercadoPago
- **Planos Flexíveis**: Free, Basic, Pro e Enterprise
- **Webhooks**: Processamento automático de pagamentos
- **Gestão de Assinaturas**: Ativação, suspensão e cancelamento

### 🏢 Multi-Tenant para Agências
- **Gestão de Clientes**: Múltiplos clientes por agência
- **Isolamento de Dados**: Segurança e privacidade garantidas
- **Painéis Personalizados**: Dashboards específicos por cliente
- **Billing Centralizado**: Faturamento unificado para agências

## 🏗️ Arquitetura Técnica

### Frontend (React + TypeScript)
```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── admin/          # Componentes administrativos
│   └── ServerCard.tsx  # Cartão de servidor
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx   # Dashboard principal
│   ├── Profile.tsx     # Configurações do usuário
│   └── Admin.tsx       # Painel administrativo
├── integrations/       # Integrações externas
│   └── supabase/       # Cliente e tipos Supabase
└── App.tsx            # Componente raiz
```

### Backend (Supabase Edge Functions)
```
supabase/functions/
├── hetzner-monitor/    # Coleta de métricas Hetzner
├── send-alerts/        # Envio de notificações
├── payment-webhook/    # Processamento de pagamentos
└── create-subscription/ # Criação de assinaturas
```

### Banco de Dados (PostgreSQL)
```sql
-- Principais tabelas
profiles          # Perfis de usuários
servidores        # Servidores monitorados
metricas          # Dados de monitoramento
alertas           # Configurações de alertas
notificacoes      # Histórico de notificações
assinaturas       # Gestão de pagamentos
```

## 🔒 Segurança e Permissões

### Row Level Security (RLS)
- **Isolamento de Dados**: Cada usuário acessa apenas seus próprios dados
- **Políticas Granulares**: Controle específico por tabela e operação
- **Segurança Multi-Tenant**: Isolamento garantido entre clientes

### Autenticação
- **Supabase Auth**: Sistema robusto de autenticação
- **JWT Tokens**: Tokens seguros para APIs
- **Refresh Tokens**: Renovação automática de sessões

## 📊 Modelo de Negócio

### Planos de Assinatura

#### 🆓 Free Plan
- **Preço**: Gratuito
- **Servidores**: Até 2 servidores
- **Métricas**: Básicas (CPU, Memória)
- **Alertas**: Email apenas
- **Suporte**: Comunidade

#### 💎 Basic Plan - R$ 29/mês
- **Servidores**: Até 10 servidores
- **Métricas**: Completas + Rede
- **Alertas**: Email + WhatsApp
- **Histórico**: 30 dias
- **Suporte**: Email

#### 🚀 Pro Plan - R$ 99/mês
- **Servidores**: Até 50 servidores
- **Métricas**: Avançadas + Customizadas
- **Alertas**: Todos os canais + Webhooks
- **Histórico**: 90 dias
- **API Access**: Completo
- **Suporte**: Prioritário

#### 🏢 Enterprise Plan - R$ 299/mês
- **Servidores**: Ilimitados
- **Multi-Tenant**: Gestão de agências
- **Métricas**: Personalizadas
- **SLA**: 99.9% uptime
- **Suporte**: 24/7 dedicado
- **Customização**: White-label

### Estratégia de Monetização
1. **Freemium Model**: Captação através do plano gratuito
2. **Usage-Based Scaling**: Upgrade baseado no número de servidores
3. **Enterprise Sales**: Vendas diretas para grandes clientes
4. **Partner Program**: Programa de parceiros para agências

## 🛠️ Configuração e Instalação

### Pré-requisitos
```bash
Node.js 18+
Supabase CLI
Bun ou npm
```

### Instalação
```bash
# Clone o repositório
git clone <repository-url>
cd desktools

# Instale dependências
bun install

# Configure variáveis de ambiente
cp .env.example .env.local

# Execute migrações do banco
supabase db reset

# Inicie o desenvolvimento
bun dev
```

### Configuração de Secrets (Supabase)
```bash
# APIs de terceiros
HETZNER_API_KEY=your_hetzner_key
STRIPE_SECRET_KEY=your_stripe_key
MERCADOPAGO_ACCESS_TOKEN=your_mercadopago_token
WHATSAPP_API_KEY=your_whatsapp_key
SENDGRID_API_KEY=your_sendgrid_key
```

## 🔧 APIs e Integrações

### Hetzner Cloud API
- **Endpoint**: `/functions/v1/hetzner-monitor`
- **Método**: POST
- **Frequência**: A cada 5 minutos
- **Dados Coletados**: CPU, RAM, Rede, Status

### Sistema de Alertas
- **Endpoint**: `/functions/v1/send-alerts`
- **Triggers**: Thresholds excedidos
- **Canais**: Email (SendGrid), WhatsApp (API)

### Webhooks de Pagamento
```javascript
// Stripe
POST /functions/v1/payment-webhook
Headers: stripe-signature

// MercadoPago
POST /functions/v1/payment-webhook
Headers: x-signature
```

## 📈 Métricas e Analytics

### KPIs do Negócio
- **MRR (Monthly Recurring Revenue)**: Receita mensal recorrente
- **Churn Rate**: Taxa de cancelamento
- **Customer Acquisition Cost (CAC)**: Custo de aquisição
- **Lifetime Value (LTV)**: Valor vitalício do cliente

### Métricas Técnicas
- **Uptime**: Disponibilidade da plataforma
- **Response Time**: Tempo de resposta das APIs
- **Error Rate**: Taxa de erros
- **Alert Accuracy**: Precisão dos alertas

## 🔄 CI/CD e Deploy

### Ambiente de Desenvolvimento
```bash
# Desenvolvimento local
bun dev

# Testes
bun test

# Build
bun build
```

### Deploy para Produção
```bash
# Deploy automático via Supabase
supabase functions deploy

# Deploy frontend via Lovable
# Automático ao fazer push para main
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Erro de Autenticação
```bash
# Verificar configuração do Supabase
supabase status

# Resetar auth
supabase auth users list
```

#### 2. Falha nas Métricas
```bash
# Verificar Edge Functions
supabase functions logs hetzner-monitor

# Testar API Hetzner
curl -H "Authorization: Bearer TOKEN" https://api.hetzner.cloud/v1/servers
```

#### 3. Alertas Não Enviados
```bash
# Verificar logs de alertas
supabase functions logs send-alerts

# Testar SendGrid
curl -X POST https://api.sendgrid.v3/mail/send
```

## 📝 Roadmap

### Q1 2024
- [x] MVP com monitoramento básico
- [x] Sistema de alertas email
- [x] Integração Stripe

### Q2 2024
- [ ] Alertas WhatsApp
- [ ] Dashboard avançado
- [ ] API pública
- [ ] Mobile app (React Native)

### Q3 2024
- [ ] AI-powered anomaly detection
- [ ] Integração AWS/GCP
- [ ] White-label solution
- [ ] Advanced analytics

### Q4 2024
- [ ] Enterprise features
- [ ] Global expansion
- [ ] Marketplace integrations
- [ ] Advanced automation

## 🤝 Contribuição

### Guidelines
1. Fork o repositório
2. Crie uma branch feature: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### Padrões de Código
- **TypeScript**: Tipagem estrita
- **ESLint**: Linting automático
- **Prettier**: Formatação consistente
- **Commits**: Conventional Commits

## 📞 Suporte

### Canais de Suporte
- **Email**: suporte@desktools.com
- **Discord**: [Community Server]
- **Docs**: [docs.desktools.com]
- **Status**: [status.desktools.com]

### SLA por Plano
- **Free**: Melhor esforço
- **Basic**: 48h response time
- **Pro**: 24h response time
- **Enterprise**: 4h response time + Phone support

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Equipe

**Desenvolvimento**: Equipe DeskTools  
**Arquitetura**: Baseada em Supabase + React  
**Monitoramento**: Hetzner Cloud APIs  
**Pagamentos**: Stripe + MercadoPago  

---

*DeskTools - Monitoramento inteligente para servidores modernos* 🚀
