export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-nara-base-url',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequestPost(context: { request: Request }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-nara-base-url',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  try {
    const body = await context.request.json();
    const apiKey =
      context.request.headers.get('Authorization') ||
      body.apiKey ||
      'sk-nry-fAxYIxRMbiWppJlEvjxt5nvnaB00eREpryEO_F_uqVY';

    const baseUrl =
      context.request.headers.get('x-nara-base-url') ||
      body.baseUrl ||
      'https://router.bynara.id/v1';

    const authHeader = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;

    const targetUrl = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        model: body.model || 'glm-5.3-free',
        messages: body.messages,
        temperature: body.temperature ?? 0.2,
      }),
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: {
          message: error.message || 'Cloudflare Edge Proxy error connecting to AI provider.',
        },
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
