document.addEventListener('shopify:section:load', function (event) {
  if (event.target.classList.contains('dialog-section')) {
    const modalName = event.target.querySelector('[data-name]').dataset.name;
    const customEvent = new CustomEvent(`dialog:trigger:${modalName}`);
    document.dispatchEvent(customEvent);
  }
});

document.addEventListener('shopify:section:select', function (event) {
  if (event.target.classList.contains('dialog-section')) {
    const modalName = event.target.querySelector('[data-name]').dataset.name;
    const customEvent = new CustomEvent(`dialog:trigger:${modalName}`);
    document.dispatchEvent(customEvent);
  }
});

document.addEventListener('shopify:section:deselect', function (event) {
  if (event.target.classList.contains('dialog-section')) {
    const dialog = event.target.querySelector('custom-dialog, menu-drawer, quick-add-modal, error-modal');
    dialog.closeDialog();
  }
});

document.addEventListener('shopify:block:deselect', function (event) {
  if (event.target.dataset.submenu === 'megamenu') {
    document.querySelector('header-menu').closeSubmenu(event.target);
  }

  if (event.target.classList.contains('stacked-images-with-text__image-wrapper')) {
    document.scrollTo({ top: 0, behavior: 'auto' });
    event.target.scrollIntoView();
  }
});

document.addEventListener('shopify:block:select', function (event) {
  const details = event.target.closest('collapsible-content details');
  if (details) {
    details.setAttribute('open', true);
  }
  if (event.target.dataset.submenu === 'megamenu') {
    document.querySelector('header-menu').openSubmenu(event.target);
  }
  if (event.target.classList.contains('slideshow__slide')) {
    const parentSlideshowComponent = event.target.closest('slideshow-component');
    if (parentSlideshowComponent.pause) {
      parentSlideshowComponent.pause();
    }
    parentSlideshowComponent.jumpToSlide(event.target);
  }
  if (event.target.classList.contains('slider-component__item')) {
    const parentSlideshowComponent = event.target.closest('slider-component');
    parentSlideshowComponent.jumpToSlide(event.target);
  }
  if (event.target.dataset.submenu === 'megamenu') {
    document.querySelector('header-menu').openSubmenu(event.target);
  }
});

document.addEventListener('shopify:block:deselect', function (event) {
  if (event.target.dataset.submenu === 'megamenu') {
    document.querySelector('header-menu').closeSubmenu(event.target);
  }
});

document.addEventListener('shopify:section:load', (event) => {
  initScrollAnimationTrigger(event.target, true);
  initVideoAutoplayTrigger();
});

document.addEventListener('shopify:section:reorder', () => {
  initScrollAnimationTrigger(document, true);
  initVideoAutoplayTrigger();
});
