import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    let stripeCustomerId = user.publicMetadata?.stripeCustomerId as string | undefined;

    // Fallback: look up by email in Stripe (fixes users who paid before we saved the customer ID)
    if (!stripeCustomerId) {
      const email = user.emailAddresses[0]?.emailAddress;
      if (email) {
        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id;
          // Backfill so we don't need to look up again
          await client.users.updateUserMetadata(userId, {
            publicMetadata: { ...user.publicMetadata, stripeCustomerId },
          });
        }
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: appUrl,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
