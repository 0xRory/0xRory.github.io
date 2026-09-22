/**
 * English / Traditional Chinese toggle.
 *
 * Scope, deliberately: every [data-i18n] element's innerHTML is swapped.
 * The big pixel-display headlines (.hero__title, .section__title) are NOT
 * in that set — --ff-display (Pixelify Sans) is Latin-only with no CJK
 * fallback, so those stay as stylized English wordmarks in both languages,
 * the same way a brand logotype usually doesn't get re-set per locale.
 * Everything that actually carries information — nav, body copy, resume,
 * tags, case studies — is translated.
 *
 * Mechanism mirrors themeToggle() in ui.js: a data-lang attribute on
 * <html>, persisted to localStorage, restored on load. No routing, no
 * separate URLs — single canonical page, matching CLAUDE.md.
 */

const DICT = {
  'skip.work': { en: 'Skip to work', zh: '跳至作品區' },
  'nav.mark': { en: 'Rory — top of page', zh: 'Rory — 回到頂端' },
  'nav.work': { en: 'Work', zh: '作品' },
  'nav.about': { en: 'About', zh: '關於' },
  'nav.resume': { en: 'Resume', zh: '履歷' },
  'nav.writing': { en: 'Writing', zh: '文章' },
  'nav.contact': { en: 'Contact', zh: '聯絡' },
  'nav.theme': { en: 'Switch colour theme', zh: '切換配色主題' },
  'nav.lang': { en: '中', zh: 'EN' },
  'nav.langAria': { en: 'Switch to Chinese', zh: 'Switch to English' },

  'hero.lede': {
    en: "Full-stack engineer in Taichung, Taiwan. I build blockchain backends and AI-powered products, and I'm currently deepening my AI engineering skills alongside smart-contract security and phishing research.",
    zh: '全端工程師，現居台灣台中。我打造區塊鏈後端與 AI 應用產品，目前正在深化 AI 工程技能，同時持續投入智能合約安全與釣魚攻擊研究。',
  },
  'hero.btnWork': { en: 'View work', zh: '查看作品' },
  'hero.btnWriting': { en: '&gt; read writing', zh: '&gt; 閱讀文章' },

  'cat.all': { en: 'All', zh: '全部' },
  'cat.website': { en: 'Website', zh: '網站' },
  'cat.aiApp': { en: 'AI App', zh: 'AI 應用' },
  'cat.security': { en: 'Security', zh: '資安' },
  'cat.web3Dapp': { en: 'Web3 / DApp', zh: 'Web3 / DApp' },
  'cat.appIot': { en: 'App / IoT', zh: 'App / IoT' },
  'cat.commerceApp': { en: 'Commerce App', zh: '電商 App' },
  'cat.backend': { en: 'Backend', zh: '後端' },
  'cat.enterprise': { en: 'Enterprise', zh: '企業系統' },

  'work.label': { en: '[01] Selected work', zh: '[01] 精選作品' },
  'work.cta.viewCase': { en: 'view case &rarr;', zh: '查看案例 &rarr;' },
  'work.cta.visitSite': { en: 'visit site &nearr;', zh: '造訪網站 &nearr;' },

  'about.label': { en: '[02] Background', zh: '[02] 背景' },
  'about.lede': {
    en: 'Jack of all trades, a versatile engineer. Besides day-to-day front-end and back-end work, mobile and desktop development, I am deeply interested in Web3, blockchain and AI.',
    zh: '樣樣通的多面向工程師。除了日常的前後端開發、行動裝置與桌面應用開發之外，我對 Web3、區塊鏈與 AI 有著濃厚興趣。',
  },
  'about.body': {
    en: 'Right now I am focused on raising awareness about Web3 security — studying phishing incidents and writing them up, and keeping current with the latest smart-contract security work. I also help organise events and co-learning sessions for the DeFiHackLabs community.',
    zh: '目前我專注於推廣 Web3 資安意識——研究釣魚攻擊事件並撰寫分析文章，同時持續關注智能合約安全的最新發展。我也協助 DeFiHackLabs 社群籌辦活動與共學課程。',
  },
  'about.languagesHeading': { en: 'Languages', zh: '語言' },
  'about.frameworksHeading': { en: 'Frameworks', zh: '框架' },
  'about.aiToolsHeading': { en: 'AI Tools', zh: 'AI 工具' },
  'about.agentsLabel': { en: 'Agents', zh: '代理工具' },

  'resume.label': { en: '[03] History', zh: '[03] 經歷' },
  'resume.experienceHeading': { en: 'Experience', zh: '工作經驗' },
  'resume.educationHeading': { en: 'Education', zh: '學歷' },
  'resume.present': { en: 'Present', zh: '至今' },
  'resume.dandelion.text': {
    en: 'Full-stack engineer on MAXO, an AI business &amp; marketing platform — redesigned AI report generation into an async Cloud Tasks worker queue (cooperative cancellation, failure isolation), evaluated and shipped local OCR vision models, and improved LLM prompt-cache hit rates across OpenAI, Anthropic and Gemini.',
    zh: '負責 MAXO（AI 商業與行銷平台）的全端開發——將 AI 報告產出重構為非同步 Cloud Tasks worker 佇列（可取消、失敗隔離），評估並上線地端 OCR 視覺模型，並改善 OpenAI、Anthropic、Gemini 的 LLM prompt 快取命中率。',
  },
  'resume.acemeta.text': {
    en: 'RPC backend services, CI/CD, and scaling concurrency from 100 to 1000.',
    zh: 'RPC 後端服務、CI/CD 建置，並將併發量從 100 擴展至 1000。',
  },
  'resume.yile.text': {
    en: 'Web3 and game backends. ETH / Polygon / Tron USDT payment rails.',
    zh: 'Web3 與遊戲後端開發，負責 ETH／Polygon／Tron USDT 金流串接。',
  },
  'resume.shoesconn.text': {
    en: 'Led a team of five building IoT web and mobile applications.',
    zh: '帶領五人團隊開發 IoT 相關網站與行動應用程式。',
  },
  'resume.smartecare.text': {
    en: 'Research and system architecture for connected-care products.',
    zh: '負責遠距照護產品的研究與系統架構設計。',
  },
  'resume.kuangtien.text': {
    en: 'Hospital information systems, integration and in-house tooling.',
    zh: '醫院資訊系統開發、系統整合與內部工具建置。',
  },
  'resume.tunghai.text': { en: 'Institute of Information Engineering', zh: '資訊工程研究所' },
  'resume.lingtung.text': { en: 'Department of Information Management', zh: '資訊管理學系' },

  'writing.label': { en: '[04] Notes &amp; talks', zh: '[04] 筆記與分享' },
  'writing.unphishable.title': {
    en: 'Unphishable, the Phishing Experience Platform: Seeing Through Web3 Scams!',
    zh: '釣魚體驗平台 Unphishable：識破 Web3 詐騙陷阱！',
  },
  'writing.solidityCoLearning.title': {
    en: 'DeFiHackLabs x WTF Academy — Solidity 21-day co-learning',
    zh: 'DeFiHackLabs x WTF Academy — Solidity 21 天共學計畫',
  },
  'writing.phishingEvolution.title': {
    en: 'Exploring the Evolution of Phishing Attacks: From Web2 to Web3',
    zh: '探索釣魚攻擊的演變：從 Web2 到 Web3',
  },
  'writing.viem.title': { en: 'Introducing Viem', zh: 'Viem 介紹' },
  'writing.viem.source': { en: 'iThome Ironman', zh: 'iThome <span lang="zh-Hant-TW">鐵人賽</span>' },
  'writing.web2to3notes.title': {
    en: 'Web2 to Web3 Learning Notes',
    zh: 'Web2 to Web3 學習筆記',
  },
  'writing.solidityPlan.title': { en: 'Solidity Learning Plan', zh: 'Solidity 學習計畫' },

  'contact.label': { en: '[05] Get in touch', zh: '[05] 聯絡方式' },
  'contact.where': { en: 'Taichung, Taiwan', zh: '台灣．台中' },

  'footer.built': {
    en: '',
    zh: ''
  },

  // ── case studies ──────────────────────────────────────────────────

  'case.csbs.spec': {
    en: 'Community SBT Basket and Seal &mdash; a free, open-source SBT DApp that helps communities and multi-identity individuals issue and manage soulbound tokens tied to community events and activities.',
    zh: 'Community SBT Basket and Seal：一款免費開源的 SBT DApp，幫助社區和多重身份的個體來發行和管理分散於各個社區 Event、Activity 的靈魂綁定代幣（SBT）。',
  },
  'case.csbs.p2': {
    en: 'Core feature: batch-issuing SBTs and managing community-event participation.',
    zh: '主要實作：批次發放 SBT，以及社區活動的管理。',
  },
  'case.csbs.ref': { en: 'Reference:', zh: '可以參考：' },

  'case.ilolly.spec': {
    en: 'An IoT solution combining facial-recognition thermometers with temperature/humidity sensors, deployed across school campuses.',
    zh: '利用 IOT 人臉溫度機＋溫濕度傳感器整合在校園裡面。',
  },
  'case.ilolly.p2': {
    en: 'Stack: cloud servers, a message-buffer layer, an admin backend, a database, IoT devices, and a mobile app with push notifications.',
    zh: '施作技術：雲端伺服器＋中繼資料緩衝區＋後台＋資料庫＋IOT＋APP（推播通知）。',
  },
  'case.ilolly.p3': {
    en: 'The IoT middleware is built on the open-source <a href="https://thingsboard.io/docs/getting-started-guides/what-is-thingsboard/" target="_blank">thingsboard</a> platform.',
    zh: 'IOT 中台是使用 <a href="https://thingsboard.io/docs/getting-started-guides/what-is-thingsboard/" target="_blank">thingsboard</a> 開源軟體施作。',
  },
  'case.ilolly.fig1': { en: 'Flow architecture', zh: '流程架構' },

  'case.areadrop.p1': {
    en: "A Java/Android practice project modelled on Apple's AirDrop &mdash; hence the name AreaDrop.",
    zh: '主要是練習 Java 和 Android 並模仿 Apple Mac 的 AirDrop，所以功能名稱命名為 AreaDrop。',
  },
  'case.areadrop.p2': {
    en: "Configuring a device's IoT network is usually a hassle, so this sets it up straight from the phone, using WebSocket for transfer.",
    zh: '通常設定裝置 IOT 網路都非常麻煩，所以使用手機去設定！另外使用 WebSocket 來做傳輸。',
  },
  'case.areadrop.fig1': { en: 'Concept architecture', zh: '概念架構' },
  'case.areadrop.p3': { en: "Below: configuring the server network from the phone.", zh: '下列展示手機設定伺服器網路' },
  'case.areadrop.p4': { en: 'Below: cross-platform file transfer (phone &harr; computer).', zh: '下列展示跨平台傳輸檔案（手機、電腦）。' },

  'case.crazyg.fig1': { en: 'Screens', zh: '呈現畫面' },
  'case.crazyg.fig2': { en: 'Points redemption', zh: '點數兌換' },

  'case.airweb.p1': {
    en: "Visualised sensor data from Chunghwa Telecom's IoT smart-network platform for Taiwan's Environmental Protection Administration.",
    zh: '主要是串接中華電信 IoT 智慧聯網大平台之感測資料於環保署做呈現。',
  },
  'case.airweb.spec': {
    en: 'Joined the project in October 2018 to integrate IoT air-quality sensors.<br>Backend in Python with the Django framework.<br>NGINX serving the app via uWSGI, with a REST framework API layer.<br>Ops tooling: supervisor and Crontab.<br>Given the heavy daily data volume (3&ndash;10 GB), monitored server health and DB capacity with Zabbix, visualised in Grafana.',
    zh: '2018 年 10 月有機會合作串接 IOT 設備在做空氣污染資料介接。<br>主要使用 Python 為後端開發語言，使用 Django 來作為後端開發框架。<br>網頁伺服器使用：NGINX，與其串接使用 uWSGI，另外 API 建立框架使用 REST framework。<br>管理服務及排程工具：supervisor、Crontab<br>因每天資料量非常大 3G～10G，故使用監控軟體（ZABBIX）來監控伺服器狀況及 DB 容量，呈現則使用（Grafana）。',
  },
  'case.airweb.fig1': { en: 'System architecture', zh: '系統架構' },
  'case.airweb.time': { en: 'Oct 2018 &ndash; Mar 2019', zh: '2018 年 10 月－2019 年 3 月' },

  'case.bloodbank.p1': {
    en: 'Moved blood-bag verification onto mobile. Blood bags are time-sensitive, so this confirms each hand-off checkpoint during transport by phone &mdash; ward staff scan an ID badge plus the bag’s barcode to confirm pickup.',
    zh: '血袋核對手機化，血袋都是有時效性的，透過手機做血液傳送時關卡的確認，病服員使用『識別證』＋血袋條碼，確定寫待領取。',
  },
  'case.bloodbank.spec': {
    en: 'Packaged as a mobile app with Cordova.<br>Frontend: AngularJS 1.5.<br>Backend: ASP.NET MVC 5, LINQ, Dapper, C# 6.0.',
    zh: '主要使用 Cordova 將網頁包成 App<br>前端使用：AngularJS 1.5<br>後端使用：ASP.Net MVC 5、Linq、Dapper、C# 6.0',
  },
  'case.bloodbank.fig1': { en: 'Flow architecture', zh: '流程架構' },
  'case.bloodbank.fig2': { en: 'Login screen', zh: '登入畫面' },
  'case.bloodbank.fig3': { en: 'Cross-match form screen', zh: '合血單資訊畫面' },
  'case.bloodbank.fig4': { en: 'Cross-match confirmation screen', zh: '合血單確認畫面' },
  'case.bloodbank.time': { en: 'May 2017 &ndash; Jun 2017', zh: '2017 年 5 月－2017 年 6 月' },

  'case.maxo.spec': {
    en: 'MAXO is an AI business &amp; marketing operating system for small and mid-sized businesses &mdash; the product’s own positioning is &ldquo;<span lang="zh-Hant-TW">麥肯錫 + 4A 數位創意總監</span>&rdquo; (a virtual McKinsey plus a 4A digital creative director): a strategy module, a marketing-expert module, and a &ldquo;virtual Art Director&rdquo; for on-brand creative generation, all backed by an agent + LLM architecture.',
    zh: 'MAXO 是專為中小企業打造的 AI 商業與行銷作業系統——官方定位為「<span lang="zh-Hant-TW">麥肯錫 + 4A 數位創意總監</span>」：結合策略顧問模組、行銷專家模組，以及負責產出品牌一致創意內容的「虛擬藝術總監」，背後由 Agent + LLM 架構驅動。',
  },
  'case.maxo.p2': {
    en: 'Built and shipped the Django/DRF backend and the React frontend and admin console over nine months at Dandelion (<span lang="zh-Hant-TW">蒲公英</span>). The platform routes requests across multiple LLM providers (OpenAI, Gemini) for cost and reliability, stores content and media on PostgreSQL and Google Cloud Storage, and deploys to GCP Cloud Run via Docker.',
    zh: '在蒲公英（<span lang="zh-Hant-TW">Dandelion</span>）任職的九個月間，負責開發並上線 Django/DRF 後端，以及 React 前端與後台管理介面。平台會依成本與穩定性將請求分派至多個 LLM 供應商（OpenAI、Gemini），內容與媒體儲存於 PostgreSQL 與 Google Cloud Storage，並透過 Docker 部署至 GCP Cloud Run。',
  },
  'case.maxo.p3': {
    en: "Later work focused on reliability and cost. Long report jobs used to hit Cloud Run's 15-minute wall and retry-storm; I moved generation onto an async Cloud Tasks worker queue with atomic progress reporting, per-subtask failure isolation, and cooperative cancellation, then extended the worker timeout to 30 minutes with a matching dispatch deadline. On cost, I found the system prompt's per-second timestamp was defeating provider-side prompt caching, fixed it to date-level granularity, and instrumented real cache-hit-rate logging across OpenAI, Anthropic and Gemini. I also evaluated self-hosted vision-language OCR models for document extraction &mdash; migrating from qwen3-vl-32b to chandra &mdash; and added per-page field extraction to cut data loss on long documents.",
    zh: '後期工作聚焦於穩定性與成本。長報告任務原本會撞上 Cloud Run 15 分鐘的執行上限而觸發重試風暴，我將報告產出改為非同步 Cloud Tasks worker 佇列，加入原子式進度回報、子任務失敗隔離與可取消機制，並將 worker timeout 延長至 30 分鐘並對齊 dispatch deadline。成本方面，我發現系統提示詞中的秒級時間戳會讓各家 LLM 供應商的 prompt caching 完全失效，改為日期級粒度後修正，並為 OpenAI、Anthropic、Gemini 加上實際快取命中率的記錄。我也評估了地端視覺語言 OCR 模型的文件擷取效果——將模型從 qwen3-vl-32b 遷移至 chandra，並加入逐頁欄位抽取以降低長文件的資料遺失。',
  },
  'case.maxo.p4': {
    en: 'Below: the AI advisor pipeline running a full health-check end-to-end &mdash; the async worker queue from above, live.',
    zh: '以下：AI 顧問團隊完整跑一次企業健檢報告產出流程——也就是上述非同步 worker 佇列的實際運作畫面。',
  },
  'case.maxo.fig1': { en: 'AI health-check report, in progress', zh: 'AI 企業健檢報告產出中' },
  'case.liveAt': { en: 'Live at:', zh: '官方網站：' },

  'case.unphishable.spec': {
    en: 'Unphishable is an interactive Web3 anti-phishing training platform &mdash; 30+ gamified challenges covering seed-phrase scams, malicious token approvals, fake airdrops, clipboard hijacking, and punycode look-alike domains, in English and Traditional/Simplified Chinese. Built as a public good: free for anyone to use.',
    zh: 'Unphishable 是一個互動式 Web3 反釣魚訓練平台——超過 30 個遊戲化關卡，涵蓋助記詞詐騙、惡意代幣授權、假空投、剪貼簿綁架、同形異義網域（punycode）等攻擊手法，支援英文與繁／簡體中文，並以公共財為定位，完全免費開放使用。',
  },
  'case.unphishable.p2': {
    en: 'Core team: <a href="https://github.com/DeFiHackLabs" target="_blank" rel="noopener">DeFiHackLabs</a>, ScamSniffer, and SlowMist, with support from the Ethereum Ecosystem Support Program. I contribute through DeFiHackLabs, the same Web3 security co-learning community behind the Solidity 21-day program listed under Writing.',
    zh: '核心團隊：<a href="https://github.com/DeFiHackLabs" target="_blank" rel="noopener">DeFiHackLabs</a>、ScamSniffer、SlowMist，並獲得 Ethereum Ecosystem Support Program 支持。我透過 DeFiHackLabs 參與貢獻——也就是「文章」區塊中 Solidity 21 天共學計畫背後的同一個 Web3 安全社群。',
  },
  'case.talk': { en: 'Talk:', zh: '議程影片：' },

  'case.offgrid.spec': {
    en: 'OFF GRID is a live-event and fan-club ticketing platform for the Asia-Pacific fan market &mdash; &ldquo;events that connect IRL&rdquo; &mdash; covering seat-map ticket sales, livestream tickets, fan-club membership and voting, and blockchain-recorded &ldquo;performance pass&rdquo; event financing.',
    zh: 'OFF GRID 是專為亞太粉絲市場打造的實體活動暨後援會售票平台——「events that connect IRL」——涵蓋選位購票、線上直播票、後援會會籍與投票，以及區塊鏈紀錄的「performance pass」活動募資機制。',
  },
  'case.offgrid.p2': {
    en: 'I own two of its Go backend services: the ticketing API (Hertz, JWT, Redis, MySQL/GORM) handling orders, seat maps and payments, and the identity service (Gin) covering Apple Sign-In, SMS one-time codes via Alibaba Cloud, and per-user custodial Ethereum wallet provisioning that backs the on-chain performance pass. I also contribute to the Next.js web platform shared by its global and China-market storefronts.',
    zh: '我負責其中兩個 Go 後端服務：票務 API（Hertz、JWT、Redis、MySQL/GORM），處理訂單、選位與金流；以及身分服務（Gin），涵蓋 Apple 登入、透過阿里雲發送的簡訊驗證碼，以及為每位使用者建立代管以太坊錢包，作為鏈上 performance pass 的載體。我也參與 Next.js 網站平台的開發，同時支援其海外與中國兩個市場站點。',
  },
  'case.iosApp': { en: 'iOS app:', zh: 'iOS App：' },
  'case.androidApp': { en: 'Android app:', zh: 'Android App：' },
};

export function initI18n() {
  const root = document.documentElement;
  let stored = null;
  try { stored = localStorage.getItem('lang'); } catch { /* private mode */ }
  const lang = stored === 'zh' ? 'zh' : 'en'; // English is canonical/default
  apply(lang);

  const btn = document.querySelector('[data-lang-toggle]');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const next = root.dataset.lang === 'zh' ? 'en' : 'zh';
    apply(next);
    try { localStorage.setItem('lang', next); } catch { /* ignore */ }
    // Fonts didn't change, but line lengths did — every ScrollTrigger's
    // start/end needs re-measuring the same way a font swap does.
    window.gsap?.core?.globals?.()?.ScrollTrigger?.refresh?.();
  });
}

function apply(lang) {
  const root = document.documentElement;
  root.dataset.lang = lang;
  root.lang = lang === 'zh' ? 'zh-Hant-TW' : 'en';

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const entry = DICT[el.dataset.i18n];
    if (!entry) { console.warn('i18n: missing key', el.dataset.i18n); return; }
    el.innerHTML = entry[lang];
  });

  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const entry = DICT[el.dataset.i18nAria];
    if (!entry) { console.warn('i18n: missing aria key', el.dataset.i18nAria); return; }
    el.setAttribute('aria-label', entry[lang]);
  });

  const btn = document.querySelector('[data-lang-toggle]');
  if (btn) {
    btn.textContent = DICT['nav.lang'][lang];
    btn.setAttribute('aria-label', DICT['nav.langAria'][lang]);
  }
}
