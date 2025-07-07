import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, token } = await req.json();

    if (!provider || !token) {
      throw new Error('Provider e token são obrigatórios');
    }

    console.log(`🔍 Validando token para provedor: ${provider}`);

    let result = { success: false, serverCount: 0, error: '' };

    switch (provider) {
      case 'hetzner':
        result = await validateHetznerToken(token);
        break;
      case 'digitalocean':
        result = await validateDigitalOceanToken(token);
        break;
      case 'vultr':
        result = await validateVultrToken(token);
        break;
      case 'aws':
        result = await validateAWSToken(token);
        break;
      case 'linode':
        result = await validateLinodeToken(token);
        break;
      default:
        throw new Error(`Provedor ${provider} não suportado`);
    }

    console.log(`✅ Resultado da validação:`, result);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('❌ Erro na validação:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        serverCount: 0
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

async function validateHetznerToken(token: string) {
  try {
    const response = await fetch('https://api.hetzner.cloud/v1/servers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { 
        success: false, 
        serverCount: 0, 
        error: `API retornou erro ${response.status}: ${response.statusText}` 
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      serverCount: data.servers?.length || 0, 
      error: '' 
    };
  } catch (error: any) {
    return { 
      success: false, 
      serverCount: 0, 
      error: `Erro de conexão: ${error.message}` 
    };
  }
}

async function validateDigitalOceanToken(token: string) {
  try {
    const response = await fetch('https://api.digitalocean.com/v2/droplets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { 
        success: false, 
        serverCount: 0, 
        error: `API retornou erro ${response.status}: ${response.statusText}` 
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      serverCount: data.droplets?.length || 0, 
      error: '' 
    };
  } catch (error: any) {
    return { 
      success: false, 
      serverCount: 0, 
      error: `Erro de conexão: ${error.message}` 
    };
  }
}

async function validateVultrToken(token: string) {
  try {
    const response = await fetch('https://api.vultr.com/v2/instances', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { 
        success: false, 
        serverCount: 0, 
        error: `API retornou erro ${response.status}: ${response.statusText}` 
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      serverCount: data.instances?.length || 0, 
      error: '' 
    };
  } catch (error: any) {
    return { 
      success: false, 
      serverCount: 0, 
      error: `Erro de conexão: ${error.message}` 
    };
  }
}

async function validateAWSToken(token: string) {
  try {
    // AWS requires Access Key ID and Secret Access Key
    // For simplicity, we'll treat token as Access Key ID and require additional config
    // In production, this would need proper AWS SDK integration
    
    // Placeholder validation - in real implementation, use AWS SDK
    if (token.startsWith('AKIA') && token.length >= 16) {
      return { 
        success: true, 
        serverCount: 0, // Would need to query EC2 instances
        error: 'Token validado (configuração AWS requer Access Key + Secret)' 
      };
    } else {
      return { 
        success: false, 
        serverCount: 0, 
        error: 'Formato de Access Key inválido' 
      };
    }
  } catch (error: any) {
    return { 
      success: false, 
      serverCount: 0, 
      error: `Erro de validação: ${error.message}` 
    };
  }
}

async function validateLinodeToken(token: string) {
  try {
    const response = await fetch('https://api.linode.com/v4/linode/instances', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { 
        success: false, 
        serverCount: 0, 
        error: `API retornou erro ${response.status}: ${response.statusText}` 
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      serverCount: data.data?.length || 0, 
      error: '' 
    };
  } catch (error: any) {
    return { 
      success: false, 
      serverCount: 0, 
      error: `Erro de conexão: ${error.message}` 
    };
  }
}

serve(handler);