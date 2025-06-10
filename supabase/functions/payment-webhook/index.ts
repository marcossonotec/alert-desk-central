
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

    const url = new URL(req.url);
    const provedor = url.searchParams.get('provider') || 'stripe';
    
    if (provedor === 'stripe') {
      return await handleStripeWebhook(req, supabase);
    } else if (provedor === 'mercadopago') {
      return await handleMercadoPagoWebhook(req, supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Provedor não suportado' }),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Erro no webhook de pagamento:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

async function handleStripeWebhook(req: Request, supabase: any) {
  const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!stripeWebhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET não configurado');
  }

  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  // Em produção, você validaria a assinatura do Stripe aqui
  console.log('Webhook Stripe recebido:', { signature, bodyLength: body.length });

  try {
    const event = JSON.parse(body);
    
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleSuccessfulPayment(supabase, event.data.object, 'stripe');
        break;
      case 'invoice.payment_failed':
        await handleFailedPayment(supabase, event.data.object, 'stripe');
        break;
      case 'customer.subscription.deleted':
        await handleCanceledSubscription(supabase, event.data.object, 'stripe');
        break;
      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Erro ao processar webhook Stripe:', error);
    throw error;
  }
}

async function handleMercadoPagoWebhook(req: Request, supabase: any) {
  const body = await req.json();
  
  console.log('Webhook MercadoPago recebido:', body);

  try {
    switch (body.type) {
      case 'payment':
        if (body.action === 'payment.created' || body.action === 'payment.updated') {
          // Buscar detalhes do pagamento na API do MercadoPago
          const paymentDetails = await getMercadoPagoPaymentDetails(body.data.id);
          
          if (paymentDetails.status === 'approved') {
            await handleSuccessfulPayment(supabase, paymentDetails, 'mercadopago');
          } else if (paymentDetails.status === 'rejected') {
            await handleFailedPayment(supabase, paymentDetails, 'mercadopago');
          }
        }
        break;
      default:
        console.log(`Evento MercadoPago não tratado: ${body.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Erro ao processar webhook MercadoPago:', error);
    throw error;
  }
}

async function getMercadoPagoPaymentDetails(paymentId: string) {
  const mercadoPagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
  
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${mercadoPagoAccessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar detalhes do pagamento no MercadoPago');
  }

  return await response.json();
}

async function handleSuccessfulPayment(supabase: any, paymentData: any, provedor: string) {
  console.log('Processando pagamento bem-sucedido:', { provedor, paymentData });

  // Determinar usuário e plano baseado nos metadados
  const customerId = provedor === 'stripe' ? paymentData.customer : paymentData.payer?.id;
  const subscriptionId = provedor === 'stripe' ? paymentData.subscription : paymentData.id;

  // Buscar ou criar assinatura
  const { data: assinatura, error } = await supabase
    .from('assinaturas')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .single();

  if (error && error.code !== 'PGRST116') { // Erro diferente de "não encontrado"
    throw error;
  }

  if (!assinatura) {
    console.log('Assinatura não encontrada para subscription_id:', subscriptionId);
    return;
  }

  // Atualizar status da assinatura
  await supabase
    .from('assinaturas')
    .update({
      status: 'ativa',
      data_inicio: new Date().toISOString()
    })
    .eq('id', assinatura.id);

  // Atualizar plano do usuário
  await supabase
    .from('profiles')
    .update({
      plano_ativo: assinatura.plano
    })
    .eq('id', assinatura.usuario_id);

  console.log('Pagamento processado com sucesso para usuário:', assinatura.usuario_id);
}

async function handleFailedPayment(supabase: any, paymentData: any, provedor: string) {
  console.log('Processando pagamento falhou:', { provedor, paymentData });

  const subscriptionId = provedor === 'stripe' ? paymentData.subscription : paymentData.id;

  // Atualizar status da assinatura
  await supabase
    .from('assinaturas')
    .update({
      status: 'suspensa'
    })
    .eq('subscription_id', subscriptionId);
}

async function handleCanceledSubscription(supabase: any, subscriptionData: any, provedor: string) {
  console.log('Processando cancelamento de assinatura:', { provedor, subscriptionData });

  // Atualizar status da assinatura
  const { data: assinatura } = await supabase
    .from('assinaturas')
    .update({
      status: 'cancelada',
      data_fim: new Date().toISOString()
    })
    .eq('subscription_id', subscriptionData.id)
    .select()
    .single();

  if (assinatura) {
    // Voltar usuário para plano gratuito
    await supabase
      .from('profiles')
      .update({
        plano_ativo: 'free'
      })
      .eq('id', assinatura.usuario_id);
  }
}

serve(handler);
