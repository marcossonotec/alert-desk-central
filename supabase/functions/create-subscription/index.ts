
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

    const { plano, provedor_pagamento, user_id } = await req.json();

    // Definir preços dos planos
    const planos = {
      basic: { preco: 29.90, nome: 'Básico' },
      pro: { preco: 59.90, nome: 'Profissional' },
      enterprise: { preco: 149.90, nome: 'Empresarial' }
    };

    if (!planos[plano]) {
      return new Response(
        JSON.stringify({ error: 'Plano inválido' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Buscar dados do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      throw new Error('Usuário não encontrado');
    }

    let subscriptionResult;

    if (provedor_pagamento === 'stripe') {
      subscriptionResult = await createStripeSubscription(profile, plano, planos[plano]);
    } else if (provedor_pagamento === 'mercadopago') {
      subscriptionResult = await createMercadoPagoSubscription(profile, plano, planos[plano]);
    } else {
      throw new Error('Provedor de pagamento não suportado');
    }

    // Salvar assinatura no banco
    const { data: assinatura, error: assinaturaError } = await supabase
      .from('assinaturas')
      .insert({
        usuario_id: user_id,
        plano,
        preco_mensal: planos[plano].preco,
        provedor_pagamento,
        subscription_id: subscriptionResult.subscription_id,
        status: 'pendente'
      })
      .select()
      .single();

    if (assinaturaError) {
      throw assinaturaError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        assinatura,
        payment_url: subscriptionResult.payment_url,
        subscription_id: subscriptionResult.subscription_id
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Erro ao criar assinatura:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

async function createStripeSubscription(profile: any, plano: string, planoConfig: any) {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY não configurada');
  }

  // Criar ou buscar customer no Stripe
  let customerId = await findOrCreateStripeCustomer(profile);

  // Criar subscription
  const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: customerId,
      'items[0][price_data][currency]': 'brl',
      'items[0][price_data][product_data][name]': `DeskTools - Plano ${planoConfig.nome}`,
      'items[0][price_data][recurring][interval]': 'month',
      'items[0][price_data][unit_amount]': (planoConfig.preco * 100).toString(),
      'payment_behavior': 'default_incomplete',
      'expand[]': 'latest_invoice.payment_intent'
    }),
  });

  if (!subscriptionResponse.ok) {
    const errorData = await subscriptionResponse.text();
    throw new Error(`Erro ao criar subscription no Stripe: ${errorData}`);
  }

  const subscription = await subscriptionResponse.json();

  return {
    subscription_id: subscription.id,
    payment_url: subscription.latest_invoice.payment_intent.client_secret
  };
}

async function findOrCreateStripeCustomer(profile: any) {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

  // Buscar customer existente
  const searchResponse = await fetch(`https://api.stripe.com/v1/customers/search?query=email:"${profile.email}"`, {
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
    },
  });

  const searchResult = await searchResponse.json();

  if (searchResult.data && searchResult.data.length > 0) {
    return searchResult.data[0].id;
  }

  // Criar novo customer
  const createResponse = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      email: profile.email,
      name: profile.nome_completo || '',
      metadata: JSON.stringify({
        user_id: profile.id
      })
    }),
  });

  const customer = await createResponse.json();
  return customer.id;
}

async function createMercadoPagoSubscription(profile: any, plano: string, planoConfig: any) {
  const mercadoPagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
  
  if (!mercadoPagoAccessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
  }

  // Criar preference no MercadoPago
  const preferenceResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${mercadoPagoAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          title: `DeskTools - Plano ${planoConfig.nome}`,
          quantity: 1,
          unit_price: planoConfig.preco,
          currency_id: 'BRL'
        }
      ],
      payer: {
        email: profile.email,
        name: profile.nome_completo || 'Usuário DeskTools'
      },
      back_urls: {
        success: `${Deno.env.get('SITE_URL')}/dashboard?payment=success`,
        failure: `${Deno.env.get('SITE_URL')}/dashboard?payment=failure`,
        pending: `${Deno.env.get('SITE_URL')}/dashboard?payment=pending`
      },
      auto_return: 'approved',
      external_reference: `${profile.id}-${plano}-${Date.now()}`,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook?provider=mercadopago`
    }),
  });

  if (!preferenceResponse.ok) {
    const errorData = await preferenceResponse.text();
    throw new Error(`Erro ao criar preference no MercadoPago: ${errorData}`);
  }

  const preference = await preferenceResponse.json();

  return {
    subscription_id: preference.id,
    payment_url: preference.init_point
  };
}

serve(handler);
