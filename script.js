// --- LENIS SMOOTH SCROLLING ---
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// --- TYPED.JS TYPING EFFECT ---
document.addEventListener("DOMContentLoaded", function () {
    const typed = new Typed('#typed', {
        strings: [
            'Fullstack Developer.',
            'Java Programmer.',
            'Web3 Enthusiast.',
            'Automation Builder.'
        ],
        typeSpeed: 50,
        backSpeed: 30,
        backDelay: 1500,
        loop: true,
        cursorChar: '_'
    });
});

// --- GSAP ANIMATIONS ---
gsap.registerPlugin(ScrollTrigger);

// 1. Hero Section Animation (on load)
const heroTimeline = gsap.timeline();

heroTimeline
    .from('.code-comment', { opacity: 0, y: 20, duration: 0.6, delay: 0.3, ease: 'power3.out' })
    .from('.hero h1', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' }, "-=0.4")
    .from('.hero h2', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' }, "-=0.4")
    .from('.hero .description', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' }, "-=0.4")
    .from('.cta-buttons', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' }, "-=0.4");

// 2. Advanced Scroll Animations

// Fade up for section titles and subsection titles
gsap.utils.toArray('.section-title, .subsection-title').forEach(title => {
    gsap.fromTo(title, { y: 40, opacity: 0 }, {
        scrollTrigger: { trigger: title, start: "top 90%" },
        y: 0, opacity: 1, duration: 0.8, ease: "power3.out"
    });
});

// About Section Layout (Slide in from left & right)
gsap.fromTo('.text-box', { x: -60, opacity: 0 }, {
    scrollTrigger: { trigger: '.about-content', start: "top 80%" },
    x: 0, opacity: 1, duration: 1, ease: "power3.out"
});

gsap.fromTo('.about-description', { x: 60, opacity: 0 }, {
    scrollTrigger: { trigger: '.about-content', start: "top 80%" },
    x: 0, opacity: 1, duration: 1, ease: "power3.out"
});

// Gallery Cards (Staggered fade & flip up)
gsap.fromTo('.gallery-card', { y: 60, opacity: 0, rotationY: 15 }, {
    scrollTrigger: { trigger: '.profile-gallery', start: "top 85%" },
    y: 0, opacity: 1, rotationY: 0, duration: 0.8, stagger: 0.15, ease: "power3.out"
});

// Project Cards (Staggered move up & zoom in slightly)
gsap.fromTo('.project-card', { y: 50, opacity: 0, scale: 0.95 }, {
    scrollTrigger: { trigger: '.project-grid', start: "top 85%" },
    y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.15, ease: "power3.out"
});

// Contact Content
gsap.fromTo('.contact-content > .description', { y: 30, opacity: 0 }, {
    scrollTrigger: { trigger: '.contact-content', start: "top 85%" },
    y: 0, opacity: 1, duration: 0.8, ease: "power3.out"
});

gsap.fromTo('.terminal-contact', { y: 60, opacity: 0, scale: 0.95 }, {
    scrollTrigger: { trigger: '.terminal-contact', start: "top 85%" },
    y: 0, opacity: 1, scale: 1, duration: 1, ease: "back.out(1.2)"
});

// Parallax for Background Glows while scrolling
gsap.to('.glow-1', {
    scrollTrigger: { trigger: 'body', start: "top top", end: "bottom bottom", scrub: true },
    y: 400,
    ease: "none"
});

gsap.to('.glow-2', {
    scrollTrigger: { trigger: 'body', start: "top top", end: "bottom bottom", scrub: true },
    y: -400,
    ease: "none"
});

// 3. Connect Lenis update to GSAP context
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0, 0);

// --- MOUSE GLOW BACKGROUND EFFECT ---
document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const xOffset1 = (mouseX / window.innerWidth - 0.5) * 80;
    const yOffset1 = (mouseY / window.innerHeight - 0.5) * 80;
    
    const xOffset2 = (mouseX / window.innerWidth - 0.5) * -80;
    const yOffset2 = (mouseY / window.innerHeight - 0.5) * -80;

    gsap.to('.glow-1', {
        x: xOffset1,
        y: yOffset1,
        duration: 2,
        ease: "power2.out"
    });

    gsap.to('.glow-2', {
        x: xOffset2,
        y: yOffset2,
        duration: 2,
        ease: "power2.out"
    });
});
