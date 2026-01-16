import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

    if (!HEYGEN_API_KEY) {
      return NextResponse.json(
        { error: 'HeyGen API key not configured' },
        { status: 500 }
      );
    }

    // Get the webhook URL from the request or construct it
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host');
    const webhookUrl = `${protocol}://${host}/api/heygen/webhook`;

    console.log('Registering webhook with HeyGen:', webhookUrl);

    // Register webhook with HeyGen
    const response = await fetch('https://api.heygen.com/v1/webhook/endpoint.add', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': HEYGEN_API_KEY,
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: ['avatar_video.success', 'avatar_video.fail'], // Listen to video completion events
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to register webhook:', data);
      return NextResponse.json(
        {
          error: 'Failed to register webhook with HeyGen',
          details: data
        },
        { status: response.status }
      );
    }

    console.log('Webhook registered successfully:', data);

    return NextResponse.json({
      success: true,
      message: 'Webhook registered successfully',
      webhook_url: webhookUrl,
      data,
    });
  } catch (error: any) {
    console.error('Webhook registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register webhook' },
      { status: 500 }
    );
  }
}
