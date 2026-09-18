(() => {
  const C = window.APP_CONFIG || {};
  const hasSupabase = Boolean(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase);
  const sb = hasSupabase ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
  const state = {
    view: "dashboard",
    query: "",
    members: [],
    bills: [],
    saved: [],
    selectedMember: null,
    selectedBill: null,
    live: false,
    user: null
  };

  const demoMembers = [
    {id:"D001",name:"Alexandra Morgan",party:"D",state:"SC",district:"07",chamber:"House",role:"Representative",committees:"Energy & Commerce; Education",updated:"2026-09-16",score:78},
    {id:"R001",name:"Daniel Carter",party:"R",state:"SC",district:"01",chamber:"House",role:"Representative",committees:"Armed Services; Budget",updated:"2026-09-16",score:84},
    {id:"I001",name:"Jordan Lee",party:"I",state:"SC",district:"00",chamber:"Senate",role:"Senator",committees:"Judiciary; Finance",updated:"2026-09-16",score:81},
    {id:"D002",name:"Maria Thompson",party:"D",state:"NC",district:"04",chamber:"House",role:"Representative",committees:"Science; Agriculture",updated:"2026-09-16",score:72},
    {id:"R002",name:"Ethan Brooks",party:"R",state:"GA",district:"05",chamber:"House",role:"Representative",committees:"Transportation; Small Business",updated:"2026-09-16",score:76},
    {id:"D003",name:"Priya Shah",party:"D",state:"VA",district:"08",chamber:"House",role:"Representative",committees:"Foreign Affairs; Intelligence",updated:"2026-09-16",score:89}
  ];
  const demoBills = [
    {id:"HR-1024",title:"Digital Access and Connectivity Act",chamber:"House",status:"Introduced",sponsor:"Alexandra Morgan",topic:"Technology",updated:"2026-09-15",summary:"Would expand access to broadband infrastructure and digital skills programs."},
    {id:"S-418",title:"Clean Energy Research Act",chamber:"Senate",status:"Committee",sponsor:"Jordan Lee",topic:"Energy",updated:"2026-09-14",summary:"Would authorize federal support for clean-energy research and demonstration programs."},
    {id:"HR-781",title:"Student Data Privacy Act",chamber:"House",status:"Passed House",sponsor:"Maria Thompson",topic:"Education",updated:"2026-09-13",summary:"Would establish standards for handling student education data by covered services."},
    {id:"S-902",title:"Veterans Workforce Pathways Act",chamber:"Senate",status:"Floor",sponsor:"Daniel Carter",topic:"Veterans",updated:"2026-09-12",summary:"Would create workforce and training grants targeted at transitioning veterans."},
    {id:"HR-1207",title:"Research Infrastructure Modernization Act",chamber:"House",status:"Introduced",sponsor:"Priya Shah",topic:"Science",updated:"2026-09-11",summary:"Would support modernization of federally funded research infrastructure."}
  ];

  const esc = (s="") => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials = name => name.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();
  const partyClass = p => p==="D" ? "blue" : p==="R" ? "red" : "amber";

  async function loadData() {
    state.members = [...demoMembers];
    state.bills = [...demoBills];
    if (sb) {
      try {
        const [m,b] = await Promise.all([
          sb.from("members").select("*").order("name"),
          sb.from("bills").select("*").order("updated",{ascending:false})
        ]);
        if (!m.error && m.data?.length) state.members = m.data;
        if (!b.error && b.data?.length) state.bills = b.data;
        state.live = Boolean((m.data?.length || b.data?.length));
        const {data:{user}} = await sb.auth.getUser();
        state.user = user || null;
      } catch(e) { console.warn("Supabase read fallback:", e); }
    }
  }

  async function saveItem(type, id) {
    if (state.saved.includes(type+":"+id)) {
      state.saved = state.saved.filter(x=>x!==type+":"+id);
    } else state.saved.push(type+":"+id);
    localStorage.setItem("congressional_saved", JSON.stringify(state.saved));
    if (sb && state.user) {
      try { await sb.from("saved_items").upsert({user_id:state.user.id,item_type:type,item_id:id}); } catch(e) {}
    }
    toast(state.saved.includes(type+":"+id) ? "Saved to your watchlist." : "Removed from watchlist.");
    render();
  }

  function navButton(id, icon, label) {
    return `<button class="${state.view===id?"active":""}" data-nav="${id}"><span class="icon">${icon}</span>${label}</button>`;
  }

  function layout() {
    document.querySelector("#app").innerHTML = `
      <div class="shell">
        <aside class="sidebar" id="sidebar">
          <div class="brand"><div class="brandmark">C</div><div><strong>CongressionalApp</strong><span>Nonpartisan civic research</span></div></div>
          <nav class="nav">
            ${navButton("dashboard","⌂","Overview")}
            ${navButton("members","◉","Members")}
            ${navButton("bills","▣","Legislation")}
            ${navButton("district","⌖","District Finder")}
            ${navButton("compare","⇄","Compare")}
            ${navButton("saved","☆","Watchlist")}
          </nav>
          <div class="sidebar-foot">Data is presented for research and civic education. Positions and summaries should be checked against primary congressional records.</div>
        </aside>
        <main class="main">
          <header class="topbar">
            <div style="display:flex;gap:10px;align-items:center;min-width:0">
              <button class="mobilemenu" id="mobileMenu">☰</button>
              <div class="search"><input id="globalSearch" placeholder="Search members, bills, topics…" value="${esc(state.query)}" /></div>
            </div>
            <div class="userpill"><span class="tag ${state.live?"green":"amber"}">${state.live?"LIVE DATA":"DEMO DATA"}</span><span>${state.user?.email ? esc(state.user.email) : "Research mode"}</span><div class="avatar">${state.user ? esc(initials(state.user.email)) : "R"}</div></div>
          </header>
          <section class="content">${viewHTML()}</section>
        </main>
      </div>
      <div class="modal" id="modal"></div>
    `;
    bind();
  }

  function viewHTML() {
    if (state.view==="members") return membersView();
    if (state.view==="bills") return billsView();
    if (state.view==="district") return districtView();
    if (state.view==="compare") return compareView();
    if (state.view==="saved") return savedView();
    return dashboardView();
  }

  function dashboardView() {
    const recent = state.bills.slice(0,4);
    const active = state.members.slice(0,4);
    return `
      <div class="hero"><div><div class="eyebrow">Congressional intelligence</div><h1>Understand Congress without the noise.</h1><p>Track members, legislation, committees, and activity in one research dashboard. Built to keep political information factual, sourced, and easy to explore.</p></div><div class="actions"><button class="btn primary" data-nav="members">Explore members</button><button class="btn" data-nav="bills">Browse legislation</button></div></div>
      <div class="grid stats">
        <div class="card stat"><div class="label">Members indexed</div><div class="value">${state.members.length}</div><div class="delta">House + Senate</div></div>
        <div class="card stat"><div class="label">Bills tracked</div><div class="value">${state.bills.length}</div><div class="delta">Recent activity</div></div>
        <div class="card stat"><div class="label">Topics</div><div class="value">${new Set(state.bills.map(x=>x.topic)).size}</div><div class="delta">Across tracked bills</div></div>
        <div class="card stat"><div class="label">Watchlist</div><div class="value">${state.saved.length}</div><div class="delta">Saved items</div></div>
      </div>
      <div class="grid two">
        <div class="card"><div class="cardhead"><h2>Recent legislation</h2><button class="btn" data-nav="bills">View all</button></div><div class="cardbody"><div class="list">${recent.map(billRow).join("")}</div></div></div>
        <div class="card"><div class="cardhead"><h2>Members to explore</h2><button class="btn" data-nav="members">Directory</button></div><div class="cardbody"><div class="list">${active.map(memberRow).join("")}</div></div></div>
      </div>
      <div class="card" style="margin-top:16px"><div class="cardhead"><h2>Research toolkit</h2></div><div class="cardbody"><div class="grid stats" style="margin:0">
        <div class="item"><strong>Member profiles</strong><p>See chamber, district, committees, party, and activity in one place.</p></div>
        <div class="item"><strong>Legislation tracker</strong><p>Search by title, topic, chamber, sponsor, and status.</p></div>
        <div class="item"><strong>Compare</strong><p>Place two members side-by-side without turning the data into a ranking.</p></div>
        <div class="item"><strong>Watchlist</strong><p>Keep bills and members you want to research later.</p></div>
      </div></div></div>
    `;
  }

  function memberRow(m) {
    return `<button class="item" style="text-align:left;color:inherit;border:1px solid var(--line);width:100%" data-member="${esc(m.id)}"><div class="itemtop"><div class="member"><div class="portrait">${esc(initials(m.name))}</div><div><strong>${esc(m.name)}</strong><small>${esc(m.role)} · ${esc(m.state)}${m.district&&m.district!=="00"?"-"+esc(m.district):""}</small></div></div><span class="tag ${partyClass(m.party)}">${esc(m.party)}</span></div></button>`;
  }
  function billRow(b) {
    return `<button class="item" style="text-align:left;color:inherit;border:1px solid var(--line);width:100%" data-bill="${esc(b.id)}"><div class="itemtop"><strong>${esc(b.id)} · ${esc(b.title)}</strong><span class="tag blue">${esc(b.status)}</span></div><p>${esc(b.summary)}</p></button>`;
  }

  function membersView() {
    const q=state.query.toLowerCase();
    const rows=state.members.filter(m=>[m.name,m.state,m.party,m.chamber,m.role,m.committees].join(" ").toLowerCase().includes(q));
    return `<div class="hero"><div><div class="eyebrow">Directory</div><h1>Members of Congress</h1><p>Search the member directory by name, state, chamber, party, or committee.</p></div><div class="actions"><button class="btn primary" data-action="compare-pick">Start compare</button></div></div>
      <div class="toolbar"><input class="field" id="memberFilter" placeholder="Filter members…" value="${esc(state.query)}" /><select class="field" id="partyFilter"><option value="">All parties</option><option>D</option><option>R</option><option>I</option></select><select class="field" id="chamberFilter"><option value="">Both chambers</option><option>House</option><option>Senate</option></select></div>
      <div class="card"><div class="tablewrap"><table class="table"><thead><tr><th>Member</th><th>Party</th><th>Chamber</th><th>State / district</th><th>Committees</th><th></th></tr></thead><tbody>${rows.map(m=>`<tr><td><div class="member"><div class="portrait">${esc(initials(m.name))}</div><div><strong>${esc(m.name)}</strong><small>${esc(m.role)}</small></div></div></td><td><span class="tag ${partyClass(m.party)}">${esc(m.party)}</span></td><td>${esc(m.chamber)}</td><td>${esc(m.state)} ${m.district&&m.district!=="00"?"· "+esc(m.district):""}</td><td>${esc(m.committees||"—")}</td><td><button class="btn" data-member="${esc(m.id)}">Open</button></td></tr>`).join("") || '<tr><td colspan="6" class="empty">No members found.</td></tr>'}</tbody></table></div></div>`;
  }

  function billsView() {
    const q=state.query.toLowerCase();
    const rows=state.bills.filter(b=>[b.id,b.title,b.topic,b.status,b.sponsor,b.chamber].join(" ").toLowerCase().includes(q));
    return `<div class="hero"><div><div class="eyebrow">Legislation</div><h1>Bill tracker</h1><p>Search bills by title, topic, sponsor, chamber, or status.</p></div></div>
      <div class="notice">For live records, use primary congressional sources. Demo records are clearly marked and exist so the interface remains usable before a data provider is configured.</div>
      <div class="toolbar"><input class="field" id="billFilter" placeholder="Search legislation…" value="${esc(state.query)}" /><select class="field" id="statusFilter"><option value="">All statuses</option><option>Introduced</option><option>Committee</option><option>Floor</option><option>Passed House</option></select><select class="field" id="topicFilter"><option value="">All topics</option>${[...new Set(state.bills.map(x=>x.topic))].map(x=>`<option>${esc(x)}</option>`).join("")}</select></div>
      <div class="card"><div class="tablewrap"><table class="table"><thead><tr><th>Bill</th><th>Topic</th><th>Status</th><th>Sponsor</th><th>Updated</th><th></th></tr></thead><tbody>${rows.map(b=>`<tr><td><strong>${esc(b.id)}</strong><small>${esc(b.title)}</small></td><td>${esc(b.topic)}</td><td><span class="tag blue">${esc(b.status)}</span></td><td>${esc(b.sponsor)}</td><td>${esc(b.updated)}</td><td><button class="btn" data-bill="${esc(b.id)}">Open</button></td></tr>`).join("") || '<tr><td colspan="6" class="empty">No bills found.</td></tr>'}</tbody></table></div></div>`;
  }

  function districtView() {
    return `<div class="hero"><div><div class="eyebrow">Find representation</div><h1>District Finder</h1><p>Enter a state and district to see matching records. This avoids guessing a user's location.</p></div></div>
      <div class="card"><div class="cardbody"><div class="formgrid"><div class="fieldgroup"><label>STATE</label><select class="field" id="districtState"><option value="">Choose a state</option>${[...new Set(state.members.map(x=>x.state))].sort().map(s=>`<option>${esc(s)}</option>`).join("")}</select></div><div class="fieldgroup"><label>DISTRICT</label><input class="field" id="districtNumber" placeholder="Example: 07" maxlength="2" /></div></div><div style="margin-top:14px"><button class="btn primary" data-action="find-district">Find representatives</button></div></div></div><div id="districtResults" style="margin-top:16px"></div>`;
  }

  function compareView() {
    const a=state.members.find(x=>x.id===state.compareA), b=state.members.find(x=>x.id===state.compareB);
    return `<div class="hero"><div><div class="eyebrow">Research comparison</div><h1>Compare members</h1><p>Side-by-side factual information. The app does not assign an overall winner or score.</p></div></div>
      <div class="card"><div class="cardbody"><div class="formgrid"><div class="fieldgroup"><label>MEMBER A</label><select class="field" id="compareA"><option value="">Choose member</option>${state.members.map(m=>`<option value="${esc(m.id)}" ${a?.id===m.id?"selected":""}>${esc(m.name)} · ${esc(m.state)}</option>`).join("")}</select></div><div class="fieldgroup"><label>MEMBER B</label><select class="field" id="compareB"><option value="">Choose member</option>${state.members.map(m=>`<option value="${esc(m.id)}" ${b?.id===m.id?"selected":""}>${esc(m.name)} · ${esc(m.state)}</option>`).join("")}</select></div></div></div></div>
      ${a&&b?compareTable(a,b):'<div class="card" style="margin-top:16px"><div class="empty">Choose two members to compare.</div></div>'}`;
  }
  function compareTable(a,b) {
    const rows=[["Role",a.role,b.role],["Party",a.party,b.party],["Chamber",a.chamber,b.chamber],["State",a.state,b.state],["District",a.district||"—",b.district||"—"],["Committees",a.committees||"—",b.committees||"—"],["Record updated",a.updated||"—",b.updated||"—"]];
    return `<div class="card" style="margin-top:16px"><div class="tablewrap"><table class="table"><thead><tr><th>Field</th><th>${esc(a.name)}</th><th>${esc(b.name)}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join("")}</tbody></table></div></div>`;
  }

  function savedView() {
    const ms=state.members.filter(m=>state.saved.includes("member:"+m.id));
    const bs=state.bills.filter(b=>state.saved.includes("bill:"+b.id));
    return `<div class="hero"><div><div class="eyebrow">Your research</div><h1>Watchlist</h1><p>Saved members and legislation for quick access.</p></div></div>
      <div class="grid two"><div class="card"><div class="cardhead"><h2>Members</h2></div><div class="cardbody"><div class="list">${ms.map(memberRow).join("")||'<div class="empty">No saved members.</div>'}</div></div></div><div class="card"><div class="cardhead"><h2>Legislation</h2></div><div class="cardbody"><div class="list">${bs.map(billRow).join("")||'<div class="empty">No saved bills.</div>'}</div></div></div></div>`;
  }

  function openMember(id) {
    const m=state.members.find(x=>x.id===id); if(!m)return;
    state.selectedMember=id;
    document.querySelector("#modal").innerHTML=`<div class="modalbox"><div class="cardhead"><h2>Member profile</h2><button class="close" data-close>×</button></div><div class="modalbody"><div class="profile"><div class="card profilebox"><div class="profileavatar">${esc(initials(m.name))}</div><h2>${esc(m.name)}</h2><p>${esc(m.role)} · ${esc(m.chamber)}</p><p>${esc(m.state)} ${m.district&&m.district!=="00"?"District "+esc(m.district):""}</p><div style="margin-top:15px"><button class="btn ${state.saved.includes("member:"+m.id)?"green":""}" data-save-member="${esc(m.id)}">${state.saved.includes("member:"+m.id)?"Saved":"Save member"}</button></div></div><div class="card profilebox"><div class="metric"><span>Party</span><strong>${esc(m.party)}</strong></div><div class="metric"><span>Committees</span><strong style="max-width:65%;text-align:right">${esc(m.committees||"—")}</strong></div><div class="metric"><span>Record updated</span><strong>${esc(m.updated||"—")}</strong></div><div style="margin-top:16px;color:var(--muted);font-size:12px;line-height:1.6">This profile is descriptive. It does not rate or rank the member.</div></div></div></div></div>`;
    document.querySelector("#modal").classList.add("open"); bindModal();
  }
  function openBill(id) {
    const b=state.bills.find(x=>x.id===id); if(!b)return;
    document.querySelector("#modal").innerHTML=`<div class="modalbox"><div class="cardhead"><h2>${esc(b.id)}</h2><button class="close" data-close>×</button></div><div class="modalbody"><span class="tag blue">${esc(b.status)}</span><h2 style="margin:12px 0 8px">${esc(b.title)}</h2><p style="color:var(--muted);line-height:1.6">${esc(b.summary)}</p><div class="metric"><span>Topic</span><strong>${esc(b.topic)}</strong></div><div class="metric"><span>Chamber</span><strong>${esc(b.chamber)}</strong></div><div class="metric"><span>Sponsor</span><strong>${esc(b.sponsor)}</strong></div><div class="metric"><span>Updated</span><strong>${esc(b.updated)}</strong></div><div style="margin-top:16px"><button class="btn ${state.saved.includes("bill:"+b.id)?"green":""}" data-save-bill="${esc(b.id)}">${state.saved.includes("bill:"+b.id)?"Saved to watchlist":"Save to watchlist"}</button></div></div></div>`;
    document.querySelector("#modal").classList.add("open"); bindModal();
  }

  function bindModal() {
    document.querySelector("[data-close]")?.addEventListener("click",()=>document.querySelector("#modal").classList.remove("open"));
    document.querySelector("[data-save-member]")?.addEventListener("click",e=>saveItem("member",e.currentTarget.dataset.saveMember));
    document.querySelector("[data-save-bill]")?.addEventListener("click",e=>saveItem("bill",e.currentTarget.dataset.saveBill));
  }

  function bind() {
    document.querySelectorAll("[data-nav]").forEach(x=>x.addEventListener("click",()=>{state.view=x.dataset.nav;document.querySelector("#sidebar")?.classList.remove("open");render()}));
    document.querySelectorAll("[data-member]").forEach(x=>x.addEventListener("click",()=>openMember(x.dataset.member)));
    document.querySelectorAll("[data-bill]").forEach(x=>x.addEventListener("click",()=>openBill(x.dataset.bill)));
    const gs=document.querySelector("#globalSearch"); if(gs){gs.addEventListener("input",e=>{state.query=e.target.value;if(["members","bills"].includes(state.view))render()});gs.addEventListener("keydown",e=>{if(e.key==="Enter"){state.view="members";render()}})}
    document.querySelector("#mobileMenu")?.addEventListener("click",()=>document.querySelector("#sidebar").classList.toggle("open"));
    document.querySelector("#memberFilter")?.addEventListener("input",e=>{state.query=e.target.value;render()});
    document.querySelector("#billFilter")?.addEventListener("input",e=>{state.query=e.target.value;render()});
    document.querySelector("#partyFilter")?.addEventListener("change",e=>filterMembers(e.target.value,document.querySelector("#chamberFilter").value));
    document.querySelector("#chamberFilter")?.addEventListener("change",e=>filterMembers(document.querySelector("#partyFilter").value,e.target.value));
    document.querySelector("#compareA")?.addEventListener("change",e=>{state.compareA=e.target.value;render()});
    document.querySelector("#compareB")?.addEventListener("change",e=>{state.compareB=e.target.value;render()});
    document.querySelector("[data-action='find-district']")?.addEventListener("click",findDistrict);
    document.querySelector("[data-action='compare-pick']")?.addEventListener("click",()=>{state.view="compare";render()});
  }

  function filterMembers(party,chamber){
    const q=state.query.toLowerCase();
    const all=state.members.filter(m=>[m.name,m.state,m.party,m.chamber,m.role,m.committees].join(" ").toLowerCase().includes(q));
    state.members=all.filter(m=>(!party||m.party===party)&&(!chamber||m.chamber===chamber));
    render();
    state.members=[...demoMembers];
    if(sb) loadData().then(()=>{});
  }

  function findDistrict(){
    const s=document.querySelector("#districtState").value, d=document.querySelector("#districtNumber").value.padStart(2,"0");
    const rows=state.members.filter(m=>m.state===s && (m.chamber==="Senate" || m.district===d));
    document.querySelector("#districtResults").innerHTML=`<div class="card"><div class="cardhead"><h2>Matching records</h2></div><div class="cardbody"><div class="list">${rows.map(memberRow).join("")||'<div class="empty">No matching member was found in the current dataset.</div>'}</div></div></div>`;
    bind();
  }

  function toast(msg){const el=document.createElement("div");el.className="toast";el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2300)}
  function render(){layout()}
  state.saved=JSON.parse(localStorage.getItem("congressional_saved")||"[]");
  loadData().then(render);
})();