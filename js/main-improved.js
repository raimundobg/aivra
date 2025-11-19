/**
 * ============================================
 * ZENLAB SUPERALIMENTOS - JAVASCRIPT MEJORADO
 * Versión: 2.0
 * Autor: UX/UI Designer Expert
 * ============================================
 */

// ============================================
// 1. NAVBAR SCROLL EFFECT
// ============================================

const navbar = document.getElementById('mainNavbar');
let lastScrollTop = 0;
const scrollThreshold = 50;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add/remove 'scrolled' class based on scroll position
    if (scrollTop > scrollThreshold) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScrollTop = scrollTop;
});

// ============================================
// 2. MOBILE HAMBURGER MENU
// ============================================

const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', () => {
        hamburgerBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = hamburgerBtn.classList.contains('active') ? 'hidden' : '';
    });
    
    // Close menu when clicking on a link
    const mobileMenuLinks = mobileMenu.querySelectorAll('.mobile-menu-link');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburgerBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburgerBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
            hamburgerBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ============================================
// 3. SMOOTH SCROLL FOR NAVIGATION LINKS
// ============================================

// Desktop navigation links
const navLinks = document.querySelectorAll('.nav-link-custom');
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Only apply smooth scroll to anchor links
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Mobile navigation links
const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// ============================================
// 4. SCROLL INDICATOR (HERO SECTION)
// ============================================

const scrollIndicator = document.querySelector('.scroll-indicator');
if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        const featuresSection = document.getElementById('caracteristicas');
        if (featuresSection) {
            const offsetTop = featuresSection.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
}

// ============================================
// 5. INTERSECTION OBSERVER FOR ANIMATIONS
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections
const observeElements = document.querySelectorAll(`
    .feature-card-improved,
    .audience-card-improved,
    .step-item,
    .pricing-card,
    .testimonial-card
`);

observeElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ============================================
// 6. OPEN RECIPE GENERATOR MODAL
// ============================================

/**
 * Esta función abre tu modal original del generador de batidos
 * Mantiene la funcionalidad existente sin cambios
 */
function openRecipeGenerator() {
    // Busca el modal de Bootstrap
    const modalElement = document.getElementById('recipeGeneratorModal');
    
    if (modalElement) {
        // Usa Bootstrap 5 Modal API
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } else {
        console.error('Modal #recipeGeneratorModal no encontrado');
    }
}

// Hacer la función global para que sea accesible desde onclick
window.openRecipeGenerator = openRecipeGenerator;

// ============================================
// 7. ACTIVE NAVIGATION HIGHLIGHT
// ============================================

/**
 * Highlight the active section in the navigation menu
 */
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-link-custom, .mobile-menu-link');

window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    
    sections.forEach(current => {
        const sectionHeight = current.offsetHeight;
        const sectionTop = current.offsetTop - 100;
        const sectionId = current.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('href') === `#${sectionId}`) {
                    item.classList.add('active');
                }
            });
        }
    });
});

// ============================================
// 8. LAZY LOADING FOR IMAGES
// ============================================

/**
 * Implementa lazy loading nativo para imágenes
 */
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
});

// ============================================
// 9. SCROLL TO TOP BUTTON (OPCIONAL)
// ============================================

/**
 * Botón opcional para volver arriba (puedes agregarlo al HTML si deseas)
 */
function createScrollToTopButton() {
    const button = document.createElement('button');
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    button.className = 'scroll-to-top-btn';
    button.setAttribute('aria-label', 'Volver arriba');
    
    // Estilos inline (o puedes agregarlos al CSS)
    button.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #10b981, #14b8a6);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 999;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
    `;
    
    document.body.appendChild(button);
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            button.style.opacity = '1';
            button.style.visibility = 'visible';
        } else {
            button.style.opacity = '0';
            button.style.visibility = 'hidden';
        }
    });
    
    // Scroll to top on click
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Hover effect
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-5px)';
        button.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
    });
}

// Inicializar el botón (descomentar si deseas usarlo)
// createScrollToTopButton();

// ============================================
// 10. PRELOADER (OPCIONAL)
// ============================================

/**
 * Muestra un preloader mientras carga la página
 * Puedes agregar un div#preloader al HTML si deseas usar esto
 */
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 300);
    }
});

// ============================================
// 11. FORM VALIDATION FOR PRICING CTAs
// ============================================

/**
 * Valida y maneja los CTAs de pricing
 */
const pricingButtons = document.querySelectorAll('.btn-pricing, .btn-enterprise');
pricingButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        // Si el botón tiene un onclick específico, no hacer nada
        if (button.hasAttribute('onclick')) {
            return;
        }
        
        // Default behavior: abrir modal o redirigir
        e.preventDefault();
        
        const planName = button.closest('.pricing-card')?.querySelector('.pricing-plan-name')?.textContent || 'Enterprise';
        
        console.log(`Usuario interesado en plan: ${planName}`);
        
        // Aquí podrías:
        // 1. Abrir un modal de registro
        // 2. Redirigir a una página de checkout
        // 3. Enviar a un formulario de contacto
        
        // Por ahora, abrimos el generador como ejemplo
        if (planName !== 'Enterprise') {
            openRecipeGenerator();
        } else {
            alert('Formulario de contacto Enterprise - Próximamente');
            // window.location.href = '/contacto-enterprise';
        }
    });
});

// ============================================
// 12. STATS COUNTER ANIMATION
// ============================================

/**
 * Anima los números de las estadísticas cuando aparecen en viewport
 */
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16); // 60 FPS
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Observa las estadísticas
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            const targetValue = parseInt(entry.target.dataset.target);
            if (!isNaN(targetValue)) {
                animateCounter(entry.target, targetValue);
                entry.target.dataset.animated = 'true';
            }
        }
    });
}, { threshold: 0.5 });

// Si tienes números que quieres animar, agrégales data-target
// Ejemplo en HTML: <span class="stat-number" data-target="75">0</span>
const statNumbers = document.querySelectorAll('[data-target]');
statNumbers.forEach(stat => statsObserver.observe(stat));

// ============================================
// 13. PARALLAX EFFECT (OPCIONAL)
// ============================================

/**
 * Efecto parallax suave para el hero
 */
let ticking = false;

function updateParallax() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.floating-stat-card');
    
    parallaxElements.forEach((el, index) => {
        const speed = 0.5 + (index * 0.1);
        const yPos = -(scrolled * speed);
        el.style.transform = `translateY(${yPos}px)`;
    });
    
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            updateParallax();
            ticking = false;
        });
        ticking = true;
    }
});

// ============================================
// 14. CONSOLE EASTER EGG
// ============================================

console.log('%c🧪 ZenLab Superalimentos', 'color: #10b981; font-size: 24px; font-weight: bold;');
console.log('%c✨ Batidos inteligentes con biodisponibilidad optimizada', 'color: #14b8a6; font-size: 14px;');
console.log('%c💻 ¿Eres desarrollador? Únete a nuestro equipo: careers@zenlab.com', 'color: #6b7280; font-size: 12px;');

// ============================================
// 15. ACCESSIBILITY ENHANCEMENTS
// ============================================

/**
 * Mejoras de accesibilidad
 */

// Trap focus dentro del mobile menu cuando está abierto
if (mobileMenu) {
    const focusableElements = mobileMenu.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    mobileMenu.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && mobileMenu.classList.contains('active')) {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
        
        // Close menu with Escape key
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            hamburgerBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
            hamburgerBtn.focus();
        }
    });
}

// ============================================
// 16. DETECT IF USER PREFERS REDUCED MOTION
// ============================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
    // Disable animations for users who prefer reduced motion
    document.documentElement.style.setProperty('--transition-fast', '0ms');
    document.documentElement.style.setProperty('--transition-base', '0ms');
    document.documentElement.style.setProperty('--transition-slow', '0ms');
}

// ============================================
// 17. PERFORMANCE MONITORING (OPCIONAL)
// ============================================

/**
 * Log performance metrics (solo en desarrollo)
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        const connectTime = perfData.responseEnd - perfData.requestStart;
        const renderTime = perfData.domComplete - perfData.domLoading;
        
        console.log('%c📊 Performance Metrics', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
        console.log(`⏱️ Page Load Time: ${pageLoadTime}ms`);
        console.log(`🔌 Connection Time: ${connectTime}ms`);
        console.log(`🎨 Render Time: ${renderTime}ms`);
    });
}

// ============================================
// 18. COOKIE CONSENT (OPCIONAL)
// ============================================

/**
 * Si necesitas un banner de cookies, descomenta esto
 */
/*
function showCookieConsent() {
    if (!localStorage.getItem('cookieConsent')) {
        const banner = document.createElement('div');
        banner.className = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-content">
                <p>🍪 Usamos cookies para mejorar tu experiencia. 
                <a href="/politica-cookies">Más información</a></p>
                <button class="btn-accept-cookies">Aceptar</button>
            </div>
        `;
        
        // Estilos inline
        banner.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #1f2937;
            color: white;
            padding: 1.5rem;
            z-index: 9999;
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
        `;
        
        document.body.appendChild(banner);
        
        banner.querySelector('.btn-accept-cookies').addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'true');
            banner.remove();
        });
    }
}

// Inicializar
// showCookieConsent();
*/

// ============================================
// FIN DEL JAVASCRIPT
// ============================================

console.log('%c✅ JavaScript cargado correctamente', 'color: #10b981; font-weight: bold;');