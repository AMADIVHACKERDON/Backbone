import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // 1. Verify the logged-in user via Supabase cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const zenditHeaders = {
      Authorization: `Bearer ${process.env.ZENDIT_API_KEY}`,
      'Content-Type': 'application/json',
    };

    // console.log(zenditHeaders);

    // 2. Fetch available eSIM offers from Zendit Sandbox (e.g., Nigeria or Global)
    const offersRes = await fetch(
      'https://api.zendit.io/v1/esim/offers?_limit=1&_offset=0', {
      headers: zenditHeaders,
    });
    const offersData = await offersRes.json();

    const offer = offersData.list[0]; // get the first offer
    // console.log("OFFER:", offer);

    if (!offer) {
      return NextResponse.json({ error: 'No eSIM offers found in Zendit Sandbox' }, { status: 404 });
    }

    // 3. Submit a test purchase in Zendit Sandbox
    const transactionId = `aetekonect_${Date.now()}`;
    const purchaseRes = await fetch('https://api.zendit.io/v1/esim/purchases', {
      method: 'POST',
      headers: zenditHeaders,
      body: JSON.stringify({
        offerId: offer.offerId,
        transactionId,
      }),
    });
    const purchaseData = await purchaseRes.json();
    console.log("purchase", purchaseData);

    // 4. Fetch the generated eSIM activation details (LPA string & ICCID)
    const detailRes = await fetch(`https://api.zendit.io/v1/esim/purchases/${transactionId}`, {
      headers: zenditHeaders,
    });
    const detailData = await detailRes.json();

    const iccid = detailData.confirmation?.iccid || `TEST_ICCID_${Date.now()}`;
    const lpaCode =
      detailData.confirmation?.lpa ||
      `LPA:1$rsp.zendit.io$${offer.offerId}`;

    // 5. Save the eSIM profile to Supabase
    const { data: profile, error: dbError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        esim_iccid: iccid,
        esim_qr_code: lpaCode,
        active_network: `${offer.brand || 'Zendit'} Multi-Carrier eSIM`,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      transactionId,
      offer: offer.offerId,
      profile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to provision eSIM';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}