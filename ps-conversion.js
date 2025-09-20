// Webflow Cloud / Node server function for PartnerStack S2S by XID
// Endpoint:  /functions/ps-conversion
//
// REQUIRED env var in Webflow Cloud project:
//   PARTNERSTACK_TOKEN = <the Bearer token PartnerStack gave you>

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Expect JSON body from your site/app
    const {
      customer_key,   // REQUIRED (your internal unique ID; often email or user_id)
      xid,            // REQUIRED (the ps_xid you captured on first click)
      email,          // OPTIONAL
      name,           // OPTIONAL
      origin,         // OPTIONAL (e.g., "oysterhr.com")
      ip_address,     // OPTIONAL (best effort)
      user_agent,     // OPTIONAL (best effort)
      external_type,  // OPTIONAL
      sub_ids         // OPTIONAL array of strings
    } = req.body || {};

    if (!customer_key || !xid) {
      return res.status(400).json({ error: 'Missing required fields: customer_key and xid' });
    }

    const token = process.env.PARTNERSTACK_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'Server misconfigured: PARTNERSTACK_TOKEN not set' });
    }

    const payload = {
      customer_key,
      xid,
      ...(email ? { email } : {}),
      ...(name ? { name } : {}),
      ...(origin ? { origin } : {}),
      ...(ip_address ? { ip_address } : {}),
      ...(user_agent ? { user_agent } : {}),
      ...(external_type ? { external_type } : {}),
      ...(Array.isArray(sub_ids) ? { sub_ids } : {})
    };

    const resp = await fetch('https://partnerlinks.io/conversion/xid', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type' : 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text(); // PartnerStack may return JSON or text
    const safe = (() => { try { return JSON.parse(text); } catch { return { raw: text }; } })();

    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'PartnerStack error', details: safe });
    }

    return res.status(200).json({ ok: true, partnerstack: safe });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Unexpected server error' });
  }
}
