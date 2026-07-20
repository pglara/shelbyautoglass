const DEFAULT_RECIPIENT = 'shelbyautoglassaz@gmail.com';
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 8;
const buckets = new Map();

const clean = (value) => String(value ?? '').replace(/[<>]/g, '').replace(/[\r\n]+/g, ' ').trim().slice(0, 2500);
const requiredAny = (lead, fields) => fields.some((field) => clean(lead[field]));

function rateLimit(ip) {
  const now = Date.now();
  const bucket = buckets.get(ip) || { count: 0, reset: now + WINDOW_MS };
  if (now > bucket.reset) {
    bucket.count = 0;
    bucket.reset = now + WINDOW_MS;
  }
  bucket.count += 1;
  buckets.set(ip, bucket);
  return bucket.count <= MAX_REQUESTS;
}

function buildEmail(lead, recipient) {
  const vehicle = [lead.vehicleYear, lead.vehicleMake, lead.vehicleModel].map(clean).filter(Boolean).join(' ') || clean(lead.vehicleDescription || lead.vehicle || lead['vehicle-type']) || 'Vehicle not provided';
  const serviceType = clean(lead.serviceType || lead.service || lead.glassLocation || 'Website Lead');
  const customer = clean(lead.name) || 'Unknown Customer';
  const subject = `New Website Lead – ${serviceType} – ${customer} – ${vehicle}`;
  const rows = [
    ['Lead source', lead.leadSource], ['Timestamp', lead.submittedAt || new Date().toISOString()], ['Customer name', lead.name], ['Phone number', lead.phone], ['Email address', lead.email], ['Preferred contact method', lead.contactMethod],
    ['Vehicle', vehicle], ['Vehicle details', lead.vehicleDescription || lead.vehicle], ['VIN', lead.vin], ['License plate', lead.plate], ['Requested service', serviceType], ['Glass location', lead.glassLocation], ['Damage description', lead.damageType || lead.service], ['Damage size/location', [lead.damageSize, lead.lineOfSight, lead.edge].map(clean).filter(Boolean).join(' | ')], ['Safety or urgency concerns', [lead.safeToDrive, lead.inPlace, lead.urgency].map(clean).filter(Boolean).join(' | ')],
    ['Mobile/shop preference', lead.servicePreference], ['ZIP code', lead.zip], ['Service address/details', [lead.serviceAddress, lead.safeWorkArea, lead.coveredArea].map(clean).filter(Boolean).join(' | ')], ['Payment type', lead.paymentMethod], ['Insurance details', [lead.insuranceCompany, lead.policyholder, lead.claimNumber, lead.claimStarted, lead.deductible].map(clean).filter(Boolean).join(' | ')],
    ['ADAS features', lead.adasFeatures], ['Preferred appointment', [lead.preferredDate, lead.preferredTime].map(clean).filter(Boolean).join(' | ')], ['Vehicle drivable', lead.drivable], ['Uploaded photo links/attachments', lead.photos], ['Customer question', lead.customerQuestion || lead.originalMessage], ['Lead-priority label', lead.leadPriority], ['Full chat transcript', Array.isArray(lead.transcript) ? lead.transcript.map(clean).join('\n') : lead.transcript]
  ];
  const body = [`To: ${recipient}`, `Subject: ${subject}`, '', ...rows.map(([label, value]) => `${label}: ${clean(value) || 'Not provided'}`)].join('\n');
  return { subject, body };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  if (!rateLimit(ip)) return { statusCode: 429, body: 'Too many requests' };

  let lead;
  try { lead = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: 'Invalid request' }; }
  if (clean(lead.website)) return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  if (!requiredAny(lead, ['phone', 'email']) || !requiredAny(lead, ['leadSource', 'service', 'serviceType', 'glassLocation', 'originalMessage'])) return { statusCode: 422, body: 'Missing required lead details' };

  const recipient = process.env.LEAD_RECIPIENT_EMAIL || DEFAULT_RECIPIENT;
  const { subject, body } = buildEmail(lead, recipient);

  try {
    if (process.env.EMAIL_WEBHOOK_URL) {
      const response = await fetch(process.env.EMAIL_WEBHOOK_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.EMAIL_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.EMAIL_WEBHOOK_TOKEN}` } : {}) },
        body: JSON.stringify({ to: recipient, subject, text: body })
      });
      if (!response.ok) throw new Error('email webhook failed');
    } else {
      console.info('Lead received for configured recipient; set EMAIL_WEBHOOK_URL to deliver email.');
      console.info(body);
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    console.error('Lead delivery failed', { leadSource: clean(lead.leadSource), serviceType: clean(lead.serviceType || lead.service) });
    return { statusCode: 502, body: 'Lead delivery failed' };
  }
};
