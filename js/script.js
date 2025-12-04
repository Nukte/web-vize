document.addEventListener('DOMContentLoaded', () => {
    // State Management
    let currentLang = localStorage.getItem('lang') || 'tr';
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    let isRetroMode = localStorage.getItem('retroMode') === 'true';

    // DOM Elements
    const body = document.body;
    const langBtn = document.getElementById('lang-btn');
    const themeBtn = document.getElementById('theme-btn');
    const styleBtn = document.getElementById('style-btn');
    
    // Mobile Menu Logic
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    
    // Create Hamburger Button
    const menuBtn = document.createElement('button');
    menuBtn.className = 'menu-toggle';
    menuBtn.innerHTML = '☰';
    menuBtn.setAttribute('aria-label', 'Toggle Menu');
    header.insertBefore(menuBtn, nav);

    menuBtn.addEventListener('click', () => {
        nav.classList.toggle('active');
        menuBtn.innerHTML = nav.classList.contains('active') ? '✕' : '☰';
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!header.contains(e.target) && nav.classList.contains('active')) {
            nav.classList.remove('active');
            menuBtn.innerHTML = '☰';
        }
    });

    // Initialize State
    updateTheme();
    updateStyle();
    updateLanguage();

    // Event Listeners
    if(themeBtn) themeBtn.addEventListener('click', toggleTheme);
    if(styleBtn) styleBtn.addEventListener('click', toggleStyle);
    if(langBtn) langBtn.addEventListener('click', toggleLanguage);

    // Functions
    function toggleTheme() {
        isDarkMode = !isDarkMode;
        localStorage.setItem('darkMode', isDarkMode);
        updateTheme();
    }

    function updateTheme() {
        if (isDarkMode) {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
    }

    function toggleStyle() {
        isRetroMode = !isRetroMode;
        localStorage.setItem('retroMode', isRetroMode);
        updateStyle();
        updateLanguage(); // Update button text
    }

    function updateStyle() {
        if (isRetroMode) {
            body.classList.add('retro-mode');
        } else {
            body.classList.remove('retro-mode');
        }
    }

    function toggleLanguage() {
        currentLang = currentLang === 'tr' ? 'en' : 'tr';
        localStorage.setItem('lang', currentLang);
        updateLanguage();
    }

    function updateLanguage() {
        const elements = document.querySelectorAll('[data-lang]');
        elements.forEach(el => {
            const key = el.getAttribute('data-lang');
            if (translations[currentLang][key]) {
                el.textContent = translations[currentLang][key];
            }
        });

        // Update specific button texts dynamically based on state
        if(langBtn) langBtn.textContent = translations[currentLang]['toggle_lang'];
        if(styleBtn) styleBtn.textContent = isRetroMode ? translations[currentLang]['retro_mode'] : translations[currentLang]['modern_mode'];
    }

    // Blog Logic
    if (window.location.pathname.includes('blog.html')) {
        loadBlogPosts();
    }

    // Blog Detail Logic 
    if (window.location.pathname.includes('blog-detail.html')) {
        loadBlogDetail();
    }

    // GitHub Projects Logic
    if (window.location.pathname.includes('projects.html')) {
        loadGithubProjects();
    }

    async function loadGithubProjects() {
        const container = document.getElementById('projects-container');
        const username = 'Nukte'; 
        
        if (!container) return;

        try {
            const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc`);
            if (!response.ok) throw new Error('GitHub API Error');
            
            const repos = await response.json();
            container.innerHTML = ''; // Clear loading text

            repos.forEach(repo => {
             
                const card = document.createElement('div');
                card.className = 'card';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.justifyContent = 'space-between';
                
                const description = repo.description || translations[currentLang]['no_description'];
                
                card.innerHTML = `
                    <div>
                        <h3 style="margin-bottom: 0.5rem; color: var(--primary-color);">${repo.name}</h3>
                        <p style="font-size: 0.9rem; margin-bottom: 1rem;">${description}</p>
                    </div>
                    <div>
                        <div style="display: flex; gap: 1rem; font-size: 0.8rem; color: var(--secondary-color); margin-bottom: 1rem;">
                            <span>⭐ ${repo.stargazers_count} ${translations[currentLang]['stars']}</span>
                            <span>🍴 ${repo.forks_count} ${translations[currentLang]['forks']}</span>
                            <span>${repo.language || ''}</span>
                        </div>
                        <a href="${repo.html_url}" target="_blank" style="display: inline-block; padding: 0.5rem 1rem; background: var(--primary-color); color: #fff; text-decoration: none; border-radius: var(--border-radius); font-size: 0.9rem;">
                            ${translations[currentLang]['view_repo']}
                        </a>
                    </div>
                `;
                container.appendChild(card);
            });

        } catch (error) {
            console.error('Error loading GitHub repos:', error);
            container.innerHTML = '<p>Projeler yüklenirken bir hata oluştu. (API limiti veya bağlantı hatası)</p>';
        }
    }

    async function loadBlogPosts() {
        const container = document.getElementById('blog-container');
        if (!container) return;

        try {
            const response = await fetch('data/blog.json');
            const posts = await response.json();
            
            container.innerHTML = ''; // Clear loading text
            
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'card';
                postElement.style.cursor = 'pointer';
                postElement.onclick = () => window.location.href = `blog-detail.html?id=${post.id}`;
                postElement.innerHTML = `
                    <h3>${post.title[currentLang]}</h3>
                    <small>${post.date}</small>
                    <p>${post.summary ? post.summary[currentLang] : post.content[currentLang].substring(0, 100) + '...'}</p>
                    <br>
                    <span style="color: var(--primary-color); text-decoration: underline;">Devamını Oku &rarr;</span>
                `;
                container.appendChild(postElement);
            });
        } catch (error) {
            console.error('Error loading blog posts:', error);
            container.innerHTML = '<p>Blog yazıları yüklenemedi. (Lütfen yerel sunucu kullanın)</p>';
        }
    }

    async function loadBlogDetail() {
        const container = document.getElementById('blog-detail-container');
        if (!container) return;

        const urlParams = new URLSearchParams(window.location.search);
        const postId = parseInt(urlParams.get('id'));

        if (!postId) {
            container.innerHTML = '<p>Yazı bulunamadı.</p>';
            return;
        }

        try {
            const response = await fetch('data/blog.json');
            const posts = await response.json();
            const post = posts.find(p => p.id === postId);

            if (post) {
                container.innerHTML = `
                    <h1 style="margin-bottom: 0.5rem;">${post.title[currentLang]}</h1>
                    <small style="display: block; margin-bottom: 1.5rem; color: var(--secondary-color);">${post.date}</small>
                    <div style="line-height: 1.8;">
                        ${post.content[currentLang]}
                    </div>
                `;
            } else {
                container.innerHTML = '<p>Yazı bulunamadı.</p>';
            }
        } catch (error) {
            console.error('Error loading blog detail:', error);
            container.innerHTML = '<p>İçerik yüklenemedi.</p>';
        }
    }

    // Gallery Modal Logic (Only for gallery.html)
    const modal = document.getElementById('imageModal');
    if (modal) {
        const modalImg = document.getElementById("img01");
        const captionText = document.getElementById("caption");
        const closeBtn = document.getElementsByClassName("close")[0];
        const images = document.querySelectorAll('.gallery-img');

        images.forEach(img => {
            img.addEventListener('click', function() {
                modal.style.display = "flex";
                modalImg.src = this.src;
                captionText.innerHTML = this.alt;
            });
        });

        closeBtn.onclick = function() {
            modal.style.display = "none";
        }

        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    }

    // Particles Background Animation
    const canvas = document.getElementById('matrix-bg');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        
        // Configuration
        const particleCount = 60; // Number of dots
        const connectionDistance = 150; // Distance to draw lines
        const moveSpeed = 0.5; // Speed of movement

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * moveSpeed;
                this.vy = (Math.random() - 0.5) * moveSpeed;
                this.size = Math.random() * 2 + 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }

            draw() {
                // Color settings based on theme
                let color = isDarkMode ? 'rgba(255, 255, 255, ' : 'rgba(0, 0, 0, ';
                if (isRetroMode) {
                    color = isDarkMode ? 'rgba(0, 255, 0, ' : 'rgba(0, 0, 128, '; // Green or Navy
                } else if (isDarkMode) {
                    color = 'rgba(0, 123, 255, '; // Blueish in modern dark
                }

                ctx.fillStyle = color + '0.8)';
                ctx.beginPath();
                if (isRetroMode) {
                    ctx.fillRect(this.x, this.y, this.size * 2, this.size * 2); // Square dots for retro
                } else {
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); // Round dots for modern
                    ctx.fill();
                }
            }
        }

        function initParticles() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        function drawParticles() {
            ctx.clearRect(0, 0, width, height);
            
            // Line color base
            let lineColor = isDarkMode ? '255, 255, 255' : '0, 0, 0';
            if (isRetroMode) {
                lineColor = isDarkMode ? '0, 255, 0' : '0, 0, 128';
            } else if (isDarkMode) {
                lineColor = '0, 123, 255';
            }

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                // Draw connections
                for (let j = i; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        ctx.beginPath();
                        const opacity = 1 - (distance / connectionDistance);
                        ctx.strokeStyle = `rgba(${lineColor}, ${opacity * 0.5})`; // Increased line opacity
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(drawParticles);
        }

        window.addEventListener('resize', initParticles);
        initParticles();
        drawParticles();
    }

    // Typewriter Effect
    const typeWriterElement = document.getElementById('typewriter');
    if (typeWriterElement) {
        const texts = [".NET Developer", "Software Developer", "Student"]; 
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typeSpeed = 100;

        function type() {
            const currentText = texts[textIndex];
            
            if (isDeleting) {
                typeWriterElement.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
                typeSpeed = 50; // Silme hızı
            } else {
                typeWriterElement.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
                typeSpeed = 100; // Yazma hızı
            }

            if (!isDeleting && charIndex === currentText.length) {
                isDeleting = true;
                typeSpeed = 2000; // Yazı bittiğinde bekleme süresi
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                typeSpeed = 500; // Yeni kelimeye geçmeden bekleme
            }

            setTimeout(type, typeSpeed);
        }

        // Başlat
        setTimeout(type, 1000);
    }
});

// Modal Functions
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

