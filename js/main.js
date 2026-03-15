/**
 * 十三香小龙虾 — 官方宣传网站交互脚本
 * Phase 1: Particle system, scroll animations, counters, navigation
 * Phase 2: Loading screen, chat demo, dashboard, visual FX
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
      constructor() {
        this.reset();
      }

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
        if (dist < 120) {
          this.x -= dx * 0.008;
          this.y -= dy * 0.008;
        }
        this.x += this.speedX;
        this.y += this.speedY;
        this.age++;
        if (this.age > this.life || this.x < -10 || this.x > width + 10 || this.y < -10 || this.y > height + 10) {
          this.reset();
          this.y = height + 5;
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
      const count = Math.min(Math.floor((width * height) / 8000), 200);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    function drawConnections() {
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
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      drawConnections();
      requestAnimationFrame(animate);
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    window.addEventListener('resize', () => {
      resize();
    });

    initParticles();
    animate();
  }

  // ═══════════════ Scroll Reveal ═══════════════
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, delay * 120);
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });
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
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(step);
  }

  // ═══════════════ Navigation ═══════════════
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const sections = document.querySelectorAll('.section, .hero');
  const navLinkEls = document.querySelectorAll('.nav-link:not(.nav-link--cta)');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);

    let current = '';
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 200 && rect.bottom > 200) {
        current = section.id;
      }
    });
    navLinkEls.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  });

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

  // ═══════════════ Skill Category Filter ═══════════════
  const skillCats = document.querySelectorAll('.skill-cat');
  const skillCards = document.querySelectorAll('.skill-card');

  skillCats.forEach(btn => {
    btn.addEventListener('click', () => {
      skillCats.forEach(b => b.classList.remove('skill-cat--active'));
      btn.classList.add('skill-cat--active');
      const cat = btn.dataset.cat;
      skillCards.forEach(card => {
        if (cat === 'all' || card.dataset.cat === cat) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
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

  // ═══════════════ Smooth Scroll for Anchor Links ═══════════════
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ═══════════════ Back to Top Button ═══════════════
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 600);
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ═══════════════ Router Node Hover Effect ═══════════════
  const routerNodes = document.querySelectorAll('.router-node');
  routerNodes.forEach(node => {
    node.addEventListener('mouseenter', () => {
      routerNodes.forEach(n => {
        if (n !== node) n.style.opacity = '0.4';
      });
    });
    node.addEventListener('mouseleave', () => {
      routerNodes.forEach(n => n.style.opacity = '1');
    });
  });

  // ═══════════════ Copy Button Feedback ═══════════════
  document.querySelectorAll('.cta-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const original = btn.textContent;
      btn.textContent = '已复制 ✓';
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

        if (step.type === 'pause') {
          await new Promise(r => setTimeout(r, step.delay));
          continue;
        }

        if (step.type === 'user') {
          if (step.cap) highlightCap(step.cap);
          inputText.className = 'demo-input-text typing';
          inputText.textContent = step.text;
          await new Promise(r => setTimeout(r, step.delay));
          inputText.className = 'demo-input-text';
          inputText.textContent = '输入消息...';
          addMessage(`<div class="demo-msg demo-msg--user"><div class="demo-msg-bubble">${step.text}</div></div>`);
        }

        else if (step.type === 'typing') {
          showTyping();
          await new Promise(r => setTimeout(r, step.delay));
          removeTyping();
        }

        else if (step.type === 'skill') {
          addMessage(`<div class="demo-msg-skill">${step.icon} ${step.name}</div>`);
          await new Promise(r => setTimeout(r, 300));
        }

        else if (step.type === 'ai') {
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
      if (feedList.children.length > 6) {
        feedList.removeChild(feedList.lastChild);
      }
      feedIdx++;
    }, 4000);
  }

})();
