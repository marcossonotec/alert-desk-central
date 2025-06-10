
# DeskTools - Plataforma de Monitoramento de Servidores

## 📋 Visão Geral

DeskTools é uma plataforma SaaS completa para monitoramento de servidores em tempo real, com foco especial na integração com provedores de nuvem como Hetzner Cloud. A plataforma oferece alertas automáticos, métricas detalhadas e sistema de pagamentos integrado.

## 🏗️ Arquitetura e Tecnologias

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **Shadcn/UI** para componentes
- **Vite** como bundler
- **React Query** para gerenciamento de estado

### Backend
- **Supabase** como Backend-as-a-Service
- **PostgreSQL** como banco de dados
- **Row Level Security (RLS)** para segurança
- **Edge Functions** para lógica serverless

### Integrações
- **Hetzner Cloud API** para coleta de métricas
- **Resend** para envio de emails
- **WhatsApp Business API** para alertas
- **Stripe** e **MercadoPago** para pagamentos

## 📊 Modelo de Negócios

### Planos de Assinatura

#### 🆓 Gratuito
- Até 1 servidor
- Alertas básicos por email
- Métricas básicas (CPU, Memória)
- Suporte via documentação

#### 💼 Básico - R$ 29,90/mês
- Até 5 servidores
- Alertas por email e WhatsApp
- Métricas completas
- Suporte por email
- Histórico de 30 dias

#### 🚀 Profissional - R$ 59,90/mês
- Até 25 servidores
- Alertas avançados personalizáveis
- APIs de integração
- Suporte prioritário
- Histórico de 90 dias
- Relatórios avançados

#### 🏢 Empresarial - R$ 149,90/mês
- Servidores ilimitados
- Alertas em múltiplos canais
- API completa
- Suporte 24/7
- Histórico de 1 ano
- Dashboard customizado
- Integração SSO

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### `profiles`
Perfis de usuários vinculados ao sistema de autenticação do Supabase.

```sql
- id (UUID) - Referência para auth.users
- email (TEXT) - Email do usuário
- nome_completo (TEXT) - Nome completo
- empresa (TEXT) - Nome da empresa
- telefone (TEXT) - Telefone para WhatsApp
- plano_ativo (TEXT) - Plano atual
- data_criacao (TIMESTAMPTZ)
- data_atualizacao (TIMESTAMPTZ)
```

#### `servidores`
Servidores cadastrados para monitoramento.

```sql
- id (UUID) - Identificador único
- usuario_id (UUID) - Referência para profiles
- nome (TEXT) - Nome do servidor
- ip (TEXT) - Endereço IP
- provedor (TEXT) - Provedor (hetzner, aws, etc.)
- webhook_url (TEXT) - URL para receber métricas
- api_key (TEXT) - Chave de API do provedor
- status (TEXT) - Status atual
- ultima_verificacao (TIMESTAMPTZ)
```

#### `metricas`
Métricas coletadas dos servidores.

```sql
- id (UUID) - Identificador único
- servidor_id (UUID) - Referência para servidores
- cpu_usage (DECIMAL) - Uso de CPU (%)
- memoria_usage (DECIMAL) - Uso de memória (%)
- disco_usage (DECIMAL) - Uso de disco (%)
- rede_in (BIGINT) - Tráfego de entrada (bytes)
- rede_out (BIGINT) - Tráfego de saída (bytes)
- uptime (TEXT) - Tempo de atividade
- timestamp (TIMESTAMPTZ) - Momento da coleta
```

#### `alertas`
Configuração de alertas dos usuários.

```sql
- id (UUID) - Identificador único
- usuario_id (UUID) - Referência para profiles
- servidor_id (UUID) - Referência para servidores
- tipo_alerta (TEXT) - Tipo: cpu, memoria, disco, offline
- limite_valor (DECIMAL) - Valor limite para disparo
- canal_notificacao (TEXT[]) - Canais: email, whatsapp
- ativo (BOOLEAN) - Se está ativo
```

#### `assinaturas`
Assinaturas e pagamentos dos usuários.

```sql
- id (UUID) - Identificador único
- usuario_id (UUID) - Referência para profiles
- plano (TEXT) - Plano contratado
- status (TEXT) - ativa, cancelada, suspensa
- preco_mensal (DECIMAL) - Valor mensal
- provedor_pagamento (TEXT) - stripe, mercadopago
- subscription_id (TEXT) - ID no provedor
- data_inicio (TIMESTAMPTZ)
- data_fim (TIMESTAMPTZ)
```

## 🔧 APIs e Edge Functions

### 1. Hetzner Monitor (`hetzner-monitor`)
Coleta métricas dos servidores Hetzner Cloud e processa alertas.

**Endpoints:**
- `GET /` - Coleta métricas de todos os servidores
- `POST /` - Recebe métricas via webhook

**Funcionalidades:**
- Integração com Hetzner Cloud API
- Coleta automática de métricas
- Processamento de alertas em tempo real
- Armazenamento de dados históricos

### 2. Sistema de Alertas (`send-alerts`)
Envia notificações por email e WhatsApp quando limites são ultrapassados.

**Canais suportados:**
- **Email** via Resend
- **WhatsApp** via API Business

**Tipos de alerta:**
- CPU acima do limite
- Memória acima do limite
- Disco acima do limite
- Servidor offline

### 3. Webhook de Pagamentos (`payment-webhook`)
Processa webhooks de provedores de pagamento.

**Provedores suportados:**
- **Stripe** - Processamento internacional
- **MercadoPago** - Processamento nacional

**Eventos processados:**
- Pagamento aprovado
- Pagamento rejeitado
- Assinatura cancelada

### 4. Criação de Assinaturas (`create-subscription`)
Cria novas assinaturas nos provedores de pagamento.

**Fluxo:**
1. Usuário seleciona plano
2. Cria customer no provedor
3. Gera link de pagamento
4. Retorna URL para checkout

## 🔐 Segurança

### Row Level Security (RLS)
Todas as tabelas implementam RLS para garantir que usuários só acessem seus próprios dados.

### Políticas Implementadas:
- Usuários só veem seus próprios servidores
- Métricas são filtradas por propriedade do servidor
- Alertas são privados por usuário
- Edge Functions têm permissões específicas

## 🚀 Implementação e Deploy

### Variáveis de Ambiente Necessárias

```env
# Supabase (já configurado)
SUPABASE_URL=https://obclzswvwjslxexskvcf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Hetzner Cloud
HETZNER_API_KEY=seu_token_hetzner

# Email (Resend)
RESEND_API_KEY=re_sua_chave_resend

# WhatsApp
WHATSAPP_API_KEY=sua_chave_whatsapp
WHATSAPP_API_URL=https://api.whatsapp.com

# Stripe
STRIPE_SECRET_KEY=sk_live_sua_chave_stripe
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR_seu_token_mp

# App
SITE_URL=https://seu-dominio.com
```

### Configuração do Cron Job
Para coleta automática de métricas a cada 5 minutos:

```sql
SELECT cron.schedule(
  'collect-metrics',
  '*/5 * * * *',
  $$
  SELECT net.http_get(
    url := 'https://obclzswvwjslxexskvcf.supabase.co/functions/v1/hetzner-monitor',
    headers := '{"Authorization": "Bearer sua_chave_service_role"}'::jsonb
  );
  $$
);
```

## 📈 Métricas e Monitoramento

### Dashboard Principal
- Total de servidores
- Status em tempo real (Online/Alerta/Offline)
- Filtros por status e busca
- Cards detalhados por servidor

### Métricas Coletadas
- **CPU Usage** - Percentual de uso do processador
- **Memory Usage** - Percentual de uso da memória RAM
- **Disk Usage** - Percentual de uso do disco
- **Network I/O** - Tráfego de entrada e saída
- **Uptime** - Tempo de atividade do servidor

### Alertas Configuráveis
- Limites personalizáveis por métrica
- Múltiplos canais de notificação
- Histórico de alertas enviados
- Configuração por servidor ou global

## 🎯 Roadmap de Desenvolvimento

### Versão 1.0 (Atual)
- ✅ Dashboard básico
- ✅ Integração Hetzner Cloud
- ✅ Sistema de alertas
- ✅ Pagamentos Stripe/MercadoPago

### Versão 1.1
- [ ] Integração AWS CloudWatch
- [ ] Integração Digital Ocean
- [ ] Relatórios em PDF
- [ ] API pública para clientes

### Versão 1.2
- [ ] Mobile app (React Native)
- [ ] Integração Slack/Discord
- [ ] Previsão de capacidade (IA)
- [ ] Multi-tenant para agências

## 🛠️ Comandos de Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Deploy das Edge Functions
supabase functions deploy

# Executar migrações
supabase db push
```

## 📞 Suporte

- **Email:** suporte@desktools.com
- **Discord:** [Comunidade DeskTools](https://discord.gg/desktools)
- **Documentação:** [docs.desktools.com](https://docs.desktools.com)

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**DeskTools** - Monitoramento de servidores simplificado e eficiente.
