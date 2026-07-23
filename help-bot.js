(() => {
  if (window.ShelbyHelpBotInitialized) return;
  window.ShelbyHelpBotInitialized = true;

  const ENDPOINT = '/.netlify/functions/submit-lead';
  const isDevelopment = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  const consent = 'By submitting, you agree Shelby Auto Glass may contact you by phone, text, or email about your service request. Message and data rates may apply.';
  const welcomeMessage = `👋 Welcome to Shelby Auto Glass!\n\nI'm here to help you get your glass repaired or replaced as quickly as possible.\n\nWhether you have a rock chip, cracked windshield, broken side window, or need help with an insurance claim, I can get you started in just a minute.\n\nWhat can I help you with today?`;
  const initialOptions = ['🚗 Get a Free Quote','🔧 Windshield Repair','🪟 Windshield Replacement','🚙 Side & Rear Glass','📍 Mobile Service','📡 ADAS Calibration','🛡 Insurance Claim','📞 Speak With Our Team'];
  const quickActionMap = {
    '🚗 Get a Free Quote': 'Get a free quote',
    '🔧 Windshield Repair': 'Windshield repair',
    '🪟 Windshield Replacement': 'Windshield replacement',
    '🚙 Side & Rear Glass': 'Side and rear glass',
    '📍 Mobile Service': 'Mobile service',
    '📡 ADAS Calibration': 'ADAS calibration',
    '🛡 Insurance Claim': 'Insurance claim',
    '📞 Speak With Our Team': 'Speak with our team'
  };
  const optionLabels = {
    '🚗 Get a Free Quote': 'Get a free auto glass quote',
    '🔧 Windshield Repair': 'Get help with windshield repair',
    '🪟 Windshield Replacement': 'Get help with windshield replacement',
    '🚙 Side & Rear Glass': 'Get help with side or rear glass',
    '📍 Mobile Service': 'Ask about mobile service',
    '📡 ADAS Calibration': 'Ask about ADAS calibration',
    '🛡 Insurance Claim': 'Get help with an insurance claim',
    '📞 Speak With Our Team': 'Request a call from Shelby Auto Glass'
  };
  const glassOptions = ['Windshield','Driver Side','Passenger Side','Rear Window','Quarter Glass',"I'm Not Sure"];
  const damageOptions = ['Rock Chip','Crack','Shattered Glass','Break-In','Collision','Other'];
  const paymentOptions = ['Paying Out of Pocket','Insurance Claim','Not Sure Yet'];
  const contactOptions = ['Call','Text','Email'];
  const emergency = /child|pet|locked|injur|active crime|danger|911|trapped/i;
  const urgent = /today|asap|right away|immediately|urgent|shatter|shattered|break.?in|window is broken|unsecured|insurance sent/i;
  const replacementIntent = /broken windshield|large crack|long crack|shatter|shattered|windshield cracked|replacement/i;
  const repairIntent = /small rock chip|rock chip|small crack|chip/i;
  const sideRearIntent = /side window|door glass|rear glass|back glass|quarter glass/i;

  let state = { view:'closed', started:false, collecting:false, step:0, data:{ leadSource:'Help Bot', transcript:[], submittedAt:'' }, submitted:false, scrollTop:0, flow:[] };
  const root = document.createElement('div');
  root.className='helpbot';
  root.innerHTML = `<button type="button" class="helpbot__launcher" aria-label="Open Shelby Auto Glass Assistant" aria-expanded="false" aria-controls="helpbot-panel">Need Help?</button><section id="helpbot-panel" class="helpbot__panel" role="dialog" aria-modal="false" aria-labelledby="helpbot-title" hidden><header><div class="helpbot__brand" aria-hidden="true"><img src="/assets/logo/Shelby-Auto-Glass-Logo-Dark-Header-Web.png" alt=""></div><h2 id="helpbot-title">Shelby Help Bot</h2><button type="button" data-min aria-label="Minimize chat" title="Minimize chat">–</button><button type="button" data-close aria-label="Close chat" title="Close chat">×</button></header><div class="helpbot__messages" role="log" aria-live="polite"></div><div class="helpbot__quick"></div><form class="helpbot__form"><label for="helpbot-input">Type your message</label><input id="helpbot-input" autocomplete="off"/><button type="submit">Send</button></form><div class="helpbot__status" aria-live="polite" aria-atomic="true"></div></section>`;
  document.body.append(root);
  const panel=root.querySelector('.helpbot__panel'), launcher=root.querySelector('.helpbot__launcher'), messages=root.querySelector('.helpbot__messages'), quick=root.querySelector('.helpbot__quick'), input=root.querySelector('input'), status=root.querySelector('.helpbot__status'), form=root.querySelector('form');
  const saveScroll = () => { state.scrollTop = messages.scrollTop; };
  const enforceDockPosition = () => {
    root.style.position = 'fixed';
    root.style.top = 'auto';
    root.style.left = 'auto';
    root.style.right = window.matchMedia('(max-width: 760px)').matches ? '16px' : '24px';
    root.style.bottom = window.matchMedia('(max-width: 760px)').matches ? '20px' : '24px';
    root.style.transform = 'none';
    root.style.zIndex = '9999';
  };
  const announce = text => { status.textContent = text; };
  const logDev = (...args) => { if (isDevelopment) console.warn(...args); };
  function setView(view){ state.view=view; const expanded=view==='open'; launcher.setAttribute('aria-expanded', String(expanded)); launcher.setAttribute('aria-label', expanded ? 'Shelby Help Bot is open' : 'Open Shelby Auto Glass Assistant'); if(expanded){ panel.hidden=false; requestAnimationFrame(()=>{ root.classList.add('helpbot--open'); panel.classList.remove('helpbot__panel--closing'); messages.scrollTop=state.scrollTop || messages.scrollHeight; input.focus({preventScroll:true}); }); announce('Chat opened.'); } else { saveScroll(); panel.classList.add('helpbot__panel--closing'); root.classList.remove('helpbot--open'); const finish=()=>{ if(state.view!== 'open') panel.hidden=true; panel.classList.remove('helpbot__panel--closing'); panel.removeEventListener('transitionend', finish); }; panel.addEventListener('transitionend', finish); window.setTimeout(finish, 320); announce(view==='minimized' ? 'Chat minimized.' : 'Chat closed.'); launcher.focus({preventScroll:true}); } }
  function add(text, who='bot'){ const p=document.createElement('p'); p.className='helpbot__msg helpbot__msg--'+who; p.textContent=text; messages.append(p); messages.scrollTop=messages.scrollHeight; saveScroll(); state.data.transcript.push(`${who}: ${text}`); }
  function addWelcome(){ const article=document.createElement('article'); article.className='helpbot__welcome helpbot__msg helpbot__msg--bot'; article.setAttribute('aria-label','Welcome message from Shelby Auto Glass'); article.innerHTML='<strong>👋 Welcome to Shelby Auto Glass!</strong><span>I\'m here to help you get your glass repaired or replaced as quickly as possible.</span><span>Whether you have a rock chip, cracked windshield, broken side window, or need help with an insurance claim, I can get you started in just a minute.</span><strong>What can I help you with today?</strong>'; messages.append(article); messages.scrollTop=messages.scrollHeight; saveScroll(); state.data.transcript.push(`bot: ${welcomeMessage}`); }
  function buttons(arr){ quick.innerHTML=''; arr.forEach(v=>{ const b=document.createElement('button'); b.type='button'; b.textContent=v; b.setAttribute('aria-label', optionLabels[v] || v); b.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); handle(quickActionMap[v] || v); }); quick.append(b); }); }
  function open(){ if(!state.started){ addWelcome(); buttons(initialOptions); state.started=true;} setView('open'); }
  enforceDockPosition();
  window.addEventListener('resize', enforceDockPosition);
  launcher.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); open(); });
  root.querySelector('[data-min]').addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); setView('minimized'); });
  root.querySelector('[data-close]').addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); setView('closed'); });
  messages.addEventListener('scroll', saveScroll, { passive:true });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && state.view==='open') setView('closed'); });
  form.addEventListener('submit', e=>{e.preventDefault(); handle(input.value.trim()); input.value='';});

  function quoteFlow(contactFirst=false){
    const vehicleStep = ['vehicle','What vehicle do you have? Please include year, make, and model.'];
    const contactSteps = [['name','What is your name?'],['phone','What is the best phone number?'],['email','What email address should we use?'],['contactMethod','Would you like us to call, text, or email you?', contactOptions],['consent',`${consent} Please type yes to submit.`]];
    const qualifySteps = [vehicleStep,['glassLocation','What glass needs service?', glassOptions],['damageType','What happened?', damageOptions],['paymentMethod','Will you be paying out of pocket or using insurance?', paymentOptions],['zip','Where is the vehicle located? Please enter the ZIP code.']];
    state.flow = contactFirst ? [...contactSteps.slice(0,3), vehicleStep, ['glassLocation','What glass needs service?', glassOptions], ['zip','Where is the vehicle located? Please enter the ZIP code.'], ...contactSteps.slice(3)] : [...qualifySteps, ...contactSteps];
    state.step = 0; state.collecting = true; ask();
  }
  function ask(){ const f=state.flow[state.step]; add(f[1]); buttons(f[2]||[]); }
  function priority(){ const all=Object.values(state.data).join(' '); if(urgent.test(all)) return 'Urgent'; if(state.data.name&&state.data.phone) return 'Quote requested'; return 'General question'; }
  async function submit(){ if(state.submitted) return; state.submitted=true; buttons([]); state.data.submittedAt = new Date().toISOString(); add('Perfect! We\'ll review your information and contact you shortly with your quote.'); const payload={...state.data, leadPriority:priority(), serviceType:state.data.glassLocation||state.data.serviceType||'Website lead'}; try { const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); if(!r.ok) throw Error('submit failed'); } catch(e){ state.submitted=false; add('Sorry, the request did not send. Please call Shelby Auto Glass at (520) 981-9770, or try again.'); logDev('Lead submission failed.', e); } }
  function route(text){ if(sideRearIntent.test(text)) { state.data.glassLocation='Side or rear glass'; return 'We can definitely help with side and rear glass. Let’s get your details so our team can check availability.'; } if(replacementIntent.test(text)) { state.data.glassLocation='Windshield'; state.data.damageType='Crack or shattered glass'; return 'You’re in the right place. That usually points toward replacement, and we’ll make the process as easy as possible.'; } if(repairIntent.test(text)) { state.data.glassLocation='Windshield'; state.data.damageType='Rock chip or small crack'; return 'That happens more often than you’d think. A technician will confirm if repair is possible, and I can start the quote now.'; } return 'Absolutely — I can help with that. I’ll collect a few quick details so Shelby Auto Glass can follow up fast.'; }
  function answerThenLead(text){
    if(/insurance|claim|deductible|coverage/i.test(text)) return 'Yes. We work with many insurance providers and can help guide you through the claim process. To check your options, may I ask what vehicle you have?';
    if(/mobile|come to|location/i.test(text)) return 'Yes, mobile service is available in many cases. Share your ZIP code during the quote and we’ll confirm the fastest option.';
    if(/adas|calibration|camera|sensor/i.test(text)) return 'Shelby Auto Glass offers certified ADAS calibration when your vehicle requires it. What vehicle do you have?';
    if(/cost|price|how much/i.test(text)) return 'Pricing depends on the vehicle, glass, features, and payment type. I can get the quote started now — what vehicle do you have?';
    if(/how long|time|same day|today/i.test(text)) return 'Fast response times are a priority, and the team will confirm the soonest available appointment. What vehicle do you have?';
    return "That's a great question. I'd like one of our specialists to help with that.";
  }
  function handle(text){ if(!text) return; add(text,'user'); state.data.customerQuestion ||= text; if(emergency.test(text)){ add('If there is immediate danger, serious injury, an active crime, or a child or pet trapped in a vehicle, please contact emergency services immediately.'); return; }
    if(state.collecting){ const [key]=state.flow[state.step]; if(key==='consent' && !/^yes|agree/i.test(text)){ add('No problem. I cannot submit without consent. You can call (520) 981-9770 instead.'); return; } state.data[key]=text; if(key==='vehicle'){ const parts=text.match(/(19|20)\d{2}/); if(parts) state.data.vehicleYear=parts[0]; state.data.vehicleDescription=text; } state.step++; return state.step>=state.flow.length ? submit() : ask(); }
    if(/speak|call|contact|team|representative|specialist/i.test(text) || urgent.test(text)){ add(urgent.test(text) ? 'We can help. Since this sounds time-sensitive, I’ll get your contact details first.' : "You're in the right place. I’ll collect your contact details so our team can follow up."); state.data.serviceType=text; return quoteFlow(true); }
    if(/quote|schedule|replace|repair|mobile|insurance|claim|calibration|service|glass|windshield|chip|crack|shatter|side|rear/i.test(text)){ state.data.serviceType=text; add(route(text)); return quoteFlow(false); }
    const reply = answerThenLead(text); add(reply); if (reply.startsWith("That's")) state.data.serviceType = 'Specialist follow-up'; return reply.startsWith("That's") ? quoteFlow(true) : quoteFlow(false); }

  document.querySelectorAll('.lead-form').forEach(form=>{ form.addEventListener('submit', async e=>{ e.preventDefault(); const btn=form.querySelector('button[type="submit"]'); if(btn.disabled) return; const data=Object.fromEntries(new FormData(form)); data.leadSource=form.dataset.leadSource||data.leadSource; data.leadPriority='Quote requested'; data.submittedAt=new Date().toISOString(); if(data.website) return; btn.disabled=true; try{ const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); if(!r.ok) throw Error(); form.insertAdjacentHTML('beforeend','<p class="form-status form-status--success">Thank you. Your request has been sent to Shelby Auto Glass.</p>'); form.reset(); } catch(err){ btn.disabled=false; form.insertAdjacentHTML('beforeend','<p class="form-status form-status--error">Sorry, your request did not send. Please call (520) 981-9770 or try again.</p>'); logDev('Lead form submission failed.', err); }}); });
})();
