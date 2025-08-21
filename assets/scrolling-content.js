if (!customElements.get('scrolling-content')) {
  customElements.define(
    'scrolling-content',
    class ScrollingContent extends HTMLElement {
      static observedAttributes = ['data-playing'];
      constructor() {
        super();
      }

      connectedCallback() {
        this.playPause = this.querySelector('play-pause-button');
        this.region = this.querySelector('[role="region"]');
        this.speed = this.dataset.speed * 10000;
        this.dataset.playing = true;
        this.animated = [];
        this.timer = null;
        this.createElements();

        const isReduced = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

        if (isReduced) this.dataset.playing = false;

        this.observer = new IntersectionObserver(
          ([e]) => {
            if (e.isIntersecting) {
              if (this.dataset.playing === 'true') {
                this.animated.forEach((el) => el.play());
              }
            } else {
              this.pauseItems();
            }
          },
          {
            threshold: [0],
          }
        );
        this.observer.observe(this);
        window.addEventListener('resize', window.utils.throttle(this.createElements.bind(this), 300));

        this.addEventListener('mouseenter', () => {
          this.timer = setTimeout(() => {
            this.pauseItems();
          }, 100);
        });

        this.addEventListener('mouseleave', () => {
          clearTimeout(this.timer);
          if (this.dataset.playing === 'true') {
            this.animated.forEach((el) => el.play());
          }
        });

        this.addEventListener('focusin', () => {
          this.pauseItems();
        });

        this.addEventListener('focusout', () => {
          if (this.dataset.playing === 'true') {
            this.animated.forEach((el) => el.play());
          }
        });

        this.playPause.addEventListener('click', () => {
          if (this.dataset.playing === 'true') {
            this.dataset.playing = false;
          } else {
            this.dataset.playing = true;
          }
        });
      }

      createElements() {
        this.elementObserver?.disconnect();
        if (this.clientWidth != this.width) {
          this.width = this.clientWidth;
          const items = this.querySelectorAll('.scrolling-content__items');
          const itemsWidth = items[0].clientWidth;
          if (itemsWidth < 1) return;
          let clones = Math.ceil((this.width - items.length * itemsWidth) / itemsWidth + 1);

          for (let i = 1; i <= clones; ++i) {
            const node = items[0].cloneNode(true);
            node.dataset.index = i;
            node.setAttribute('aria-hidden', true);
            const links = node.querySelectorAll('a');
            links.forEach((link) => {
              link.setAttribute('tabindex', '-1');
            });
            this.region.appendChild(node);
          }
          this.bindElementVisibilityObserver();
          this.playOrPauseItems();
        }
      }

      bindElementVisibilityObserver() {
        const allItems = this.querySelectorAll('.scrolling-content__items');
        const links = [...this.querySelectorAll('a')].reverse();
        // If we don't have links, rely on the aria-label on the region. If we do have links, show the visibility and allow tabbing to the link based on the current viewport. We only want one link to be focusable at a time.
        if (links) {
          this.elementObserver = new IntersectionObserver(([e]) => {
            links.forEach((link) => {
              const href = link.getAttribute('href');
              if (window.utils.isInViewport(link) && !this.querySelector(`a[href="${href}"][tabindex="0"]`)) {
                link.setAttribute('tabindex', 0);
              } else {
                link.setAttribute('tabindex', -1);
              }
            });
            allItems.forEach((item) => {
              const itemLink = item.querySelector('a[href="${href}"][tabindex="0"]');
              itemLink ? item.removeAttribute('aria-hidden') : item.setAttribute('aria-hidden', true);
            });
            if (!this.querySelector(".scrolling-content__items:not([aria-hidden='true']")) {
              const mostInViewport = this.mostInViewport(allItems);
              mostInViewport.removeAttribute('aria-hidden');
            }
          });
          links.forEach((link) => this.elementObserver.observe(link));
        }
      }

      mostInViewport(elements) {
        let mostVisibleElement = elements[0];
        let maxVisibleArea = 0;
        elements.forEach((element) => {
          const rect = element.getBoundingClientRect();
          let visibleWidth;

          if (document.documentElement.dir === 'rtl') {
            visibleWidth = Math.max(
              0,
              Math.min(window.innerWidth, rect.left) - Math.max(0, window.innerWidth - rect.right)
            );
          } else {
            visibleWidth = Math.max(0, Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left));
          }
          const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
          const visibleArea = visibleWidth * visibleHeight;

          console.log(visibleArea, maxVisibleArea);
          if (visibleArea > maxVisibleArea) {
            maxVisibleArea = visibleArea;
            mostVisibleElement = element;
          }
        });

        return mostVisibleElement;
      }

      playOrPauseItems() {
        let transform = [];
        if (document.dir === 'rtl') {
          transform = ['translateX(0)', 'translateX(100%)'];
          if (this.dataset.direction === 'right') {
            transform = ['translateX(100%)', 'translateX(0)'];
          }
        } else {
          transform = ['translateX(0)', 'translateX(-100%)'];
          if (this.dataset.direction === 'right') {
            transform = ['translateX(-100%)', 'translateX(0)'];
          }
        }
        const items = this.querySelectorAll('.scrolling-content__items');
        if (this.dataset.playing === 'true') {
          items.forEach((el, i) => {
            const animation = el.animate(
              { transform },
              { duration: this.speed, easing: 'linear', iterations: Infinity }
            );
            animation.id = `${this.id}-${i}`;
            this.animated = [...this.animated, animation];
          });
        }
      }

      pauseItems() {
        this.animated.forEach((el) => {
          el.pause();
        });
      }

      attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data-playing') {
          this.playPause.setAttribute('data-playing', newValue);
          if (newValue === 'false') {
            this.pauseItems();
          } else {
            this.animated?.forEach((el) => el.play());
          }
        }
      }
    }
  );
}
