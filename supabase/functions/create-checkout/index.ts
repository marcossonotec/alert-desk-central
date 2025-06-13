
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Autenticar usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { planeName, preco, currency = 'BRL' } = await req.json();
    
    console.log('Criando checkout para:', { planeName, preco, currency, userId: user.id });

    // Buscar configurações de pagamento ativas (qualquer usuário com configuração ativa)
    const { data: paymentConfig, error: configError } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (configError || !paymentConfig) {
      console.error('Erro ao buscar configuração de pagamento:', configError);
      throw new Error('Gateway de pagamento não configurado. Entre em contato com o suporte.');
    }

    console.log('Configuração de pagamento encontrada:', {
      gateway: paymentConfig.gateway_type,
      mode: paymentConfig.mode
    });

    let checkoutUrl: string;

    if (paymentConfig.gateway_type === 'mercadopago') {
      checkoutUrl = await createMercadoPagoCheckout({
        planeName,
        preco,
        currency,
        userEmail: user.email!,
        userId: user.id,
        accessToken: paymentConfig.mercadopago_access_token,
        isTest: paymentConfig.mode === 'test'
      });
    } else if (paymentConfig.gateway_type === 'stripe') {
      checkoutUrl = await createStripeCheckout({
        planeName,
        preco,
        currency,
        userEmail: user.email!,
        userId: user.id,
        secretKey: paymentConfig.stripe_secret_key,
        isTest: paymentConfig.mode === 'test'
      });
    } else {
      throw new Error('Gateway de pagamento não suportado');
    }

    return new Response(
      JSON.stringify({ url: checkoutUrl }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Erro no create-checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

async function createMercadoPagoCheckout(params: {
  planeName: string;
  preco: number;
  currency: string;
  userEmail: string;
  userId: string;
  accessToken: string;
  isTest: boolean;
}) {
  const { planeName, preco, currency, userEmail, userId, accessToken, isTest } = params;
  
  const baseUrl = isTest 
    ? 'https://api.mercadopago.com/sandbox'
    : 'https://api.mercadopago.com';

  const preferenceData = {
    items: [
      {
        title: `Plano ${planeName}`,
        description: `Assinatura mensal do plano ${planeName}`,
        quantity: 1,
        currency_id: currency,
        unit_price: preco
      }
    ],
    payer: {
      email: userEmail
    },
    payment_methods: {
      default_payment_method_id: null,
      excluded_payment_types: [],
      excluded_payment_methods: [],
      installments: 12
    },
    back_urls: {
      success: `${Deno.env.get('SUPABASE_URL')}/success?plan=${planeName}`,
      failure: `${Deno.env.get('SUPABASE_URL')}/cancel`,
      pending: `${Deno.env.get('SUPABASE_URL')}/pending`
    },
    auto_return: 'approved',
    external_reference: `user_${userId}_plan_${planeName}_${Date.now()}`
  };

  console.log('Criando preferência MP:', preferenceData);

  const response = await fetch(`${baseUrl}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferenceData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Erro MP:', response.status, errorData);
    throw new Error(`Erro do Mercado Pago: ${response.status}`);
  }

  const preference = await response.json();
  console.log('Preferência criada:', preference.id);

  return preference.init_point;
}

async function createStripeCheckout(params: {
  planeName: string;
  preco: number;
  currency: string;
  userEmail: string;
  userId: string;
  secretKey: string;
  isTest: boolean;
}) {
  const { planeName, preco, currency, userEmail, userId, secretKey } = params;
  
  const stripeData = {
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Plano ${planeName}`,
            description: `Assinatura mensal do plano ${planeName}`,
          },
          unit_amount: Math.round(preco * 100), // Stripe usa centavos
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${Deno.env.get('SUPABASE_URL')}/success?plan=${planeName}`,
    cancel_url: `${Deno.env.get('SUPABASE_URL')}/cancel`,
    customer_email: userEmail,
    metadata: {
      user_id: userId,
      plan_name: planeName
    }
  };

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(stripeData as any).toString(),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Erro Stripe:', response.status, errorData);
    throw new Error(`Erro do Stripe: ${response.status}`);
  }

  const session = await response.json();
  return session.url;
}

serve(handler);
