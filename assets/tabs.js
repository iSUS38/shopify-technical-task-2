if (!customElements.get('custom-tabs')) {
  customElements.define(
    'custom-tabs',
    class CustomTabs extends HTMLElement {
      tabs = [];
      tabItems = null;
      panels = null;
      currentIndex = -1;
      isVerticalOrientation = false;

      constructor() {
        super();
        const initialActiveIndex = this.dataset.activeIndex || 0;
        this.windowWidth = 0;
        this.tabItems = this.querySelectorAll(`[role="tab"]`);
        this.panels = this.querySelectorAll('[role="tabpanel"]');
        this.tablist = this.querySelector('[role="tablist"]');
        const orientation = this.tablist.getAttribute('aria-orientation');
        this.tablistContainer = this.querySelector('[data-tab-container]');
        this.isVerticalOrientation = orientation && orientation === 'vertical' ? true : false;
        this.currentIndex = initialActiveIndex;
        this.selectTab = this.selectTab.bind(this);
        this.deselectTabs = this.deselectTabs.bind(this);
        this.resetPanels = this.resetPanels.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.initTabs();
        this.observer = new ResizeObserver((entries) => {
          this.checkCollapse();
        });
        this.observer.observe(document.documentElement);
        this.checkCollapse();
      }

      checkCollapse() {
        if (this.windowWidth !== window.innerWidth) {
          this.windowWidth = window.innerWidth;
          if (this.tablist.clientWidth > this.tablistContainer.clientWidth) {
            this.tablistContainer.classList.remove('tab-nav--collapsed');
          } else {
            this.tablistContainer.classList.add('tab-nav--collapsed');
          }
        }
      }

      initTabs() {
        this.resetPanels();
        this.deselectTabs();
        for (let i = 0; i < this.tabItems.length; i++) {
          const tab = this.tabItems[i];
          this.tabs[i] = tab;
          this.tabs[i].index = i;
          tab.addEventListener('click', this.handleClick);
          tab.addEventListener('keydown', this.handleKeydown);
          if (i === this.currentIndex) {
            this._selectTab(tab);
          }
        }
      }

      activatePanel(panelId) {
        document.querySelector(`#${panelId}`).removeAttribute('hidden');
        document.querySelector(`#${panelId}`).setAttribute('aria-expanded', true);
      }

      deselectTabs() {
        for (let i = 0; i < this.tabItems.length; i++) {
          const tab = this.tabItems[i];
          tab.classList.remove('active');
          tab.setAttribute('tabindex', '-1');
          tab.setAttribute('aria-selected', false);
        }
      }

      resetPanels() {
        for (let j = 0; j < this.panels.length; j++) {
          const panel = this.panels[j];
          panel.setAttribute('hidden', true);
          panel.setAttribute('aria-expanded', false);
          panel.setAttribute('tabindex', '0');
        }
      }

      selectTab(tabElement) {
        this.deselectTabs();
        this.resetPanels();
        this._selectTab(tabElement);
      }

      _selectTab(tabElement) {
        tabElement.classList.add('active');
        tabElement.setAttribute('aria-selected', 'true');
        tabElement.removeAttribute('tabindex');
        this.activatePanel(tabElement.getAttribute('aria-controls'));
      }

      handleClick(event) {
        this.selectTab(event.currentTarget);
      }

      decrementIndex() {
        this.currentIndex--;
        if (this.currentIndex < 0) {
          this.currentIndex = this.tabItems.length - 1;
        }
      }

      incrementIndex() {
        this.currentIndex++;
        if (this.currentIndex >= this.tabItems.length) {
          this.currentIndex = 0;
        }
      }

      handleKeydown(event) {
        switch (event.key) {
          case 'Up':
          case 'ArrowUp':
            if (this.isVerticalOrientation) {
              this.decrementIndex();
              break;
            }
          case 'Down':
          case 'ArrowDown':
            if (this.isVerticalOrientation) {
              this.incrementIndex();
              break;
            }
          case 'Left':
          case 'ArrowLeft':
            if (!this.isVerticalOrientation) {
              this.decrementIndex();
              break;
            }
          case 'Right':
          case 'ArrowRight':
            if (!this.isVerticalOrientation) {
              this.incrementIndex();
              break;
            }
          case 'Home':
          case 'ArrowHome':
            this.currentIndex = 0;
            break;
          case 'End':
          case 'ArrowEnd':
            this.currentIndex = this.tabItems.length - 1;
            break;
          case 'Enter':
          case 'Space':
            this.selectTab(event.target);
            event.target.focus();
            break;
          default:
            return;
        }
        event.preventDefault();
        this.tabs[this.currentIndex].focus();
      }
    }
  );
}
