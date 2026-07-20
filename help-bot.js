(() => {
  if (window.ShelbyHelpBotInitialized) return;
  window.ShelbyHelpBotInitialized = true;

  const ENDPOINT = '/.netlify/functions/submit-lead';
  const isDevelopment = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  const consent = 'By submitting this request, you agree that Shelby Auto Glass may contact you by phone, text, or email regarding your service request. Message and data rates may apply.';
  const welcomeMessage = `👋 Welcome to Shelby Auto Glass!

Hi! I'm the Shelby Auto Glass virtual assistant. I'm here to help answer your questions, guide you to the right service, or help you get a fast, free quote.

Whether you have a chipped windshield, need a full replacement, have broken side or rear glass, need ADAS calibration, or want help with an insurance claim, I'm here to make the process simple.

How can I help you today?`;
  const initialOptions = ['🚗 Start My Quote','🔧 Windshield Repair','🪟 Windshield Replacement','🚙 Side & Rear Glass','📍 Mobile Service','📡 ADAS Calibration','🛡 Insurance Claims','❓ Ask a Question','📞 Contact Shelby Auto Glass'];
  const quickActionMap = {
    '🚗 Start My Quote': 'Get a quote',
    '🔧 Windshield Repair': 'Repair a chip or crack',
    '🪟 Windshield Replacement': 'Replace a windshield',
    '🚙 Side & Rear Glass': 'Replace side or rear glass',
    '📍 Mobile Service': 'Mobile service',
    '📡 ADAS Calibration': 'ADAS calibration',
    '🛡 Insurance Claims': 'Insurance claim',
    '❓ Ask a Question': 'Ask another question',
    '📞 Contact Shelby Auto Glass': 'Contact Shelby Auto Glass'
  };
  const quickActionLabels = {
    '🚗 Start My Quote': 'Start my free auto glass quote',
    '🔧 Windshield Repair': 'Get help with windshield repair',
    '🪟 Windshield Replacement': 'Get help with windshield replacement',
    '🚙 Side & Rear Glass': 'Get help with side or rear glass',
    '📍 Mobile Service': 'Ask about mobile auto glass service',
    '📡 ADAS Calibration': 'Ask about ADAS calibration',
    '🛡 Insurance Claims': 'Get help with an insurance claim',
    '❓ Ask a Question': 'Ask Shelby Auto Glass a question',
    '📞 Contact Shelby Auto Glass': 'Contact Shelby Auto Glass'
  };
  const qa = [
    [/repair|replace|chip|crack/i,'Small chips and some short cracks may be repairable, but final repair eligibility depends on size, location, depth, age, and condition. Damage in the driver’s line of sight or reaching an edge often needs technician review.'],
    [/how long.*repair|repair.*take/i,'Many windshield repairs are quick, but timing depends on damage and schedule. Shelby Auto Glass will confirm the time before service.'],
    [/how long.*replacement|replacement.*take/i,'Windshield replacement usually takes longer than chip repair. Safe drive-away time depends on materials, weather, and vehicle conditions, so the technician will confirm before you drive.'],
    [/mobile|come to/i,'Yes, mobile service may be available around Tucson and nearby communities. Weather, lighting, access, and a safe level work area can affect availability.'],
    [/area|serve/i,'Shelby Auto Glass serves Tucson, Marana, Oro Valley, Vail, Sahuarita, and nearby communities. Share your ZIP code and the team can confirm.'],
    [/side|rear|back glass|door glass/i,'Shelby Auto Glass handles many side windows, quarter glass, and rear/back glass needs. If glass is shattered, avoid touching loose glass and keep children and pets away.'],
    [/clean.*broken|vacuum/i,'For broken side or rear glass, the team can review cleanup needs with your quote. Avoid handling loose glass yourself.'],
    [/insurance|claim|deductible|coverage|rate/i,'Shelby Auto Glass can help with insurance claim questions. Coverage, deductibles, and possible rate effects are determined by your insurance provider, not the shop.'],
    [/cost|price|how much|pay/i,'Pricing depends on the vehicle, glass features, availability, damage, and whether calibration is needed. Estimates are subject to inspection and glass availability. You can pay out of pocket or use insurance.'],
    [/oem|aftermarket/i,'Glass options can vary by vehicle and availability. Share your VIN so the team can identify the correct glass, sensors, tint, moldings, and installed features.'],
    [/adas|calibration|camera|lane|sensor|cruise|rain|hud|heads.?up/i,'Shelby Auto Glass is certified in auto glass ADAS calibration. Many newer vehicles use cameras or sensors near the windshield, and after replacement the vehicle may require calibration to help systems operate as designed. The team must review your vehicle before confirming if calibration is required.'],
    [/warranty/i,'Warranty details can depend on the service and vehicle condition. The team can review the applicable warranty before work begins.'],
    [/vin/i,'The VIN helps identify the correct glass, sensors, tint, moldings, cameras, rain sensors, antennas, and other installed features.'],
    [/long crack|line of sight|more than one chip/i,'Those situations need technician review. Shelby Auto Glass cannot promise repairability until the size, location, depth, age, and condition are checked.'],
    [/fleet|commercial|rv|bus|semi|heavy|classic|exotic|luxury|special/i,'Specialty vehicles, fleets, RVs, heavy equipment, and unusual glass may need review or special order parts. I can collect details and photos for the team.'],
    [/rain|wash|tape|appointment/i,'Weather and curing conditions can affect service. After replacement, follow the technician’s instructions for drive-away time, tape, washing, and weather precautions.'],
    [/regulator|motor|off track|will not move|electrical/i,'A window that will not move may involve the regulator, motor, track, or wiring. Shelby Auto Glass can review the symptoms, but final recommendations may require inspection.'],
    [/leak|wind noise|molding|trim|mirror|warning light|poor.*adhesive|rust|body damage/i,'That needs owner or technician review. Please share photos, vehicle details, and where the issue is happening so Shelby Auto Glass can follow up.']
  ];
  const emergency = /child|pet|locked|injur|active crime|danger|911|trapped/i;
  const unsafe = /shatter|falling|unsafe|stranded|collision|break.?in|vandal|unsecured/i;
  const fields = [
    ['name','What is your full name?'],['phone','What is the best phone number?'],['email','What email address should we use?'],['contactMethod','How would you prefer we contact you?',['Call','Text','Email']],
    ['vehicleYear','What year is the vehicle?'],['vehicleMake','What make is it?'],['vehicleModel','What model is it?'],['bodyStyle','Body style, if relevant? (You can type skip.)'],['vin','VIN is optional but recommended. It helps identify the correct glass, sensors, tint, moldings, and features. What is the VIN? (Type skip if you do not have it.)'],['plate','License plate is optional. (Type skip to leave blank.)'],
    ['glassLocation','Which glass is damaged?',['Front windshield','Driver-side front window','Passenger-side front window','Driver-side rear window','Passenger-side rear window','Rear windshield or back glass','Quarter glass','Vent glass','Sunroof or moonroof','Not sure']],
    ['damageType','What type of damage occurred?',['Rock chip','Crack','Shattered glass','Break-in or vandalism','Collision','Water leak','Wind noise','Window will not move','Glass is off track','Previous installation problem','Other']],['damageSize','About how large is the chip or crack?'],['lineOfSight','Is the damage in the driver’s line of sight?'],['edge','Does the crack reach an edge of the windshield?'],['inPlace','Is the glass still in place?'],['safeToDrive','Is the vehicle safe to drive?'],['damageDate','When did the damage happen?'],
    ['servicePreference','Do you prefer mobile service or service at the shop?'],['zip','What ZIP code is the vehicle located in?'],['serviceAddress','Where will service take place: home, workplace, business/fleet location, or other?'],['safeWorkArea','Is there a safe, level, accessible place for the technician to work?'],['coveredArea','Is the vehicle in a garage, covered area, or outdoors? Weather, access, lighting, and condition may affect mobile service.'],
    ['paymentMethod','How would you like to handle the cost of service?',['Pay out of pocket','Use an insurance claim','I’m not sure yet']],
    ['adasFeatures','Does the vehicle have ADAS features like lane-departure warning, adaptive cruise, rain-sensing wipers, camera/sensors near the mirror, heads-up display, or heated windshield? Shelby Auto Glass is certified in auto glass ADAS calibration.'],
    ['preferredDate','What appointment date would you prefer?'],['preferredTime','What time window works best?'],['drivable','Is the vehicle currently drivable?'],['urgency','How soon is service needed?',['As soon as possible','Within a few days','This week','Flexible','Emergency or vehicle unsecured']],['originalMessage','Anything else you want the team to know?'],['consent',consent + ' Please type yes to submit.']
  ];
  let state = { view:'closed', started:false, collecting:false, step:0, data:{ leadSource:'Help Bot', transcript:[] }, submitted:false, scrollTop:0 };
  const root = document.createElement('div'); root.className='helpbot'; root.innerHTML = `<button type="button" class="helpbot__launcher" aria-label="Open Shelby Help Bot" aria-expanded="false" aria-controls="helpbot-panel">Need Help?</button><section id="helpbot-panel" class="helpbot__panel" role="dialog" aria-modal="false" aria-labelledby="helpbot-title" hidden><header><div class="helpbot__brand" aria-hidden="true"><img src="assets/logo/shelby-logo-dark.webp" alt=""></div><h2 id="helpbot-title">Shelby Help Bot</h2><button type="button" data-min aria-label="Minimize chat" title="Minimize chat">–</button><button type="button" data-close aria-label="Close chat" title="Close chat">×</button></header><div class="helpbot__messages" role="log" aria-live="polite"></div><div class="helpbot__quick"></div><form class="helpbot__form"><label for="helpbot-input">Type your message</label><input id="helpbot-input" autocomplete="off"/><button type="submit">Send</button></form><div class="helpbot__status" aria-live="polite" aria-atomic="true"></div></section>`; document.body.append(root);
  const panel=root.querySelector('.helpbot__panel'), launcher=root.querySelector('.helpbot__launcher'), messages=root.querySelector('.helpbot__messages'), quick=root.querySelector('.helpbot__quick'), input=root.querySelector('input'), status=root.querySelector('.helpbot__status'), form=root.querySelector('form');
  const saveScroll = () => { state.scrollTop = messages.scrollTop; };
  const announce = text => { status.textContent = text; };
  const logDev = (...args) => { if (isDevelopment) console.warn(...args); };
  function setView(view){ state.view=view; const expanded=view==='open'; launcher.setAttribute('aria-expanded', String(expanded)); launcher.setAttribute('aria-label', expanded ? 'Shelby Help Bot is open' : 'Open Shelby Help Bot'); if(expanded){ panel.hidden=false; requestAnimationFrame(()=>{ root.classList.add('helpbot--open'); panel.classList.remove('helpbot__panel--closing'); messages.scrollTop=state.scrollTop || messages.scrollHeight; input.focus({preventScroll:true}); }); announce('Chat opened.'); } else { saveScroll(); panel.classList.add('helpbot__panel--closing'); root.classList.remove('helpbot--open'); const finish=()=>{ if(state.view!== 'open') panel.hidden=true; panel.classList.remove('helpbot__panel--closing'); panel.removeEventListener('transitionend', finish); }; panel.addEventListener('transitionend', finish); window.setTimeout(finish, 320); announce(view==='minimized' ? 'Chat minimized.' : 'Chat closed.'); launcher.focus({preventScroll:true}); } }
  function add(text, who='bot'){ const p=document.createElement('p'); p.className='helpbot__msg helpbot__msg--'+who; p.textContent=text; messages.append(p); messages.scrollTop=messages.scrollHeight; saveScroll(); state.data.transcript.push(`${who}: ${text}`); }
  function addWelcome(){ const article=document.createElement('article'); article.className='helpbot__welcome helpbot__msg helpbot__msg--bot'; article.setAttribute('aria-label','Welcome message from Shelby Auto Glass'); article.innerHTML='<strong>👋 Welcome to Shelby Auto Glass!</strong><span>Hi! I\'m the Shelby Auto Glass virtual assistant. I\'m here to help answer your questions, guide you to the right service, or help you get a fast, free quote.</span><span>Whether you have a chipped windshield, need a full replacement, have broken side or rear glass, need ADAS calibration, or want help with an insurance claim, I\'m here to make the process simple.</span><strong>How can I help you today?</strong>'; messages.append(article); messages.scrollTop=messages.scrollHeight; saveScroll(); state.data.transcript.push(`bot: ${welcomeMessage}`); }
  function buttons(arr){ quick.innerHTML=''; arr.forEach(v=>{ const b=document.createElement('button'); b.type='button'; b.textContent=v; b.setAttribute('aria-label', quickActionLabels[v] || v); b.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); handle(quickActionMap[v] || v); }); quick.append(b); }); }
  function open(){ if(!state.started){ addWelcome(); buttons(initialOptions); state.started=true;} setView('open'); }
  launcher.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); open(); });
  root.querySelector('[data-min]').addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); setView('minimized'); });
  root.querySelector('[data-close]').addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); setView('closed'); });
  messages.addEventListener('scroll', saveScroll, { passive:true });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && state.view==='open') setView('closed'); });
  form.addEventListener('submit', e=>{e.preventDefault(); handle(input.value.trim()); input.value='';});
  function ask(){ const f=fields[state.step]; add(f[1]); buttons(f[2]||[]); }
  function priority(){ const d=state.data; if(/Emergency|unsafe|shatter|collision|break-in|vandal/i.test(Object.values(d).join(' '))) return 'Urgent'; if(/sunroof|rv|semi|fleet|classic|exotic|rust|body/i.test(Object.values(d).join(' '))) return 'Specialty review needed'; if(d.name&&d.phone) return 'Quote requested'; return 'General question'; }
  async function submit(){ if(state.submitted) return; state.submitted=true; buttons([]); add('Thanks. Sending your request now.'); const payload={...state.data, leadPriority:priority(), serviceType:state.data.glassLocation||state.data.serviceType||'Website lead'}; try { const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); if(!r.ok) throw Error('submit failed'); add('Thank you. Your request has been sent to Shelby Auto Glass. A team member will review the details and contact you to confirm pricing, glass availability, and scheduling.'); } catch(e){ state.submitted=false; add('Sorry, the request did not send. Please try again, or call Shelby Auto Glass at (520) 981-9770.'); logDev('Lead submission failed.', e); } }
  function handle(text){ if(!text) return; add(text,'user'); if(emergency.test(text)){ add('If there is immediate danger, serious injury, an active crime, or a child or pet trapped in a vehicle, contact emergency services or the proper local authority immediately. Shelby Auto Glass is not an emergency service.'); return; } if(unsafe.test(text)) add('For shattered or unstable glass: avoid touching loose glass, keep children and pets away, avoid slamming doors, and do not drive if visibility is blocked or glass may fall into the vehicle. Secure the vehicle only if it is safe.');
    if(!state.collecting && /quote|schedule|replace|repair|mobile|insurance|claim|calibration|service|glass|windshield|chip|crack|shatter/i.test(text)){ state.collecting=true; state.data.serviceType=text; add('Absolutely — I can help with that. I’ll collect a few details for the Shelby Auto Glass team so they can confirm pricing, glass availability, and scheduling.'); return ask(); }
    if(!state.collecting && /contact|call|phone|shelby auto glass/i.test(text)){ add('Of course. You can call Shelby Auto Glass at (520) 981-9770. If you’d like, I can also collect your details here and have the team follow up.'); buttons(['Get a quote','Ask another question']); return; }
    if(state.collecting){ const [key]=fields[state.step]; if(key==='consent' && !/^yes|agree/i.test(text)){ add('No problem. I cannot submit without consent. You can call (520) 981-9770 instead.'); return; } state.data[key]=text; if(key==='paymentMethod' && /insurance/i.test(text)){ fields.splice(state.step+1,0,['insuranceCompany','What insurance company do you use?'],['policyholder','What is the policyholder name?'],['claimNumber','Claim number, if available? (Type skip if none.)'],['claimStarted','Has the claim already been started?'],['deductible','Deductible, if known? Coverage and deductible amounts are determined by your insurance provider.']); }
      state.step++; return state.step>=fields.length ? submit() : ask(); }
    const hit=qa.find(([re])=>re.test(text)); add(hit?hit[1]:'I can help with that. For exact policy or unusual situations, Shelby Auto Glass should review it. Would you like to start a quote or have the team follow up?'); buttons(['Get a quote','Ask another question']); }
  document.querySelectorAll('.lead-form').forEach(form=>{ form.addEventListener('submit', async e=>{ e.preventDefault(); const btn=form.querySelector('button[type="submit"]'); if(btn.disabled) return; const data=Object.fromEntries(new FormData(form)); data.leadSource=form.dataset.leadSource||data.leadSource; data.leadPriority='Quote requested'; if(data.website) return; btn.disabled=true; try{ const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); if(!r.ok) throw Error(); form.insertAdjacentHTML('beforeend','<p class="form-status form-status--success">Thank you. Your request has been sent to Shelby Auto Glass.</p>'); form.reset(); } catch(err){ btn.disabled=false; form.insertAdjacentHTML('beforeend','<p class="form-status form-status--error">Sorry, your request did not send. Please call (520) 981-9770 or try again.</p>'); logDev('Lead form submission failed.', err); }}); });
})();
