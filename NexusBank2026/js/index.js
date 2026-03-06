// ============================================
// index.js - Homepage Specific Features
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // Only run on homepage
    if (!document.querySelector('.hero')) return;
    
    // ===== HERO SECTION PARALLAX =====
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            hero.style.backgroundPosition = `center ${scrolled * 0.5}px`;
        });
    }
    
    // ===== DASHBOARD PREVIEW 3D EFFECT =====
    const dashboardPreview = document.querySelector('.dashboard-preview');
    if (dashboardPreview) {
        // 3D tilt effect on mouse move
        dashboardPreview.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
        });
        
        // Reset on mouse leave
        dashboardPreview.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateY(-10deg) translateZ(0)';
        });
    }
    
    // ===== FEATURE CARDS ANIMATION =====
    const featureCards = document.querySelectorAll('.feature-card');
    
    if (featureCards.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    
                    const index = Array.from(featureCards).indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 0.1}s`;
                }
            });
        }, { threshold: 0.2 });
        
        featureCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }
    
    // ===== STATS COUNTER ANIMATION =====
    const stats = document.querySelectorAll('.stat-number');
    
    if (stats.length > 0) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        stats.forEach(stat => statsObserver.observe(stat));
        
        function animateCounter(element) {
            const target = element.innerText;
            const numericValue = parseFloat(target.replace(/[^0-9.]/g, ''));
            const suffix = target.replace(/[0-9.]/g, '');
            
            if (isNaN(numericValue)) return;
            
            let current = 0;
            const increment = numericValue / 50;
            
            const counter = setInterval(() => {
                current += increment;
                
                if (current >= numericValue) {
                    element.innerText = target;
                    clearInterval(counter);
                } else {
                    if (Number.isInteger(numericValue)) {
                        element.innerText = Math.floor(current) + suffix;
                    } else {
                        element.innerText = current.toFixed(1) + suffix;
                    }
                }
            }, 30);
        }
    }
    
    // ===== PHONE MOCKUP INTERACTION =====
    const phoneMockup = document.querySelector('.phone-mockup');
    if (phoneMockup) {
        phoneMockup.addEventListener('click', function() {
            this.style.transform = 'translateY(-20px) rotate(2deg)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
        });
    }
    
    // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    const navHeight = document.querySelector('.floating-nav').offsetHeight;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // ===== ACTIVE NAVIGATION ON SCROLL =====
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-item');
    
    if (sections.length > 0 && navItems.length > 0) {
        window.addEventListener('scroll', function() {
            let current = '';
            const scrollPosition = window.scrollY + 120;
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });
            
            navItems.forEach(item => {
                item.classList.remove('active');
                const href = item.getAttribute('href');
                if (href && href.includes(current) && href !== '#') {
                    item.classList.add('active');
                }
                
                if (!current && item.getAttribute('href') === 'index.html') {
                    item.classList.add('active');
                }
            });
        });
    }
    
    // ===== TOOLTIP FOR NAVIGATION (TABLET) =====
    if (window.innerWidth <= 1024 && window.innerWidth > 768) {
        document.querySelectorAll('.nav-item').forEach(item => {
            const span = item.querySelector('span');
            if (span && span.textContent) {
                item.setAttribute('data-tooltip', span.textContent);
            }
        });
    }
});

// Add tooltip styles
const style = document.createElement('style');
style.textContent = `
    @media (min-width: 769px) and (max-width: 1024px) {
        .nav-item[data-tooltip]:hover::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--surface-elevated);
            color: var(--text-primary);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            border: 1px solid var(--border-light);
            box-shadow: var(--shadow-sm);
            z-index: 1000;
        }
    }
`;
document.head.appendChild(style);