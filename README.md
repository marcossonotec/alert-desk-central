
# 🚀 FlowServ - Plataforma de Monitoramento de Servidores

![FlowServ Logo](https://via.placeholder.com/800x200/1e293b/3b82f6?text=FlowServ+-+Monitore+seus+Servidores)

## 📋 Sobre o Projeto

**FlowServ** é uma plataforma SaaS completa para monitoramento de servidores em tempo real, desenvolvida com as mais modernas tecnologias web. O sistema oferece monitoramento de CPU, memória, disco e rede, com alertas inteligentes via email e WhatsApp, integração com principais provedores de cloud e sistema multi-tenant para agências.

### 🎯 Principais Funcionalidades

- ✅ **Monitoramento em Tempo Real**: CPU, memória, disco e rede
- ✅ **Alertas Inteligentes**: Notificações por email e WhatsApp
- ✅ **Multi-tenant**: Gestão de múltiplos clientes para agências
- ✅ **Integração Cloud**: Suporte para Hetzner, AWS, DigitalOcean, etc.
- ✅ **Dashboard Completo**: Interface intuitiva com métricas em tempo real
- ✅ **Sistema de Pagamentos**: Integração com Stripe e MercadoPago
- ✅ **Autenticação Segura**: Sistema completo de login/logout/registro
- ✅ **Painel Administrativo**: Gestão completa de usuários e sistema

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces de usuário
- **TypeScript** - Superset do JavaScript com tipagem estática
- **Vite** - Build tool e bundler moderno
- **Tailwind CSS** - Framework CSS utilitário
- **Shadcn/UI** - Componentes de interface elegantes
- **React Query** - Gerenciamento de estado e cache
- **React Router DOM** - Roteamento no frontend
- **Lucide React** - Ícones modernos

### Backend & Infraestrutura
- **Supabase** - Backend as a Service completo
- **PostgreSQL** - Banco de dados relacional
- **Edge Functions** - Serverless functions no Supabase
- **Row Level Security (RLS)** - Segurança em nível de linha

### Integrações & APIs
- **Hetzner Cloud API** - Monitoramento de servidores Hetzner
- **Stripe API** - Processamento de pagamentos internacionais
- **MercadoPago API** - Processamento de pagamentos nacionais
- **SendGrid API** - Envio de emails transacionais
- **WhatsApp Business API** - Envio de alertas por WhatsApp

## 🏗️ Arquitetura do Sistema

### Estrutura do Banco de Dados

```sql
-- Tabelas principais
├── profiles          # Perfis de usuários
├── servidores        # Servidores cadastrados
├── metricas          # Métricas coletadas
├── alertas           # Configurações de alertas
├── notificacoes      # Histórico de notificações
└── assinaturas       # Gestão de pagamentos
```

### Edge Functions

```
supabase/functions/
├── hetzner-monitor/     # Coleta métricas da Hetzner
├── send-alerts/         # Envio de alertas
├── payment-webhook/     # Webhooks de pagamento
└── create-subscription/ # Criação de assinaturas
```

### Estrutura Multi-tenant

O sistema implementa multi-tenancy através de:
- **Row Level Security (RLS)** no PostgreSQL
- **Isolamento por usuário** em todas as tabelas
- **Políticas de segurança** granulares
- **Separação de dados** por cliente/agência

## 🚀 Configuração e Instalação

### 1. Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Contas nas APIs de integração (opcional)

### 2. Clonagem e Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/flowserv.git
cd flowserv

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

### 3. Configuração do Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Execute as migrações SQL do diretório `supabase/migrations/`
3. Configure as URLs de autenticação:
   - Site URL: `http://localhost:5173` (desenvolvimento)
   - Redirect URLs: `http://localhost:5173/**`

### 4. Configuração dos Secrets

Configure os seguintes secrets no Supabase (Dashboard → Settings → API):

#### APIs de Monitoramento
```env
HETZNER_API_KEY=seu_token_da_hetzner_cloud
```

#### APIs de Pagamento
```env
STRIPE_SECRET_KEY=sk_test_ou_live_sua_chave_stripe
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_mp
```

#### APIs de Comunicação
```env
SENDGRID_API_KEY=SG.sua_chave_sendgrid
WHATSAPP_API_KEY=seu_token_whatsapp_business
```

### 5. Usuário Administrador Padrão

```
Email: admin@flowserv.com.br
Senha: 123456
```

**⚠️ Importante**: Altere a senha padrão após o primeiro login!

## 📊 Modelo de Negócios

### Planos de Assinatura

| Plano | Preço/mês | Servidores | Recursos |
|-------|-----------|------------|----------|
| **Gratuito** | R$ 0 | 3 | Métricas básicas, Email |
| **Profissional** | R$ 29 | 20 | Métricas avançadas, WhatsApp |
| **Empresarial** | R$ 99 | Ilimitado | API, Multi-tenant, Suporte 24/7 |

### Estratégia de Monetização

1. **Freemium Model**: Plano gratuito para atrair usuários
2. **Escalabilidade**: Upgrade baseado no número de servidores
3. **Recursos Premium**: Funcionalidades avançadas nos planos pagos
4. **Multi-tenant**: Modelo B2B para agências
5. **API Access**: Monetização através de integrações

### Público-Alvo

- **Desenvolvedores** e **DevOps** individuais
- **Startups** e **PMEs** com infraestrutura própria
- **Agências de TI** que gerenciam múltiplos clientes
- **Empresas** que precisam de monitoramento customizado

## 🔧 Funcionalidades Técnicas

### Sistema de Monitoramento

```typescript
// Coleta automática de métricas via Edge Functions
const coletarMetricas = async (servidor: Servidor) => {
  const metricas = await hetznerAPI.getServerMetrics(servidor.id);
  
  await supabase.from('metricas').insert({
    servidor_id: servidor.id,
    cpu_usage: metricas.cpu,
    memoria_usage: metricas.memory,
    disco_usage: metricas.disk,
    rede_in: metricas.network_in,
    rede_out: metricas.network_out,
    uptime: metricas.uptime
  });
};
```

### Sistema de Alertas

```typescript
// Verificação automática e envio de alertas
const verificarAlertas = async (metricas: Metricas) => {
  const alertas = await buscarAlertasAtivos(metricas.servidor_id);
  
  for (const alerta of alertas) {
    if (metricas[alerta.tipo] > alerta.limite_valor) {
      await enviarNotificacao(alerta, metricas);
    }
  }
};
```

### Segurança e Multi-tenancy

```sql
-- Política RLS para isolamento de dados
CREATE POLICY "usuarios_veem_apenas_seus_servidores" 
ON public.servidores FOR SELECT 
USING (auth.uid() = usuario_id);
```

## 🔗 Integrações

### Hetzner Cloud
- Monitoramento automático de instâncias
- Coleta de métricas de performance
- Gestão de webhooks

### Stripe
- Processamento de pagamentos internacionais
- Gestão de assinaturas recorrentes
- Webhooks para atualizações de status

### MercadoPago
- Processamento de pagamentos nacionais (BR)
- PIX, cartão e boleto
- Integração com sistema de cobrança

### SendGrid
- Envio de emails transacionais
- Templates personalizados
- Tracking de entrega

### WhatsApp Business
- Alertas em tempo real
- Mensagens automatizadas
- Integração com sistema de alertas

## 📈 Roadmap

### Versão 2.0 (Próximas funcionalidades)
- [ ] **Dashboard Analytics**: Métricas históricas e relatórios
- [ ] **Mobile App**: Aplicativo nativo para iOS/Android
- [ ] **API Pública**: Documentação e SDK para desenvolvedores
- [ ] **Slack Integration**: Alertas no Slack
- [ ] **AWS Integration**: Suporte completo para AWS
- [ ] **DigitalOcean Integration**: Suporte para DO Droplets

### Versão 3.0 (Futuro)
- [ ] **Machine Learning**: Predição de problemas
- [ ] **Auto-scaling**: Recomendações automáticas
- [ ] **Compliance**: SOC 2, ISO 27001
- [ ] **White Label**: Solução para revenda

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- **TypeScript**: Tipagem obrigatória
- **ESLint**: Linting automático
- **Prettier**: Formatação de código
- **Conventional Commits**: Padrão de commits

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Email**: suporte@flowserv.com.br
- **Discord**: [Comunidade FlowServ](https://discord.gg/flowserv)
- **Documentação**: [docs.flowserv.com.br](https://docs.flowserv.com.br)

---

<div align="center">

**FlowServ** - Monitore. Alerte. Escale.

Desenvolvido com ❤️ para a comunidade de desenvolvedores

[Website](https://flowserv.com.br) • [Demo](https://demo.flowserv.com.br) • [Docs](https://docs.flowserv.com.br)

</div>
