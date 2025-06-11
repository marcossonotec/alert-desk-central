
# 📋 Guia de Instalação - FlowServ no Ubuntu 22.04

Este guia mostra como instalar e configurar a plataforma FlowServ em uma VPS Ubuntu 22.04 do zero.

## 🔧 Pré-requisitos

- VPS Ubuntu 22.04 com acesso root/sudo
- Domínio ou subdomínio apontado para o servidor
- Mínimo 2GB RAM e 20GB de armazenamento

## 📦 1. Atualizar o Sistema

```bash
# Atualizar lista de pacotes
sudo apt update

# Atualizar pacotes instalados
sudo apt upgrade -y

# Instalar utilitários básicos
sudo apt install -y curl wget git unzip software-properties-common
```

## 🟢 2. Instalar Node.js 18+

```bash
# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

## 🌐 3. Instalar e Configurar Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Iniciar e habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar status
sudo systemctl status nginx
```

### Configurar Virtual Host

```bash
# Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/flowserv
```

Cole a configuração abaixo (substitua `seu-dominio.com`):

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/flowserv /etc/nginx/sites-enabled/

# Remover configuração padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

## 🔒 4. Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Configurar renovação automática
sudo crontab -e
```

Adicione a linha:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📁 5. Configurar Aplicação

### Criar usuário para aplicação

```bash
# Criar usuário flowserv
sudo adduser flowserv

# Adicionar ao grupo sudo (opcional)
sudo usermod -aG sudo flowserv

# Trocar para o usuário
sudo su - flowserv
```

### Clonar e instalar aplicação

```bash
# Ir para diretório home
cd ~

# Clonar repositório
git clone https://github.com/seu-usuario/flowserv.git
cd flowserv

# Instalar dependências
npm install

# Construir aplicação para produção
npm run build
```

## ⚙️ 6. Configurar PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Criar arquivo de configuração
nano ecosystem.config.js
```

Cole o conteúdo:

```javascript
module.exports = {
  apps: [{
    name: 'flowserv',
    script: 'npm',
    args: 'run preview',
    cwd: '/home/flowserv/flowserv',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5173
    }
  }]
};
```

```bash
# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Salvar configuração PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup

# Executar o comando que aparecer (sudo env PATH=...)
```

## 🔐 7. Configurar Firewall

```bash
# Configurar UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verificar status
sudo ufw status
```

## 🗄️ 8. Configurar Supabase

### Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta/faça login
3. Clique em "New Project"
4. Configure:
   - Nome: FlowServ Production
   - Região: escolha a mais próxima
   - Password: gere uma senha forte

### Configurar banco de dados

1. Acesse SQL Editor no painel Supabase
2. Execute as migrações SQL do projeto:

```sql
-- Copie e execute o conteúdo dos arquivos em:
-- supabase/migrations/20250610184939-37a27f17-dd9b-41cd-a8a7-b8a0612d2bc3.sql
-- supabase/migrations/20250611025337-5d1327a4-03bf-48de-8769-b579b0d13d1d.sql
```

### Configurar autenticação

1. Vá em Authentication > Settings
2. Configure:
   - Site URL: `https://seu-dominio.com`
   - Redirect URLs: `https://seu-dominio.com/**`

### Adicionar secrets

1. Vá em Settings > Functions
2. Adicione os secrets necessários:

```
HETZNER_API_KEY=seu_token_hetzner
STRIPE_SECRET_KEY=sua_chave_stripe
MERCADOPAGO_ACCESS_TOKEN=seu_token_mercadopago
SENDGRID_API_KEY=sua_chave_sendgrid
WHATSAPP_API_KEY=seu_token_whatsapp
```

## 🔑 9. Criar Usuário Administrador

```bash
# Voltar para aplicação
cd /home/flowserv/flowserv

# Conectar ao banco via psql (opcional)
# Ou usar o painel do Supabase
```

1. Primeiro, registre-se no sistema com o email `admin@flowserv.com.br`
2. No SQL Editor do Supabase, execute:

```sql
-- Pegar o UUID do usuário admin
SELECT id FROM auth.users WHERE email = 'admin@flowserv.com.br';

-- Atualizar perfil para admin (substitua o UUID)
UPDATE public.profiles 
SET plano_ativo = 'admin', nome_completo = 'Administrador do Sistema'
WHERE id = 'UUID_DO_USUARIO_ADMIN';
```

## 🚀 10. Comandos Úteis

### Gerenciar aplicação

```bash
# Ver logs da aplicação
pm2 logs flowserv

# Reiniciar aplicação
pm2 restart flowserv

# Parar aplicação
pm2 stop flowserv

# Ver status
pm2 status

# Recarregar após mudanças de código
cd /home/flowserv/flowserv
git pull
npm run build
pm2 restart flowserv
```

### Gerenciar Nginx

```bash
# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo systemctl reload nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

### Backup do banco

```bash
# Fazer backup via Supabase CLI (opcional)
# Ou usar o painel do Supabase > Settings > Database
```

## 📊 11. Monitoramento

### Verificar recursos do sistema

```bash
# CPU e memória
htop

# Espaço em disco
df -h

# Logs do sistema
sudo journalctl -f

# Status dos serviços
sudo systemctl status nginx
pm2 status
```

### Configurar alertas (opcional)

```bash
# Instalar ferramentas de monitoramento
sudo apt install -y htop iotop nethogs

# Configurar logrotate para logs da aplicação
sudo nano /etc/logrotate.d/flowserv
```

## 🔧 12. Troubleshooting

### Problemas comuns

1. **Aplicação não inicia**:
   ```bash
   pm2 logs flowserv
   # Verificar logs para erros
   ```

2. **Nginx retorna 502**:
   ```bash
   # Verificar se aplicação está rodando
   pm2 status
   # Verificar logs do Nginx
   sudo tail -f /var/log/nginx/error.log
   ```

3. **SSL não funciona**:
   ```bash
   # Renovar certificado
   sudo certbot renew
   # Verificar configuração
   sudo nginx -t
   ```

4. **Banco de dados não conecta**:
   - Verificar URL e credenciais do Supabase
   - Verificar se as migrações foram executadas
   - Verificar logs da aplicação

### Logs importantes

```bash
# Logs da aplicação
pm2 logs flowserv

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs do sistema
sudo journalctl -u nginx -f
```

## ✅ 13. Verificação Final

1. Acesse `https://seu-dominio.com`
2. Teste o registro de usuário
3. Faça login com `admin@flowserv.com.br`
4. Verifique se o painel admin está acessível
5. Teste adicionar um servidor
6. Verifique se os temas (light/dark) funcionam

## 🎯 Conclusão

Sua instalação do FlowServ está completa! A aplicação está rodando em:

- **URL**: https://seu-dominio.com
- **Admin**: admin@flowserv.com.br / 123456
- **PM2**: Gerenciamento de processos
- **Nginx**: Proxy reverso e SSL
- **Supabase**: Backend e banco de dados

### Próximos passos:

1. Alterar senha do admin
2. Configurar APIs de integração (Hetzner, Stripe, etc.)
3. Configurar domínio de email para notificações
4. Implementar backup automático
5. Configurar monitoramento avançado

Para suporte, consulte a documentação ou abra uma issue no repositório do projeto.
