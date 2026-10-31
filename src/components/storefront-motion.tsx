'use client';

import { gsap } from 'gsap';
import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function StorefrontMotion() {
  const marker = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const locale = useLocale();
  const routeKey = `${locale}:${pathname}`;
  const [committedRoute, setCommittedRoute] = useState<string | null>(null);
  useEffect(() => {
    // Shared layouts can commit before their streamed page has hydrated.
    // Mutate animation styles only after the page's passive effects and next frame.
    const frame = requestAnimationFrame(() => setCommittedRoute(routeKey));
    return () => cancelAnimationFrame(frame);
  }, [routeKey]);
  useGSAP(
    () => {
      if (committedRoute !== routeKey) return;
      const root = marker.current?.closest<HTMLElement>('main');
      if (!root) return;
      const shell = root.closest<HTMLElement>('.storefront');
      if (!shell) return;
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        shell.dataset.motion = 'gsap';
        const lenis = new Lenis({
          autoRaf: false,
          smoothWheel: true,
          syncTouch: false,
          lerp: 0.12,
          anchors: { offset: -150 },
          prevent: (node) =>
            node.closest('dialog, .palette-options, .language-picker nav') !== null,
        });
        const tick = (time: number) => lenis.raf(time * 1000);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(tick);
        root.querySelectorAll<HTMLElement>('.signature-heading').forEach((heading) => {
          // A heading inside a reveal already moves with its parent; never multiply opacity.
          if (!heading.closest('[data-reveal]')) {
            gsap.fromTo(
              heading.querySelector('.signature-copy'),
              { y: 12, opacity: 1 },
              {
                y: 0,
                opacity: 1,
                duration: 0.55,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: heading,
                  start: 'top 94%',
                  once: true,
                },
              },
            );
          }
          if (heading.querySelector('.signature-signal'))
            gsap.fromTo(
              heading.querySelectorAll('.signature-signal span'),
              { scaleY: 0.2 },
              {
                scaleY: 1,
                duration: 0.45,
                stagger: 0.06,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: heading,
                  start: 'top 94%',
                  once: true,
                },
              },
            );
        });
        const hero = root.querySelector<HTMLElement>('.shop-hero');
        if (hero) {
          const image = hero.querySelector('.hero-photo img');
          if (image)
            gsap.fromTo(
              image,
              { scale: 1, yPercent: 0 },
              {
                scale: 1.1,
                yPercent: 8,
                ease: 'none',
                scrollTrigger: {
                  trigger: hero,
                  start: 'top 115px',
                  end: 'bottom 115px',
                  scrub: 0.7,
                  invalidateOnRefresh: true,
                },
              },
            );
        }
        gsap.utils
          .toArray<HTMLElement>(root.querySelectorAll('[data-reveal]'))
          .forEach((element) => {
            gsap.fromTo(
              element,
              { y: 20, opacity: 0.75 },
              {
                y: 0,
                opacity: 1,
                duration: 0.5,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: element,
                  start: 'top 92%',
                  once: true,
                },
              },
            );
          });
        const art = root.querySelector('.perspective-art img');
        if (art)
          gsap.fromTo(
            art,
            { yPercent: 5, scale: 1.12 },
            {
              yPercent: -5,
              scale: 1.05,
              ease: 'none',
              scrollTrigger: {
                trigger: root.querySelector('.perspective-section'),
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
                invalidateOnRefresh: true,
              },
            },
          );
        const progress = shell.querySelector('.scroll-progress');
        if (progress)
          gsap.fromTo(
            progress,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: 'none',
              scrollTrigger: { start: 0, end: 'max', scrub: 0.15, invalidateOnRefresh: true },
            },
          );
        const refresh = () => ScrollTrigger.refresh();
        root
          .querySelectorAll('img')
          .forEach((image) => image.addEventListener('load', refresh, { once: true }));
        let alive = true;
        void document.fonts.ready.then(() => {
          if (alive) refresh();
        });
        return () => {
          alive = false;
          gsap.ticker.remove(tick);
          lenis.destroy();
          root
            .querySelectorAll('img')
            .forEach((image) => image.removeEventListener('load', refresh));
        };
      });
      media.add('(prefers-reduced-motion: reduce)', () => {
        shell.dataset.motion = 'reduced';
      });
      return () => {
        media.revert();
        delete shell.dataset.motion;
      };
    },
    { dependencies: [routeKey, committedRoute], revertOnUpdate: true },
  );
  return <span ref={marker} hidden aria-hidden="true" />;
}
