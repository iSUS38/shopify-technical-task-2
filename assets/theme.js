window.utils = window.utils || {};

var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
if (isSafari) document.documentElement.setAttribute('data-safari', true);

window.utils.throttle = (callback, limit) => {
  let waiting = false; // Initially, we're not waiting
  return function () {
    if (!waiting) {
      callback.apply(this, arguments);
      waiting = true;
      setTimeout(function () {
        waiting = false;
      }, limit);
    }
  };
};

window.utils.announce = (text, el) => {
  if (!window.LRTimer) {
    window.LRTimer = {};
  }

  let element = el || document.getElementById('liveRegion');
  let id = element.getAttribute('id');

  element.textContent = text;

  if (window.LRTimer[id]) {
    clearTimeout(window.LRTimer[id]);
  }

  window.LRTimer[id] = setTimeout(() => {
    element.textContent = '';
  }, 300);
};

window.utils.isInViewport = (el) => {
  const rect = el.getBoundingClientRect();
  const html = document.documentElement;
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || html.clientHeight) &&
    rect.right <= (window.innerWidth || html.clientWidth)
  );
};

window.utils.debounce = (fn, wait) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
};

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

new ResizeObserver(() => {
  let vw = document.documentElement.clientWidth / 100;
  document.documentElement.style.setProperty('--vw', `${vw}px`);
}).observe(document.documentElement);

class HTMLUpdateUtility {
  /**
   * Used to swap an HTML node with a new node.
   * The new node is inserted as a previous sibling to the old node, the old node is hidden, and then the old node is removed.
   *
   * The function currently uses a double buffer approach, but this should be replaced by a view transition once it is more widely supported https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
   */
  static viewTransition(oldNode, newContent, preProcessCallbacks = [], postProcessCallbacks = []) {
    preProcessCallbacks?.forEach((callback) => callback(newContent));

    const newNodeWrapper = document.createElement('div');
    HTMLUpdateUtility.setInnerHTML(newNodeWrapper, newContent.outerHTML);
    const newNode = newNodeWrapper.firstChild;

    // dedupe IDs
    const uniqueKey = Date.now();
    oldNode.querySelectorAll('[id], [form]').forEach((element) => {
      element.id && (element.id = `${element.id}-${uniqueKey}`);
      element.form && element.setAttribute('form', `${element.form.getAttribute('id')}-${uniqueKey}`);
    });

    oldNode.parentNode.insertBefore(newNode, oldNode);
    oldNode.style.display = 'none';

    postProcessCallbacks?.forEach((callback) => callback(newNode));

    setTimeout(() => oldNode.remove(), 500);
  }

  // Sets inner HTML and reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
  static setInnerHTML(element, html) {
    element.innerHTML = html;
    element.querySelectorAll('script').forEach((oldScriptTag) => {
      const newScriptTag = document.createElement('script');
      Array.from(oldScriptTag.attributes).forEach((attribute) => {
        newScriptTag.setAttribute(attribute.name, attribute.value);
      });
      newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
      oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
    });
  }
}

function onIntersection(elements, observer) {
  elements.forEach((element) => {
    const elementTarget = element.target;
    const originColorScheme = elementTarget.getAttribute('data-color-scheme-original');
    const transitionColorScheme = elementTarget.getAttribute('data-color-scheme-transition');

    if (element.isIntersecting) {
      if (!elementTarget.classList.contains('scroll-trigger--visible')) {
        elementTarget.classList.add('scroll-trigger--visible');

        if (transitionColorScheme) {
          elementTarget.setAttribute('data-color-scheme', transitionColorScheme);
        }
      }
    } else {
      elementTarget.classList.remove('scroll-trigger--visible');

      if (transitionColorScheme) {
        elementTarget.setAttribute('data-color-scheme', originColorScheme);
      }
    }
  });
}

function initScrollAnimationTrigger(rootEl = document, isDesignModeEvent = false) {
  const animationTriggerElements = Array.from(rootEl.getElementsByClassName('scroll-trigger'));
  if (animationTriggerElements.length === 0) return;

  const observer = new IntersectionObserver(onIntersection, {
    rootMargin: '-5% 0px -15% 0px',
  });

  animationTriggerElements.forEach((element) => observer.observe(element));
}

function onVideoIntersection(elements, observer) {
  elements.forEach((element) => {
    const elementTarget = element.target;
    const isVideoLoaded = elementTarget.getAttribute('data-loaded');
    const videoElement = elementTarget.querySelector('video');

    if (element.isIntersecting) {
      if (!isVideoLoaded) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        elementTarget.loadContent();
      } else {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        elementTarget.play();
      }
    } else {
      elementTarget.pause();
    }
  });
}

function initVideoAutoplayTrigger() {
  const videoElements = Array.from(document.querySelectorAll('[data-autoplay="true"]'));

  const observer = new IntersectionObserver(onVideoIntersection, {
    rootMargin: '0px 0px 0px 0px',
  });

  videoElements.forEach((element) => observer.observe(element));
}

function labelExternalLinks() {
  const links = document.querySelectorAll('a[target="_blank"]');
  links.forEach((link) => link.setAttribute('aria-describedby', 'a11y-new-window-message'));
}

window.addEventListener('DOMContentLoaded', () => {
  initScrollAnimationTrigger();
  initVideoAutoplayTrigger();
  labelExternalLinks();
});

function pauseAllMedia(container = document) {
  container.querySelectorAll('deferred-media, external-media').forEach((video) => {
    if (video.pause) {
      video.pause();
    }
  });
  container.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.playPause = this.querySelector('play-pause-button');
    const poster = this.querySelector('[id^="Deferred-Media-Poster"]');
    if (!poster) return;
    poster.addEventListener('click', this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    // window.pauseAllMedia();
    if (!this.getAttribute('data-loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('data-loaded', true);
      this.media = content.querySelector('video, model-viewer, iframe');
      const img = this.media.querySelector('img:not([alt])');
      img?.setAttribute('alt', '');

      if (this.media.nodeName === 'VIDEO') {
        this.media.load();
        this.media.oncanplay = () => {
          this.appendChild(this.media);
          this.play();
        };
      } else {
        this.appendChild(this.media);
      }

      if (focus) {
        if (this.playPause) this.playPause.focus();
        this.media.focus();
      }
      this.addEventListeners(this.media);
    }
  }

  addEventListeners = (media) => {
    media.addEventListener('play', () => {
      this.setAttribute('data-playing', true);
      this.playPause.setAttribute('data-playing', true);
    });

    media.addEventListener('pause', () => {
      this.setAttribute('data-playing', false);
      this.playPause.setAttribute('data-playing', false);
    });

    const button = this.querySelector('play-pause-button');
    if (button) {
      button.addEventListener('click', () => {
        if (media.paused) {
          this.play();
        } else {
          this.pause();
        }
      });
    }
  };

  play() {
    if (this.media?.tagName === 'VIDEO') {
      this.media.play();
    }
  }

  pause() {
    if (this.media?.tagName === 'VIDEO') {
      this.media.pause();
    }
  }
}

customElements.define('deferred-media', DeferredMedia);

class PlayPauseButton extends HTMLElement {
  static observedAttributes = ['data-playing'];
  constructor() {
    super();
  }

  connectedCallback() {
    this.ready(this.init);
  }

  ready(fn) {
    if (this.children.length) {
      return fn.apply(this);
    }
    new MutationObserver(fn.bind(this)).observe(this, { childList: true });
  }

  init() {
    this.dataLabel = this.querySelector('[data-label]');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-playing' && this.dataLabel) {
      if (newValue === 'true') {
        this.dataLabel.innerHTML = this.getAttribute('data-pause');
      } else if (newValue === 'false') {
        this.dataLabel.innerHTML = this.getAttribute('data-play');
      }
    }
  }
}

customElements.define('play-pause-button', PlayPauseButton);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.mounted = false;
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.pageWidth = document.documentElement.clientWidth;
    this.timer = null;

    this.grid = this.querySelector('.slider-component__grid');
    this.progressBar = this.querySelector('[data-progress]');
    this.controls = this.querySelector('.slider-component__controls');
    this.countElement = this.querySelector('.slider-counter');
    this.currentPageElement = this.querySelector('.slider-counter--current');
    this.pageTotalElement = this.querySelector('.slider-counter--total');
    this.prevButton = this.querySelectorAll('[data-direction="previous"]');
    this.nextButton = this.querySelectorAll('[data-direction="next"]');
    this.animationStyle = this.getAttribute('data-animation-style');
    this.singleMode = this.tagName === 'SLIDESHOW-COMPONENT';

    if (!this.slider || !this.nextButton) return;
    if (this.sliderItems.length <= 1) return this.hideSlideshow();

    if (this.animationStyle === 'fade') {
      this.sliderItems.forEach((item) => {
        if (item.getAttribute('aria-hidden') != 'true') {
          this.currentPage = parseInt(item.dataset.index) + 1 || 1;
        }
      });
    } else {
      this.currentPage = 1;
    }

    this.initPages();
    const resizeObserver = new ResizeObserver((entries) => {
      if (this.sliderWidth === this.slider.clientWidth) {
        return;
      }
      this.initPages();
    });

    resizeObserver.observe(this.slider);

    this.slider.scrollTo(0, 0, { behavior: 'instant' });

    this.slider.addEventListener('scroll', this.update.bind(this));
    this.prevButton.forEach((button) => {
      button.addEventListener('click', this.onButtonClick.bind(this));
    });
    this.nextButton.forEach((button) => {
      button.addEventListener('click', this.onButtonClick.bind(this));
    });

    if (this.dataset.destroy) {
      this.resizeObserver = new ResizeObserver((elements, observer) => {
        this.checkDestroy();
      });
      this.resizeObserver.observe(document.documentElement);
    }
  }

  checkDestroy() {
    if (this.width === window.innerWidth) {
      return;
    }
    this.width = window.innerWidth;
    const mediaQuery = this.dataset.destroy;
    if (mediaQuery && window.matchMedia(mediaQuery).matches) {
      this.hideSlideshow(true);
    } else {
      this.unhideSlideshow();
    }
  }

  initPages() {
    const slideComputedStyle = getComputedStyle(this.slider);
    const columns = parseInt(slideComputedStyle.getPropertyValue('--columns'));
    this.limit = this.singleMode ? this.sliderItems.length : this.sliderItems.length - columns + 1;
    const styleMatch = slideComputedStyle.gridTemplateColumns.match(/[0-9]\d*(\.\d+)?/g);
    this.sliderWidth = styleMatch
      ? styleMatch.slice(1).reduce((a, b) => parseFloat(a) + parseFloat(b), 0)
      : this.clientWidth;
    let widthNeeded, gap, columnWidth, containerWidth;
    if (this.grid) {
      containerWidth = this.grid.clientWidth;
      const gapStyle = getComputedStyle(this.grid).gap;
      if (gapStyle) {
        gap = Number(gapStyle?.match(/[0-9]\d*(\.\d+)?/g)[1] || gapStyle?.match(/[0-9]\d*(\.\d+)?/g)[0]);
        columnWidth = (containerWidth - (columns - 1) * gap) / columns;
        widthNeeded = (this.sliderItems.length - 1) * gap + columnWidth * this.sliderItems.length;
      }
    }
    this.pageOffsetLeft = styleMatch ? Number(styleMatch[0]) : 0;
    this.sliderItemOffset = Math.abs(this.sliderItems[1]?.offsetLeft - this.sliderItems[0].offsetLeft);
    this.slidesPerPage = this.singleMode ? 1 : (this.sliderWidth - this.pageOffsetLeft) / this.sliderItemOffset;
    if (widthNeeded < this.sliderWidth) {
      this.totalPages = 1;
    } else if (this.singleMode) {
      this.totalPages = this.limit;
      const slide = this.sliderItems[this.currentPage - 1];
      this.jumpToSlide(slide, true);
    } else {
      const itemsThatFitOnSide = Math.floor(this.pageOffsetLeft / (columnWidth + gap));
      this.totalPages = this.limit - itemsThatFitOnSide;
    }

    this.update(false);
    this.pageTotalElement.setAttribute('data-total', this.totalPages);
    this.pageTotalElement.textContent = this.totalPages;
  }

  update(announcement) {
    let slidePadding;
    if (this.grid) {
      const slideComputedStyle = getComputedStyle(this.grid);
      const sliderPaddingStr = slideComputedStyle.paddingLeft.replace('px', '');
      if (sliderPaddingStr) slidePadding = parseInt(sliderPaddingStr);
    }

    this.pageTotalElement.textContent = this.totalPages;

    if (this.totalPages <= 1) {
      this.hideSlideshow();
    } else {
      this.checkDestroy();
    }

    if (!this.singleMode) {
      let currentPageIndex;
      this.sliderItems.forEach((item, index) => {
        const focusableElements = getFocusableElements(item);

        if (this.isSlideVisible(item)) {
          if (currentPageIndex === undefined) {
            currentPageIndex = index;
          }
          item.setAttribute('aria-hidden', 'false');
          item.removeAttribute('tabindex');
          focusableElements.forEach((el) => {
            el.getAttribute('tabindex') ? el.setAttribute('tabindex', 0) : el.removeAttribute('tabindex');
          });
        } else {
          item.setAttribute('aria-hidden', 'true');
          item.setAttribute('tabindex', '-1');
          focusableElements.forEach((el) => {
            el.setAttribute('tabindex', '-1');
          });
        }
      });

      if (currentPageIndex != undefined) {
        this.currentPage = currentPageIndex + 1;
      }
    }

    this.currentPageElement.textContent = Math.min(this.currentPage, this.totalPages) || 1;

    if (this.currentPage === 1 && !this.enableSliderLooping) {
      this.prevButton.forEach((button) => button.setAttribute('aria-disabled', true));
    } else {
      this.prevButton.forEach((button) => button.removeAttribute('aria-disabled', true));
    }

    if (this.currentPage === this.totalPages && !this.enableSliderLooping) {
      this.nextButton.forEach((button) => button.setAttribute('aria-disabled', true));
    } else {
      this.nextButton.forEach((button) => button.removeAttribute('aria-disabled'));
    }

    this.updateProgressBar();
    if (announcement) {
      clearTimeout(this.timer);
      this.timer = setTimeout(this.announcePosition.bind(this), 300);
    }
  }

  updateProgressBar() {
    if (this.progressBar) {
      let dividend, divisor;
      if (!this.singleMode) {
        dividend = Math.abs(this.slider.scrollLeft) + this.slider.clientWidth;
        divisor = this.slider.scrollWidth;
      } else {
        dividend = this.currentPage;
        divisor = this.totalPages;
      }

      let progress = Math.min((dividend / divisor) * 100, 100);
      this.progressBar.style.setProperty('--progress', `${progress}%`);
      if (this.progressBar.classList.contains('faded-out'))
        setTimeout(() => this.progressBar.classList.remove('faded-out'), 0);
    }
  }

  hideSlideshow(destroyed) {
    this.controls?.setAttribute('hidden', true);
    this.slider.removeAttribute('tabindex');
    this.slider.removeAttribute('role');
    this.slider.removeAttribute('aria-label');
    this.classList.add('slider--collapsed');
    this.sliderItems.forEach((item) => {
      item.removeAttribute('aria-hidden');
      item.removeAttribute('role');
    });
    if (destroyed) {
      this.setAttribute('data-destroyed', true);
    }
  }

  unhideSlideshow() {
    this.setup();
    if (!this.classList.contains('slider--collapsed')) return;
    this.removeAttribute('data-destroyed');
    this.classList.remove('slider--collapsed');
  }

  setup() {
    let setUpFade = false;
    const unhidden = this.slider.querySelectorAll("[aria-hidden='false']");
    if (unhidden.length > 1) {
      setUpFade = true;
    }
    this.controls?.removeAttribute('hidden');
    this.slider.setAttribute('tabindex', 0);
    this.slider.setAttribute('role', 'region');
    const label = this.dataset.label;
    if (document.getElementById(label)) {
      this.slider.setAttribute('aria-labelledby', label);
    } else {
      this.slider.setAttribute('aria-label', window.accessibilityStrings.sliderLabel);
    }
    this.sliderItems.forEach((item, index) => {
      item.setAttribute('data-index', index);
      if (this.singleMode) {
        item.setAttribute(
          'aria-label',
          window.accessibilityStrings.slideLabel
            .replace('{{ count }}', index + 1)
            .replace('{{ total }}', this.sliderItems.length)
        );
        item.setAttribute('role', 'group');
      }
      if (this.animationStyle !== 'fade') {
        if (this.isSlideVisible(item)) {
          item.removeAttribute('aria-hidden');
        } else {
          item.setAttribute('aria-hidden', true);
        }
      } else if (setUpFade && this.animationStyle === 'fade') {
        if (index != 0) {
          item.setAttribute('aria-hidden', true);
        } else {
          item.setAttribute('aria-hidden', false);
        }
      }
    });
  }

  announcePosition() {
    if (this.slider.getAttribute('data-slider-autoplay') === 'true' && !this.autoplayButtonIsSetToPlay) return;
    window.utils.announce(this.countElement.innerText.replace('/', ''));
  }

  onButtonClick(event) {
    if (event.currentTarget.getAttribute('aria-disabled') === 'true') {
      return;
    }

    const direction = event.currentTarget.dataset.direction;
    this.calculateFromDirection(direction);
  }

  calculateFromDirection(direction, jump = true) {
    if (direction === 'next') {
      if (this.currentPage === this.sliderItems.length) {
        if (!this.enableSliderLooping) return;
        this.currentPage = 1;
      } else {
        this.currentPage = this.currentPage + 1;
      }
    } else if (direction === 'previous') {
      if (this.currentPage === 1) {
        if (!this.enableSliderLooping) return;
        this.currentPage = this.sliderItems.length;
      } else {
        this.currentPage = this.currentPage - 1;
      }
    }
    if (jump) this.jumpToSlide(this.sliderItems[this.currentPage - 1]);
  }

  isSlideVisible(element) {
    if (this.singleMode && this.animationStyle === 'fade') {
      return this.currentPage === parseInt(element.dataset.index) + 1;
    } else {
      const rect = element.getBoundingClientRect();
      if (rect.left < -1 || rect.right < -1) {
        return false;
      }
      if (rect.right > this.clientWidth) {
        return false;
      }

      return true;
    }
  }

  setSlidePosition(position, skipAnimation = false) {
    this.slider.scrollTo({
      left: position,
      behavior: skipAnimation ? 'instant' : 'smooth',
    });
  }

  jumpToSlide(slide, skipAnimation) {
    if (!slide) return;
    if (document.dir === 'rtl') {
      this.slideScrollPosition = Math.round(this.clientWidth - slide.clientWidth - slide.offsetLeft) * -1;
    } else {
      this.slideScrollPosition = Math.round(slide.offsetLeft);
    }
    this.setSlidePosition(this.slideScrollPosition, skipAnimation);
  }
}

customElements.define('slider-component', SliderComponent);

class CustomDialog extends HTMLElement {
  constructor() {
    super();
    this.name = this.dataset.name;

    this.elements = {
      toggle: this.querySelector('[data-toggle]'),
      dialog: this.querySelector('dialog'),
      dialogWindow: this.querySelector('.dialog__window'),
      close: this.querySelectorAll('[data-close]'),
    };

    if (!this.querySelector('.dialog__overlay') && this.dataset.allowClickOutside !== 'true') {
      this.overlay = document.createElement('div');
      this.overlay.classList.add('dialog__overlay', 'dialog__animateable');
      this.elements.dialog.prepend(this.overlay);
      this.overlay.addEventListener('click', this.closeDialog.bind(this));
    }

    if (this.elements.toggle) this.elements.toggle.addEventListener('click', this.openDialog.bind(this));
    document.addEventListener(`dialog:trigger:${this.name}`, this.openDialog.bind(this));
    document.addEventListener(`dialog:force-close:${this.name}`, this.closeDialog.bind(this));
    this.elements.dialog.addEventListener(`close`, this.onClose.bind(this));
    this.elements.close.forEach((close) => {
      close.addEventListener('click', this.closeDialog.bind(this));
    });

    this.addEventListener('keydown', this.onKeyDown.bind(this));

    if (this.dataset.delay) {
      const delay = parseInt(this.dataset.delay * 1000);
      if (this.dataset.once) {
        if (localStorage.getItem(`theme:${this.dataset.once}`)) {
          return;
        }
      }
      setTimeout(() => {
        this.returnFocus = document.activeElement;
        this.openDialog();
      }, delay);
    }
  }

  onKeyDown(event) {
    if (event.code.toUpperCase() === 'ESCAPE' && this.dataset.modal != 'true') {
      this.closeDialog();
    }
  }

  openDialog(e) {
    if (Shopify?.designMode === true) {
      this.elements.dialog.setAttribute('open', true);
    } else if (this.dataset.modal === 'true') {
      this.elements.dialog.showModal();
      this.preventBodyScroll();
    } else {
      this.elements.dialog.show();
    }

    const scrollToTop = this.querySelectorAll('.dialog__body, [data-scroll-to-top]');
    scrollToTop.forEach((el) => {
      el.scrollTo(0, 0);
    });

    setTimeout(() => {
      const fade = this.querySelectorAll('[data-animate-fade]');
      fade.forEach((element) => element.classList.remove('faded-out'));
    }, 100);
    const event = new CustomEvent(`dialog:open:${this.name}`, {
      detail: {
        target: this,
      },
    });
    document.dispatchEvent(event);
  }

  closeDialog() {
    if (this.dataset.once) {
      localStorage.setItem(`theme:${this.dataset.once}`, true);
    }

    this.elements.dialog.close();

    const event = new CustomEvent(`dialog:close:${this.name}`, {
      detail: {
        target: this,
      },
    });
    document.dispatchEvent(event);

    if (this.returnFocus) {
      this.returnFocus.focus();
    }
  }

  onClose() {
    if (!document.querySelector('[data-modal="true"] dialog[open]')) this.allowBodyScroll();
    const fade = this.querySelectorAll('[data-animate-fade]');
    fade.forEach((element) => element.classList.add('faded-out'));
  }

  preventBodyScroll() {
    document.body.style.overflowY = 'hidden';
    document.body.style['overscroll-behavior'] = 'none';
  }

  allowBodyScroll() {
    document.body.style.overflowY = '';
    document.body.style['overscroll-behavior'] = '';
  }
}

customElements.define('custom-dialog', CustomDialog);

class LinkToButton extends HTMLElement {
  constructor() {
    super();
    this.link = this.querySelector('a');
    this.init();
  }

  init() {
    this.button = document.createElement('button');
    this.button.innerHTML = this.link.innerHTML;

    [...this.link.attributes].forEach(({ name, value }) => this.button.setAttribute(name, value));
    this.link.replaceWith(this.button);
  }
}

customElements.define('link-to-button', LinkToButton);

class DialogTrigger extends HTMLElement {
  constructor() {
    super();
    this.button = this.querySelector('button');
    this.name = this.dataset.name;

    this.button?.addEventListener('click', () => {
      const event = new CustomEvent(`dialog:trigger:${this.name}`, {
        detail: {
          detail: this.dataset.detail,
        },
      });
      document.dispatchEvent(event);
    });
  }
}

customElements.define('dialog-trigger', DialogTrigger);

class SearchForm extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input[type="search"]');
    this.resetButton = this.querySelector('button[type="reset"]');

    if (this.input) {
      this.input.form.addEventListener('reset', this.onFormReset.bind(this));
      this.input.addEventListener(
        'input',
        window.utils
          .debounce((event) => {
            this.onChange(event);
          }, 300)
          .bind(this)
      );
    }
  }

  toggleResetButton() {
    const resetIsHidden = this.resetButton.getAttribute('aria-hidden');
    if (this.input.value.length > 0 && resetIsHidden) {
      this.resetButton.removeAttribute('aria-hidden');
    } else if (this.input.value.length === 0 && !resetIsHidden) {
      this.resetButton.setAttribute('aria-hidden', true);
    }
  }

  onChange() {
    this.toggleResetButton();
  }

  shouldResetForm() {
    return !document.querySelector('[aria-selected="true"] a');
  }

  onFormReset(event) {
    // Prevent default so the form reset doesn't set the value gotten from the url on page load
    event.preventDefault();
    // Don't reset if the user has selected an element on the predictive search dropdown
    if (this.shouldResetForm()) {
      this.input.value = '';
      this.input.focus();
      this.toggleResetButton();
    }
  }
}

customElements.define('search-form', SearchForm);

if (!customElements.get('collapsible-content')) {
  customElements.define(
    'collapsible-content',
    class CollapsibleContent extends HTMLElement {
      constructor() {
        super();
        this.el = this.querySelector('details');
        this.summary = this.querySelector('summary');
        this.content = this.querySelector('[data-content]');
        this.animation = null;
        this.isClosing = false;
        this.isExpanding = false;
        this.summary.addEventListener('click', (e) => this.onClick(e));
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.borderThickness = parseInt(
          window.getComputedStyle(this).getPropertyValue('--border-thickness').replace('px', '')
        );

        this.content.addEventListener('keydown', (e) => {
          if (e.code.toUpperCase() === 'ESCAPE') {
            e.preventDefault();
            e.stopPropagation();
            this.summary.focus();
            this.collapse();
          }
        });

        if (this.dataset.destroy) {
          this.resizeObserver = new ResizeObserver((elements, observer) => {
            this.checkDestroy();
          });
          this.resizeObserver.observe(document.documentElement);
        }
      }

      checkDestroy() {
        if (this.width === window.innerWidth) {
          return;
        }
        this.width = window.innerWidth;
        const mediaQuery = this.dataset.destroy;
        if (mediaQuery && window.matchMedia(mediaQuery).matches) {
          this.hide();
        } else {
          this.unhide();
        }
      }

      hide() {
        this.el.setAttribute('open', true);
        this.el.classList.add('collapsible-item--destroyed');
        this.summary.removeEventListener('click', (e) => this.onClick(e));
      }

      unhide() {
        this.el.removeAttribute('open');
        this.el.classList.remove('collapsible-item--destroyed');
        this.summary.removeAttribute('tabindex', -1);
      }

      onClick(e) {
        e.preventDefault();
        this.el.style.overflow = 'hidden';
        if (this.isClosing || !this.el.open) {
          this.open();
        } else if (this.isExpanding || this.el.open) {
          this.collapse();
        }
      }

      collapse() {
        this.el.style.overflowY = 'hidden';
        this.isClosing = true;
        const startHeight = `${this.el.offsetHeight}px`;
        const endHeight = `${this.summary.offsetHeight + this.borderThickness}px`;

        if (this.animation) {
          this.animation.cancel();
        }

        // Start a WAAPI animation
        if (!this.prefersReducedMotion.matches) {
          this.animation = this.animate([startHeight, endHeight]);

          this.animation.onfinish = () => this.onAnimationFinish(false);
          this.animation.oncancel = () => (this.isClosing = false);
        } else {
          this.onAnimationFinish(false);
        }
      }

      open() {
        this.el.style.height = `${this.el.offsetHeight + this.borderThickness}px`;
        this.el.open = true;
        window.requestAnimationFrame(() => this.expand());
      }

      expand() {
        this.isExpanding = true;
        const startHeight = this.el.style.height;
        const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight + this.borderThickness}px`;

        if (this.animation) {
          this.animation.cancel();
        }
        if (!this.prefersReducedMotion.matches) {
          this.animation = this.animate([startHeight, endHeight]);

          this.animation.onfinish = () => this.onAnimationFinish(true);
          this.animation.oncancel = () => (this.isExpanding = false);
        } else {
          this.onAnimationFinish(true);
        }
      }

      animate(height) {
        return this.el.animate(
          {
            height: height,
          },
          {
            duration: 300,
            easing: 'ease',
          }
        );
      }

      onAnimationFinish(open) {
        this.el.open = open;
        this.animation = null;
        this.isClosing = false;
        this.isExpanding = false;
        this.el.style.height = this.el.style.overflow = '';
      }
    }
  );
}

class SlideshowComponent extends SliderComponent {
  constructor() {
    super();
    this.announcementBarSlider = this.classList.contains('announcement-bar__slideshow');
    this.sliderControlWrapper = this.querySelector('.slider-component__controls');
    this.enableSliderLooping = this.slider.dataset.looping === 'true';
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion.addEventListener('change', () => {
      if (this.slider.getAttribute('data-slider-autoplay') === 'true') this.setAutoPlay();
    });

    if (this.sliderItems.length <= 1) return this.hideSlideshow();

    this.sliderFirstItemNode = this.slider.querySelector('.slideshow__slide');
    this.slider.addEventListener('keyup', this.onKeyUp.bind(this));

    this.setSlideVisibility();

    if (this.animationStyle === 'fade') {
      this.touchstartX = 0;
      this.touchendX = 0;
      this.sliderItems.forEach((item) => {
        if (item.querySelector('product-model')) return;

        item.addEventListener('touchstart', (e) => {
          this.touchstartX = e.changedTouches[0].screenX;
        });

        item.addEventListener('touchend', (e) => {
          this.touchendX = e.changedTouches[0].screenX;
          this.onSwipe();
        });
      });
    } else {
      this.slideObserver = new IntersectionObserver(
        (elements, observer) => {
          elements.forEach((element) => {
            if (element.intersectionRatio > 0.5) {
              this.currentPage = parseInt(element.target.dataset.index) + 1;
              this.update();
            }
          });
        },
        {
          threshold: [0.5],
        }
      );
      this.sliderItems.forEach((item) => {
        this.slideObserver.observe(item);
      });
    }

    if (this.announcementBarSlider) {
      this.announcementBarArrowButtonWasClicked = false;

      [...this.prevButton, ...this.nextButton].forEach((button) => {
        button.addEventListener('click', () => {
          this.announcementBarArrowButtonWasClicked = true;
          setTimeout(() => {
            button.focus();
          }, 500);
        });
      });
    }

    this.observer = new IntersectionObserver(
      (elements, observer) => {
        elements.forEach((element) => {
          if (element.isIntersecting) {
            if (this.slider.getAttribute('data-slider-autoplay') === 'true') this.setAutoPlay();
          } else {
            this.pause();
          }
        });
      },
      {
        threshold: [0, 1],
      }
    );
    this.observer.observe(this);
  }

  onKeyUp(event) {
    if (
      (event.code.toUpperCase() === 'ARROWRIGHT' && document.dir !== 'rtl') ||
      (event.code.toUpperCase() === 'ARROWLEFT' && document.dir === 'rtl')
    ) {
      this.calculateFromDirection('next');
    } else if (
      (event.code.toUpperCase() === 'ARROWLEFT' && document.dir !== 'rtl') ||
      (event.code.toUpperCase() === 'ARROWRIGHT' && document.dir === 'rtl')
    ) {
      this.calculateFromDirection('previous');
    }
  }

  setAutoPlay() {
    this.autoplaySpeed = this.slider.dataset.speed * 1000;
    this.addEventListener('mouseover', this.focusInHandling.bind(this));
    this.addEventListener('mouseleave', this.focusOutHandling.bind(this));
    this.addEventListener('focusin', this.focusInHandling.bind(this));
    this.addEventListener('focusout', this.focusOutHandling.bind(this));

    if (this.querySelector('[data-autoplay-control]')) {
      this.sliderAutoplayButton = this.querySelector('play-pause-button');
      this.sliderAutoplayButton.addEventListener('click', this.autoPlayToggle.bind(this));
      this.autoplayButtonIsSetToPlay = true;
      this.sliderAutoplayButton.setAttribute('data-playing', true);
      this.play();
    } else {
      this.reducedMotion.matches || this.announcementBarArrowButtonWasClicked ? this.pause() : this.play();
    }
  }

  onButtonClick(event) {
    if (event.currentTarget.getAttribute('aria-disabled') === 'true') {
      return;
    }
    super.onButtonClick(event);

    this.wasClicked = true;
    this.calculateFade();
    if (!this.enableSliderLooping) return;

    if (this.announcementBarSlider) this.pause();
  }

  calculateFade() {
    if (this.animationStyle === 'fade') {
      this.sliderItems.forEach((el, index) => {
        if (this.currentPage === index + 1) {
          el.setAttribute('aria-hidden', false);
        } else {
          el.setAttribute('aria-hidden', true);
        }
      });
      this.update();
      this.setSlideVisibility();
    }
  }

  onSwipe() {
    const swipeRight = this.touchendX < this.touchstartX && this.touchstartX - this.touchendX > 50;
    const swipeLeft = this.touchendX > this.touchstartX && this.touchendX - this.touchstartX > 50;
    if ((swipeRight && document.dir !== 'rtl') || (swipeLeft && document.dir === 'rtl')) {
      this.calculateFromDirection('next');
    } else if ((swipeLeft && document.dir !== 'rtl') || (swipeRight && document.dir === 'rtl')) {
      this.calculateFromDirection('previous');
    }
  }

  calculateFromDirection(direction, jump) {
    super.calculateFromDirection(direction, jump);
    this.calculateFade();
  }

  setSlidePosition(position, skipAnimation = false) {
    if (this.setPositionTimeout) clearTimeout(this.setPositionTimeout);
    this.setPositionTimeout = setTimeout(() => {
      this.slider.scrollTo({
        left: position,
        behavior: skipAnimation ? 'instant' : 'smooth',
      });
    }, this.announcerBarAnimationDelay);
  }

  autoPlayToggle() {
    this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
    this.autoplayButtonIsSetToPlay ? this.pause() : this.play();
    this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
  }

  focusOutHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
      if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
      this.play();
    } else if (!this.reducedMotion.matches && !this.announcementBarArrowButtonWasClicked) {
      this.play();
    }
  }

  focusInHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
      if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
        this.play();
      } else if (this.autoplayButtonIsSetToPlay) {
        this.pause();
      }
    } else if (this.announcementBarSlider && this.contains(event.target)) {
      this.pause();
    }
  }

  play() {
    this.slider.setAttribute('aria-live', 'off');
    clearInterval(this.autoplay);
    this.autoplay = setInterval(this.autoRotateSlides.bind(this), this.autoplaySpeed);
  }

  pause() {
    this.slider.setAttribute('aria-live', 'polite');
    clearInterval(this.autoplay);
  }

  togglePlayButtonState(pauseAutoplay) {
    if (pauseAutoplay) {
      this.sliderAutoplayButton.setAttribute('data-playing', false);
    } else {
      this.sliderAutoplayButton.setAttribute('data-playing', true);
    }
  }

  autoRotateSlides() {
    let slideScrollPosition;
    this.calculateFromDirection('next');
    let newPos = this.slider.scrollLeft + this.sliderItemOffset;
    if (document.dir === 'rtl') {
      newPos = this.slider.scrollLeft - this.sliderItemOffset;
    }
    if (this.enableSliderLooping) {
      slideScrollPosition = this.currentPage === this.sliderItems.length ? 0 : newPos;
    } else {
      if (this.currentPage === this.sliderItems.length) return;
      slideScrollPosition = newPos;
    }
    this.setSlidePosition(slideScrollPosition);
  }

  setSlideVisibility() {
    this.sliderItems.forEach((item, index) => {
      const focusableElements = getFocusableElements(item);
      if (index === this.currentPage - 1) {
        focusableElements.forEach((el) => {
          el.removeAttribute('tabindex');
        });
        item.setAttribute('aria-hidden', 'false');
        item.removeAttribute('tabindex');
        const autoplay = item.querySelector('[data-autoplay="true"]');
        if (autoplay) {
          setTimeout(() => {
            autoplay.play();
          });
        }
      } else {
        focusableElements.forEach((el) => {
          el.setAttribute('tabindex', '-1');
        });
        item.setAttribute('aria-hidden', 'true');
        item.setAttribute('tabindex', '-1');
        pauseAllMedia(this);
      }
    });
    this.wasClicked = false;
  }

  jumpToSlide(slide, skipAnimation) {
    if (!slide) return;
    super.jumpToSlide(slide, skipAnimation);
    this.currentPage = [...this.sliderItems].findIndex((item) => item === slide) + 1;
    slide.setAttribute('aria-hidden', false);

    this.calculateFade();
    this.setSlideVisibility();
  }
}
customElements.define('slideshow-component', SlideshowComponent);

class VariantPicker extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.addEventListener('change', (e) => {
      const target = e.target.tagName === 'SELECT' ? e.target.selectedOptions[0] : e.target;
      this.updateSelectionMetadata(e);

      const event = new CustomEvent('option-value:change', {
        detail: {
          target,
          selectedOptionValues: this.selectedOptionValues,
          focusId: e.target.id,
        },
      });
      document.dispatchEvent(event);
    });
  }

  updateSelectionMetadata({ target }) {
    const { value, tagName } = target;

    if (tagName === 'SELECT' && target.selectedOptions.length) {
      Array.from(target.options)
        .find((option) => option.getAttribute('selected'))
        .removeAttribute('selected');
      target.selectedOptions[0].setAttribute('selected', 'selected');
    }
  }

  get selectedOptionValues() {
    return Array.from(this.querySelectorAll('select option[selected], fieldset input:checked')).map(
      ({ dataset }) => dataset.optionValueId
    );
  }
}

customElements.define('variant-picker', VariantPicker);

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });
    this.input.addEventListener('change', this.onInputChange.bind(this));
    this.input.addEventListener('input', this.updateQuantityInputWidth.bind(this));
    this.querySelectorAll('button').forEach((button) =>
      button.addEventListener('click', this.onButtonClick.bind(this))
    );
    this.updateQuantityInputWidth();
  }

  connectedCallback() {
    this.validateQtyRules();
    document.addEventListener('quantity-update', this.validateQtyRules.bind(this));
  }

  disconnectedCallback() {
    document.removeEventListener('quantity-update', this.validateQtyRules.bind(this));
  }

  onInputChange(event) {
    this.validateQtyRules();
    this.updateQuantityInputWidth();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    if (event.currentTarget.name === 'plus') {
      if (parseInt(this.input.dataset.min) > parseInt(this.input.step) && this.input.value == 0) {
        this.input.value = this.input.dataset.min;
      } else {
        this.input.stepUp();
      }
    } else {
      this.input.stepDown();
    }

    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);

    if (this.input.dataset.min === previousValue && event.target.name === 'minus') {
      this.input.value = parseInt(this.input.min);
    }

    window.utils.announce(this.input.value);
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const buttonMinus = this.querySelector("[name='minus']");
      if (parseInt(value) <= parseInt(this.input.min)) {
        buttonMinus.setAttribute('aria-disabled', true);
      } else {
        buttonMinus.removeAttribute('aria-disabled');
      }
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector("[name='plus']");
      if (value >= max) {
        buttonPlus.setAttribute('aria-disabled', true);
      } else {
        buttonPlus.removeAttribute('aria-disabled');
      }
    }
  }

  updateQuantityInputWidth() {
    this.style.setProperty('--quantity-input-character-count', `${this.input.value.length}ch`);
  }
}

customElements.define('quantity-input', QuantityInput);

class QuickAddButton extends HTMLElement {
  constructor() {
    super();
    this.button = this.querySelector('button');
    if (!this.button) return;
    this.button.addEventListener('click', this.onButtonClick.bind(this));
    document.addEventListener(`dialog:quickadd-loaded`, this.onQuickAddLoaded.bind(this));
  }

  onButtonClick() {
    const event = new CustomEvent(`dialog:quickadd`, {
      detail: {
        url: this.dataset.url,
      },
    });
    document.dispatchEvent(event);
    this.button.classList.add('loading');
  }

  onQuickAddLoaded() {
    this.button.classList.remove('loading');
  }
}

customElements.define('quick-add-button', QuickAddButton);

class QuickAddModal extends CustomDialog {
  constructor() {
    super();
    this.dialogWindow = this.querySelector('.dialog__window');
    this.body = this.querySelector('[data-body]');
    this.header = this.querySelector('[data-header]');
    document.addEventListener(`dialog:quickadd`, this.loadQuickAdd.bind(this));
  }

  loadQuickAdd(event) {
    fetch(`${event.detail.url}`)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const page = html.querySelector('product-page');
        const colorScheme = page.closest('[data-color-scheme]').dataset.colorScheme;
        const id = page.closest('.shopify-section').getAttribute('id');
        this.body.id = id;
        this.updateHTML(page, colorScheme);
        const event = new CustomEvent(`dialog:quickadd-loaded`);
        document.dispatchEvent(event);
      })
      .catch((e) => console.error(e));
  }

  updateHTML(page, colorScheme) {
    const mediaScheme = page.dataset.mediaScheme;
    const mediaButton = page.dataset.mediaButton;
    this.header.setAttribute('data-color-scheme', mediaScheme);
    const button = this.header.querySelector('[data-close]');
    button.classList.remove(...['button--text', 'button--primary', 'button--secondary']);
    button.classList.add(`button--${mediaButton}`);

    page.removeAttribute('data-update-url');
    page.querySelector('[data-destroy]')?.removeAttribute('data-destroy');
    const removeElements = page.querySelectorAll('[data-quick-add-remove]');
    removeElements.forEach((el) => {
      el.remove();
    });
    const window = this.querySelector('.dialog__window');
    window.setAttribute('data-color-scheme', colorScheme);
    if (!page.querySelector('.media-gallery--mobile-max')) {
      this.header.classList.add('quick-add__dialog-header--absolute');
    }

    const scripts = page.querySelectorAll('script');
    const scriptEls = [];
    scripts.forEach((script) => {
      const src = script.getAttribute('src');
      if (src && !document.querySelector(`script[src="${src}"]`)) {
        const scriptEl = document.createElement('script');
        scriptEl.src = src;
        scriptEls.push(scriptEl);
      }
      script.remove();
    });

    const replaceDescription = page.querySelector('[data-description]');
    const replaceEl = page.querySelector('[data-replace-description]');
    if (replaceDescription && replaceEl) {
      replaceEl.innerHTML = replaceDescription.innerHTML;
    }

    const removeContainer = page.querySelector('.product-info__container');
    if (removeContainer) {
      removeContainer.classList.forEach((cls) => {
        if (cls.startsWith('container--')) {
          removeContainer.classList.remove(cls);
        }
      });
    }

    this.body.replaceChildren(page);
    scriptEls.map((el) => {
      document.body.appendChild(el);
    });
    this.openDialog();
    this.dialogWindow.scrollTo(0, 0);
    const media = page.querySelectorAll('[data-autoplay="true"]');
    media.forEach((media) => {
      media.loadContent();
    });
  }
}

customElements.define('quick-add-modal', QuickAddModal);

class ErrorModal extends CustomDialog {
  constructor() {
    super();
    this.body = this.querySelector('[data-body]');
    document.addEventListener(`cart:error`, this.onError.bind(this));
    document.addEventListener(`rendering:error`, this.onRenderingError.bind(this));
  }

  onError(event) {
    if (Array.isArray(event.detail.errors)) {
      this.body.innerHTML =
        Object.keys(event.detail.errors)
          .map((key, index) => {
            return event.detail.errors[key];
          })
          .join('. ') + '.';
    } else {
      this.body.innerHTML = event.detail.message;
    }
    this.openDialog();
  }

  onRenderingError() {
    this.body.innerHTML = window.accessibilityStrings.generalError;
    this.openDialog();
  }
}

customElements.define('error-modal', ErrorModal);

const isYoutubeLoaded = new Promise((resolve) => {
  window.onYouTubeIframeAPIReady = () => resolve();
});

class ExternalMedia extends DeferredMedia {
  constructor() {
    super();
    this.type = this.dataset.host;
  }

  loadContent() {
    super.loadContent((focus = false));
    this.muted = this.dataset.autoplay === 'true';
    return new Promise(async (resolve) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';

      if (this.type === 'youtube') {
        if (!window.YT || !window.YT.Player) {
          script.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(script);
          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }
        await isYoutubeLoaded;
        const iframe = this.querySelector('iframe');
        this.player = new YT.Player(iframe, {
          events: {
            onReady: () => {
              if (this.muted) {
                this.player.mute();
              }
              this.player.playVideo();
              resolve();
            },
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.PLAYING) {
                this.setAttribute('data-playing', 'true');
              } else if (event.data === YT.PlayerState.ENDED || event.data === YT.PlayerState.PAUSED) {
                this.removeAttribute('data-playing');
              }
            },
          },
        });
      }
      if (this.type === 'vimeo') {
        if (!window.Vimeo || !window.Vimeo.Player) {
          script.src = 'https://player.vimeo.com/api/player.js';
          document.head.appendChild(script);
          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }
        this.player = new Vimeo.Player(this.querySelector('iframe'));
        if (this.muted) {
          this.player.setMuted(true);
        }
        this.player.on('play', () => {
          this.setAttribute('data-playing', 'true');
        });
        this.player.on('pause', () => this.removeAttribute('data-playing'));
        this.player.on('ended', () => this.removeAttribute('data-playing'));
        this.player.play();
        resolve();
      }
    });
  }

  play() {
    if (!this.player) return;
    if (this.type == 'youtube' && typeof this.player.playVideo == 'function') {
      this.player?.playVideo();
    }
    if (this.type == 'vimeo' && typeof this.player.play == 'function') {
      this.player?.play();
    }
  }

  pause() {
    if (!this.player) return;
    if (this.type == 'youtube' && typeof this.player.pauseVideo == 'function') {
      this.player?.pauseVideo();
    }
    if (this.type == 'vimeo' && typeof this.player.pause == 'function') {
      this.player?.pause();
    }
  }
}

customElements.define('external-media', ExternalMedia);

class ProductForm extends HTMLElement {
  constructor() {
    super();

    this.form = this.querySelector('form');
    this.variantIdInput.disabled = false;
    this.form.addEventListener('submit', this.onSubmitHandler.bind(this));

    this.cart = document.querySelector('cart-items');

    this.submitButton = this.querySelector('[type="submit"]');
    this.submitButtonText = this.submitButton.querySelector('span');

    if (document.querySelector('.cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
    this.hideErrors = this.dataset.hideErrors === 'true';
  }

  onSubmitHandler(event) {
    event.preventDefault();
    if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

    this.handleErrorMessage();

    this.submitButton.setAttribute('aria-disabled', true);
    this.submitButton.classList.add('loading');

    const config = {
      method: 'POST',
      headers: { Accept: 'application/javascript', 'X-Requested-With': 'XMLHttpRequest' },
    };

    const formData = new FormData(this.form);

    if (this.cart) {
      formData.append(
        'sections',
        this.cart.getSectionsToRender().map((section) => section.section)
      );
      formData.append('sections_url', window.location.pathname);
    }

    config.body = formData;

    fetch(`${routes.cart_add_url}`, config)
      .then((response) => response.json())
      .then((response) => {
        if (response.status) {
          const event = new CustomEvent('cart:error', {
            detail: {
              source: 'product-form',
              productVariantId: formData.get('id'),
              errors: response.errors,
              message: response.description || response.message,
            },
          });
          document.dispatchEvent(event);
          this.handleErrorMessage(response.description);
          const quickAddError = this.submitButton.querySelector('[data-error]');
          if (!quickAddError) {
            const cartDrawer = document.querySelector('cart-items');
            cartDrawer?.refreshCart();
          }
          if (!quickAddError) return;
          this.submitButton.setAttribute('aria-disabled', true);
          quickAddError.classList.remove('hidden');
          this.error = true;
          return;
        } else if (!this.cart) {
          window.location = window.routes.cart_url;
          return;
        }

        if (!this.error) {
          const event = new CustomEvent('cart:update', {
            detail: {
              source: 'product-form',
              productVariantId: formData.get('id'),
              cartData: response,
            },
          });
          document.dispatchEvent(event);
        }

        this.error = false;
        window.utils.announce(window.accessibilityStrings.itemAdded);

        const event = new CustomEvent(`dialog:force-close:quick-add`);
        document.dispatchEvent(event);

        setTimeout(() => {
          this.cart.renderContents(response);
        });
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        this.submitButton.classList.remove('loading');

        if (!this.error) this.submitButton.removeAttribute('aria-disabled');
      });
  }

  handleErrorMessage(errorMessage = false) {
    if (this.hideErrors) return;

    this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('[data-error]');
    if (!this.errorMessageWrapper) return;

    this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('span');
    this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

    if (errorMessage) {
      this.errorMessage.textContent = errorMessage;
    }
  }

  toggleSubmitButton(disable = true, text) {
    if (disable) {
      this.submitButton.setAttribute('aria-disabled', true);
      if (text) this.submitButtonText.textContent = text;
    } else {
      this.submitButton.removeAttribute('aria-disabled');
      this.submitButtonText.textContent = window.variantStrings.addToCart;
    }
  }

  get variantIdInput() {
    return this.form.querySelector('[name=id]');
  }
}

customElements.define('product-form', ProductForm);
