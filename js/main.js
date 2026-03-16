/**
 * 十三香小龙虾 — 官方宣传网站交互脚本
 * Restructured: 8-section conversion architecture
 */

(function () {
  'use strict';

  // ═══════════════ Loading Screen ═══════════════
  const loader = document.getElementById('loader');
  if (loader) {
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('hidden'), 2000);
    });
    setTimeout(() => loader.classList.add('hidden'), 4000);
  }

  // ═══════════════ Theme Toggle ═══════════════
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const saved = localStorage.getItem('theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
      themeToggle.textContent = saved === 'light' ? '🌙' : '☀️';
    }
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      themeToggle.textContent = next === 'light' ? '🌙' : '☀️';
    });
  }

  // ═══════════════ Global Flags ═══════════════
  const isMobile = window.innerWidth < 768;

  // ═══════════════ Particle System ═══════════════
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouseX = 0, mouseY = 0;
    let width, height;

    function resize() {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3 - 0.15;
        this.opacity = Math.random() * 0.5 + 0.1;
        const colors = ['255,51,51', '255,215,0', '139,92,246', '255,120,50'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.life = Math.random() * 300 + 200;
        this.age = 0;
      }
      update() {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) { this.x -= dx * 0.008; this.y -= dy * 0.008; }
        this.x += this.speedX;
        this.y += this.speedY;
        this.age++;
        if (this.age > this.life || this.x < -10 || this.x > width + 10 || this.y < -10 || this.y > height + 10) {
          this.reset(); this.y = height + 5;
        }
      }
      draw() {
        const fade = 1 - this.age / this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color},${this.opacity * fade})`;
        ctx.fill();
      }
    }

    function initParticles() {
      resize();
      const maxP = isMobile ? 40 : 200;
      const divisor = isMobile ? 20000 : 8000;
      const count = Math.min(Math.floor((width * height) / divisor), maxP);
      particles = [];
      for (let i = 0; i < count; i++) particles.push(new Particle());
    }

    function drawConnections() {
      if (isMobile) return;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const opacity = (1 - dist / 100) * 0.06;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,100,80,${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => { p.update(); p.draw(); });
      drawConnections();
      requestAnimationFrame(animate);
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    window.addEventListener('resize', resize);
    initParticles();
    animate();
  }

  // ═══════════════ Scroll Reveal ═══════════════
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add('revealed'), delay * 120);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  revealElements.forEach(el => revealObserver.observe(el));

  // ═══════════════ Counter Animation ═══════════════
  const counterElements = document.querySelectorAll('[data-target]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counterElements.forEach(el => counterObserver.observe(el));

  function animateCounter(el, target) {
    const duration = 1800;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(target * eased);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  // ═══════════════ Navigation ═══════════════
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const sections = document.querySelectorAll('.section, .hero');
  const navLinkEls = document.querySelectorAll('.nav-link:not(.nav-link--cta)');
  const scrollProgressBar = document.getElementById('scrollProgress');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollProgressBar && docHeight > 0) {
      scrollProgressBar.style.width = ((scrollTop / docHeight) * 100) + '%';
    }
    let current = '';
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 200 && rect.bottom > 200) current = section.id;
    });
    navLinkEls.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }, { passive: true });

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  // ═══════════════ Showcase Tab Switching ═══════════════
  const showcaseTabs = document.querySelectorAll('.showcase-tab');
  const showcasePanels = document.querySelectorAll('.showcase-panel');

  showcaseTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      showcaseTabs.forEach(t => {
        t.classList.remove('showcase-tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('showcase-tab--active');
      tab.setAttribute('aria-selected', 'true');

      showcasePanels.forEach(panel => {
        if (panel.dataset.panel === target) {
          panel.classList.add('showcase-panel--active');
          panel.style.animation = 'none';
          panel.offsetHeight;
          panel.style.animation = '';
        } else {
          panel.classList.remove('showcase-panel--active');
        }
      });
    });
  });

  // ═══════════════ Skill Category Filter ═══════════════
  const skillCats = document.querySelectorAll('.skill-cat');
  const skillCards = document.querySelectorAll('.skill-card');

  skillCats.forEach(btn => {
    btn.addEventListener('click', () => {
      skillCats.forEach(b => b.classList.remove('skill-cat--active'));
      btn.classList.add('skill-cat--active');
      const cat = btn.dataset.cat;
      skillCards.forEach(card => {
        if (cat === 'all' || card.dataset.cat === cat) card.classList.remove('hidden');
        else card.classList.add('hidden');
      });
    });
  });

  // ═══════════════ Router Mode Toggle ═══════════════
  const routerModes = document.querySelectorAll('.router-mode');
  routerModes.forEach(mode => {
    mode.addEventListener('click', () => {
      routerModes.forEach(m => m.classList.remove('router-mode--active'));
      mode.classList.add('router-mode--active');
    });
  });

  // ═══════════════ Smooth Scroll ═══════════════
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ═══════════════ Back to Top ═══════════════
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 600);
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ═══════════════ Router Node Hover ═══════════════
  const routerNodes = document.querySelectorAll('.router-node');
  routerNodes.forEach(node => {
    node.addEventListener('mouseenter', () => {
      routerNodes.forEach(n => { if (n !== node) n.style.opacity = '0.4'; });
    });
    node.addEventListener('mouseleave', () => {
      routerNodes.forEach(n => n.style.opacity = '1');
    });
  });

  // ═══════════════ i18n Language Switch ═══════════════
  const i18nData = {
    en: {
      'nav.features': 'Features', 'nav.showcase': 'Showcase', 'nav.proof': 'Testimonials',
      'nav.quickstart': 'Quick Start', 'nav.faq': 'FAQ', 'nav.community': 'Community',
      'nav.cta': 'Get Started',
      'features.title': 'Every Spice, a Superpower',
      'showcase.title': 'Deep Dive into Each Spice',
      'proof.title': 'Data Speaks, Users Vouch',
      'desktop.title': 'AI Controls Your Computer',
      'workflow.title': 'Drag & Drop Workflows',
      'hero.badge': 'Open Source · Free · All-in-One',
      'hero.title': 'ShiSanXiang',
      'hero.slogan': '13 Spices, One AI Empire',
      'hero.desc': 'Full-stack AI Assistant Platform — 13+ LLM Smart Routing · 63+ Built-in Skills · WeChat Automation<br>Remote Desktop Control · Visual Workflow · Cross-platform',
      'hero.cta1': '🚀 Get Started', 'hero.cta2': 'Learn More ↓',
      'qs.title': '5 Minutes, Zero to Launch',
      'qs.desc': 'Three commands, and the whole pot is served',
      'faq.title': 'FAQ',
      'faq.desc': 'Soul-searching questions before eating crayfish — all answered here',
      'faq.q1': 'What exactly is ShiSanXiang? How is it different from ChatGPT?',
      'faq.a1': 'ChatGPT is one model; we are a <strong>platform</strong>. ShiSanXiang integrates 13+ AI models (including ChatGPT), plus voice engine, WeChat automation, remote desktop, workflow engine, and 63+ skills — all self-hosted with your data under your control.',
      'faq.q2': 'Is it really 100% free? Any hidden costs?',
      'faq.a2': 'The software is MIT open-source, <strong>100% free</strong>. You only pay for your own AI API keys (OpenAI, DeepSeek, etc.). Our smart router auto-selects the cheapest model — saving up to 70% on tokens.',
      'faq.q3': 'I don\'t know code. Can I still use it?',
      'faq.a3': 'Yes! We provide a <strong>Windows one-click installer</strong>, Docker one-click deploy, and a visual drag-and-drop workflow editor.',
      'faq.q4': 'Will WeChat automation get my account banned?',
      'faq.a4': 'We have a <strong>3-layer anti-risk system</strong>: random delays, smart frequency limits, and keyword blocking. Plus a "manual review" mode.',
      'faq.q5': 'Which AI models are supported?',
      'faq.a5': 'We support <strong>13+ AI providers</strong>: OpenAI, Anthropic, Google, DeepSeek, Zhipu, Qwen, Baidu, Moonshot, Yi, Groq, Mistral, Ollama, and more.',
      'faq.q6': 'Is my data safe?',
      'faq.a6': '<strong>All data stays on your own server</strong>. We collect zero user data. Code is fully open-source for audit.',
      'community.title': 'Join the Crayfish Gang',
      'community.desc': 'Every feature comes from real user needs — let\'s build the AI future together',
    },
    zh: {
      'nav.features': '核心能力', 'nav.showcase': '功能展示', 'nav.proof': '用户口碑',
      'nav.quickstart': '快速上手', 'nav.faq': 'FAQ', 'nav.community': '社群',
      'nav.cta': '立即体验',
      'hero.badge': '开源 · 免费 · 全能',
      'hero.title': '十三香小龙虾',
      'hero.slogan': '一壶十三香，煮沸 AI 江湖',
      'hero.desc': '全栈式 AI 智能助手平台 — 13+ 大模型智能路由 · 63+ 内置超能技能 · 微信自动化帝国<br>远程桌面控制 · 可视化工作流 · 全平台覆盖',
      'hero.cta1': '🚀 开始使用', 'hero.cta2': '了解更多 ↓',
    }
  };

  let currentLang = localStorage.getItem('lang') || 'zh';
  const langBtn = document.getElementById('langToggle');

  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    if (langBtn) langBtn.textContent = lang === 'zh' ? 'EN' : '中文';
    const strings = i18nData[lang];
    if (!strings) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (strings[key]) el.textContent = strings[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      if (strings[key]) el.innerHTML = strings[key];
    });
  }

  if (langBtn) {
    langBtn.addEventListener('click', () => applyLang(currentLang === 'zh' ? 'en' : 'zh'));
  }
  if (currentLang === 'en') applyLang('en');

  // ═══════════════ Copy Button Feedback ═══════════════
  document.querySelectorAll('.cta-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const original = btn.textContent;
      btn.textContent = 'OK';
      btn.style.color = '#07c160';
      btn.style.borderColor = '#07c160';
      setTimeout(() => {
        btn.textContent = original;
        btn.style.color = '';
        btn.style.borderColor = '';
      }, 2000);
    });
  });

  // ═══════════════ Interactive Chat Demo ═══════════════
  const chatBody = document.getElementById('demoChatBody');
  const inputText = document.getElementById('demoInputText');
  const replayBtn = document.getElementById('demoReplay');

  if (chatBody) {
    const chatScript = [
      { type: 'user', text: '你好小龙 👋', cap: 'wake', delay: 600 },
      { type: 'typing', delay: 1200 },
      { type: 'ai', text: '你好呀！我是十三香小龙虾，你的 AI 全能管家 🦞 有什么我能帮你的吗？', delay: 0 },
      { type: 'pause', delay: 1800 },
      { type: 'user', text: '今天北京天气怎么样？', cap: 'skill', delay: 600 },
      { type: 'typing', delay: 1000 },
      { type: 'skill', name: '天气查询', icon: '🌤️', delay: 0 },
      { type: 'ai', text: '北京今天晴 ☀️，气温 18-26°C，空气质量良好。\n适合户外活动，建议穿薄外套~', delay: 0 },
      { type: 'pause', delay: 2000 },
      { type: 'user', text: '帮我给张总发条微信，说下午3点开会', cap: 'wechat', delay: 600 },
      { type: 'typing', delay: 1500 },
      { type: 'skill', name: '微信发送', icon: '💬', delay: 0 },
      { type: 'ai', text: '已通过微信发送给「张总」：\n"张总您好，下午3点会议室见，材料已准备好。" ✅', delay: 0 },
      { type: 'pause', delay: 2000 },
      { type: 'user', text: '给我写首诗，主题是春天', cap: 'creative', delay: 600 },
      { type: 'typing', delay: 2000 },
      { type: 'skill', name: '诗词创作', icon: '✍️', delay: 0 },
      { type: 'ai', text: '春风又绿江南岸，\n桃李芬芳满目新。\n蝴蝶翩翩花间舞，\n一壶十三煮乾坤。🌸', delay: 0 },
    ];

    let demoStarted = false;
    let demoRunning = false;

    function highlightCap(capId) {
      document.querySelectorAll('.demo-capability').forEach(c => c.classList.remove('active'));
      if (capId) {
        const el = document.querySelector(`.demo-capability[data-cap="${capId}"]`);
        if (el) el.classList.add('active');
      }
    }

    function addMessage(html) {
      const div = document.createElement('div');
      div.innerHTML = html;
      chatBody.appendChild(div.firstElementChild);
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    function showTyping() {
      const el = document.createElement('div');
      el.className = 'demo-typing';
      el.id = 'demoTypingIndicator';
      el.innerHTML = '<span></span><span></span><span></span>';
      chatBody.appendChild(el);
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    function removeTyping() {
      const el = document.getElementById('demoTypingIndicator');
      if (el) el.remove();
    }

    async function streamText(element, text) {
      let i = 0;
      return new Promise(resolve => {
        const interval = setInterval(() => {
          if (i < text.length) {
            element.textContent = text.substring(0, i + 1);
            i++;
            chatBody.scrollTop = chatBody.scrollHeight;
          } else {
            clearInterval(interval);
            element.innerHTML = text.replace(/\n/g, '<br>');
            resolve();
          }
        }, 30);
      });
    }

    async function runDemo() {
      if (demoRunning) return;
      demoRunning = true;
      chatBody.innerHTML = '';
      highlightCap(null);
      inputText.className = 'demo-input-text';
      inputText.textContent = '输入消息...';

      for (const step of chatScript) {
        if (!demoRunning) break;
        if (step.type === 'pause') { await new Promise(r => setTimeout(r, step.delay)); continue; }
        if (step.type === 'user') {
          if (step.cap) highlightCap(step.cap);
          inputText.className = 'demo-input-text typing';
          inputText.textContent = step.text;
          await new Promise(r => setTimeout(r, step.delay));
          inputText.className = 'demo-input-text';
          inputText.textContent = '输入消息...';
          addMessage(`<div class="demo-msg demo-msg--user"><div class="demo-msg-bubble">${step.text}</div></div>`);
        } else if (step.type === 'typing') {
          showTyping();
          await new Promise(r => setTimeout(r, step.delay));
          removeTyping();
        } else if (step.type === 'skill') {
          addMessage(`<div class="demo-msg-skill">${step.icon} ${step.name}</div>`);
          await new Promise(r => setTimeout(r, 300));
        } else if (step.type === 'ai') {
          const wrapper = document.createElement('div');
          wrapper.className = 'demo-msg demo-msg--ai';
          const bubble = document.createElement('div');
          bubble.className = 'demo-msg-bubble';
          wrapper.appendChild(bubble);
          chatBody.appendChild(wrapper);
          await streamText(bubble, step.text);
          await new Promise(r => setTimeout(r, 200));
        }
      }
      demoRunning = false;
    }

    const demoObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !demoStarted) {
        demoStarted = true;
        setTimeout(runDemo, 600);
      }
    }, { threshold: 0.3 });
    demoObserver.observe(chatBody);

    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        demoRunning = false;
        demoStarted = true;
        setTimeout(runDemo, 300);
      });
    }
  }

  // ═══════════════ Dashboard Live Time ═══════════════
  const dashTime = document.getElementById('dashboardTime');
  if (dashTime) {
    function updateDashTime() {
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      dashTime.textContent = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
    updateDashTime();
    setInterval(updateDashTime, 30000);
  }

  // ═══════════════ Dashboard Feed Rotation ═══════════════
  const feedList = document.getElementById('dashFeedList');
  if (feedList) {
    const feedMessages = [
      { badge: 'reply', text: '已自动回复「赵经理」的消息' },
      { badge: 'moment', text: '朋友圈文案生成完毕，等待发布' },
      { badge: 'group', text: '「VIP 客户群」有 5 条新消息' },
      { badge: 'reply', text: '已自动回复「刘总」的消息' },
      { badge: 'alert', text: '今日群发已达 80%，请注意配额' },
      { badge: 'reply', text: '已自动回复「陈姐」的消息' },
      { badge: 'moment', text: '朋友圈数据更新：互动率 +12%' },
      { badge: 'group', text: '「内部协作群」@你 的消息' },
    ];
    let feedIdx = 0;
    setInterval(() => {
      const msg = feedMessages[feedIdx % feedMessages.length];
      const item = document.createElement('div');
      item.className = 'dash-feed-item';
      item.innerHTML = `<span class="dash-feed-badge dash-feed-badge--${msg.badge}">${
        msg.badge === 'reply' ? '回复' : msg.badge === 'moment' ? '朋友圈' : msg.badge === 'group' ? '群聊' : '预警'
      }</span>${msg.text}`;
      feedList.insertBefore(item, feedList.firstChild);
      if (feedList.children.length > 6) feedList.removeChild(feedList.lastChild);
      feedIdx++;
    }, 4000);
  }

  // ═══════════════ Terminal Auto-Type Demo ═══════════════
  const termBody = document.getElementById('terminalBody');
  if (termBody) {
    let termRunning = false;
    async function typeCmd(el, text, speed) {
      el.classList.add('typing');
      for (let i = 0; i < text.length; i++) {
        el.textContent += text[i];
        await new Promise(r => setTimeout(r, speed + Math.random() * 30));
      }
      el.classList.remove('typing');
    }
    async function runTerminal() {
      if (termRunning) return;
      termRunning = true;
      const lines = termBody.querySelectorAll('.terminal-line');
      const outputs = termBody.querySelectorAll('.terminal-output');
      lines.forEach(l => { const cmd = l.querySelector('.terminal-cmd'); if (cmd) cmd.textContent = ''; });
      outputs.forEach(o => o.classList.add('terminal-hidden'));
      for (let i = 0; i < lines.length; i++) {
        const cmd = lines[i].querySelector('.terminal-cmd');
        if (!cmd) continue;
        const text = cmd.getAttribute('data-cmd');
        await typeCmd(cmd, text, 35);
        await new Promise(r => setTimeout(r, 400));
        if (outputs[i]) {
          outputs[i].classList.remove('terminal-hidden');
          await new Promise(r => setTimeout(r, 800));
        }
      }
      termRunning = false;
    }
    const termObs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) runTerminal();
    }, { threshold: 0.4 });
    const termEl = termBody.closest('.terminal');
    if (termEl) termObs.observe(termEl);
  }

  // ═══════════════ Testimonial Infinite Scroll ═══════════════
  const testimonialScroll = document.querySelector('.testimonial-scroll');
  if (testimonialScroll) {
    const cards = testimonialScroll.innerHTML;
    testimonialScroll.innerHTML = cards + cards;
  }

  // ═══════════════ Micro-Interactions ═══════════════
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const circle = document.createElement('span');
      circle.classList.add('ripple');
      const d = Math.max(this.clientWidth, this.clientHeight);
      circle.style.width = circle.style.height = d + 'px';
      const rect = this.getBoundingClientRect();
      circle.style.left = (e.clientX - rect.left - d / 2) + 'px';
      circle.style.top = (e.clientY - rect.top - d / 2) + 'px';
      this.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  });

  if (!isMobile) {
    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('mousemove', function (e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotateX = ((y - cy) / cy) * -6;
        const rotateY = ((x - cx) / cx) * 6;
        this.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
      });
      card.addEventListener('mouseleave', function () { this.style.transform = ''; });
    });
  }

  if (!isMobile) {
    document.querySelectorAll('.btn--magnetic').forEach(btn => {
      btn.addEventListener('mousemove', function (e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        this.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });
      btn.addEventListener('mouseleave', function () { this.style.transform = ''; });
    });
  }

})();
