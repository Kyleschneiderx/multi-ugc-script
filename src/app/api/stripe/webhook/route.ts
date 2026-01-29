import { stripe } from '@/lib/stripe-client';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlanByPriceId } from '@/types/subscription';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Disable body parsing to get raw body for Stripe signature verification
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  try {
    console.log('Processing webhook event:', event.type, 'Event ID:', event.id);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0].price.id;
        const planType = getPlanByPriceId(priceId);

        console.log('Subscription details:', {
          subscriptionId: subscription.id,
          customerId,
          priceId,
          planType,
          status: subscription.status,
        });

        if (!planType) {
          console.error('Unknown price ID:', priceId);
          console.error('Expected basic price IDs:', process.env.STRIPE_BASIC_PRICE_ID);
          console.error('Expected pro price IDs:', process.env.STRIPE_PRO_PRICE_ID);
          return NextResponse.json(
            { error: `Unknown price ID: ${priceId}` },
            { status: 500 }
          );
        }

        // Update customer ID in profiles
        console.log('Looking for profile with stripe_customer_id:', customerId);
        const { data: profile, error: profileError } = await (supabase
          .from('profiles') as any)
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        console.log('Profile lookup result:', { profile, error: profileError });

        let userId: string;

        if (!profile) {
          // First time subscription - find user by metadata
          const customer = await stripe.customers.retrieve(customerId);
          if ('deleted' in customer) {
            console.error('Customer deleted:', customerId);
            return NextResponse.json(
              { error: 'Customer has been deleted' },
              { status: 500 }
            );
          }

          // Get user ID from checkout session metadata
          const sessions = await stripe.checkout.sessions.list({
            customer: customerId,
            limit: 1,
          });

          if (sessions.data.length === 0) {
            console.error('No session found for customer:', customerId);
            return NextResponse.json(
              { error: 'No checkout session found for customer' },
              { status: 500 }
            );
          }

          userId = sessions.data[0].client_reference_id || sessions.data[0].metadata?.userId || '';

          console.log('Found user ID from session:', userId);

          if (!userId) {
            console.error('No user ID found for customer:', customerId);
            return NextResponse.json(
              { error: 'User ID not found in session metadata' },
              { status: 500 }
            );
          }

          // Update profile with stripe customer ID
          console.log('Updating profile with stripe_customer_id for user:', userId);
          const { error: updateError } = await (supabase
            .from('profiles') as any)
            .update({ stripe_customer_id: customerId })
            .eq('id', userId);

          if (updateError) {
            console.error('Failed to update profile:', updateError);
          } else {
            console.log('Successfully updated profile with stripe_customer_id');
          }
        } else {
          userId = profile.id;
        }

        // Prepare subscription data with safe timestamp handling
        const subscriptionData: any = {
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          plan_type: planType,
          status: subscription.status as any,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        };

        // Only add period dates if they exist (incomplete subscriptions may not have them)
        if (subscription.current_period_start) {
          subscriptionData.current_period_start = new Date(
            subscription.current_period_start * 1000
          ).toISOString();
        }

        if (subscription.current_period_end) {
          subscriptionData.current_period_end = new Date(
            subscription.current_period_end * 1000
          ).toISOString();
        }

        // Upsert subscription
        console.log('Upserting subscription with data:', subscriptionData);
        const { data: upsertedSub, error: upsertError } = await (supabase
          .from('subscriptions') as any)
          .upsert(subscriptionData, {
            onConflict: 'stripe_subscription_id'
          })
          .select();

        if (upsertError) {
          console.error('Failed to upsert subscription:', upsertError);
        } else {
          console.log('Successfully upserted subscription:', upsertedSub);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await (supabase
          .from('subscriptions') as any)
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
