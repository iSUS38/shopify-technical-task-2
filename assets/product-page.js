if (!customElements.get('product-page')) {
  customElements.define(
    'product-page',
    class ProductInfo extends HTMLElement {
      abortController = undefined;

      constructor() {
        super();

        this.variantDataSelectors = ['[data-price]', '[data-sku]', '[data-inventory]', 'pickup-availability'];
      }

      connectedCallback() {
        document.addEventListener('option-value:change', this.handleOptionValueChange.bind(this));
        document.addEventListener('cart:update', this.updateQuantityLabel.bind(this));
      }

      disconnectedCallback() {
        document.removeEventListener('option-value:change', this.handleOptionValueChange.bind(this));
      }

      handleOptionValueChange({ detail: { target, selectedOptionValues, focusId, activeEl } }) {
        if (!this.contains(target)) return;

        this.resetProductFormState();

        const productUrl = this.dataset.url;
        const requestUrl = this.buildRequestUrlWithParams(productUrl, selectedOptionValues);
        this.abortController?.abort();
        this.abortController = new AbortController();

        fetch(requestUrl, { signal: this.abortController.signal })
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            return this.handleUpdateProductInfo(html, productUrl, target.id);
          })
          .then(() => {
            const override = document.getElementById(`combobox-${focusId}`);
            if (override) {
              override.focus();
            } else {
              document.querySelector(`#${focusId}`).focus();
            }
          })
          .catch((error) => {
            console.log(error);
          });
      }

      resetProductFormState() {
        const productForm = this.productForm;
        productForm?.toggleSubmitButton(true);
      }

      setAvailable() {
        for (const el of this.variantDataSelectors) {
          const elements = this.querySelectorAll(el);
          elements.forEach((el) => el.classList.remove('hidden'));
        }
      }

      setUnavailable() {
        for (const el of this.variantDataSelectors) {
          const elements = this.querySelectorAll(el);
          elements.forEach((el) => el.classList.add('hidden'));
        }
      }

      handleUpdateProductInfo(html, productUrl) {
        const variant = this.getSelectedVariant(html);

        this.setAvailable();

        // Update selects
        const oldNode = this.querySelector('variant-picker');
        const newNode = html.querySelector('variant-picker');
        if (newNode) HTMLUpdateUtility.viewTransition(oldNode, newNode);

        // Update url
        this.updateURL(productUrl, variant);

        // Update pickup availability
        this.pickupAvailability?.forEach((el) => el.update(variant));

        // Update hidden input
        const productFormId = this.dataset.productFormId;
        if (variant) {
          this.querySelectorAll(`#${productFormId}, #${productFormId}-installments`).forEach((productForm) => {
            const input = productForm.querySelector('input[name="id"]');
            input.value = variant.id ?? '';
            input.dispatchEvent(new Event('change', { bubbles: true }));
          });
        }

        // Update other UI elements
        this.updateElement(html, '[data-price]');
        this.updateElement(html, '[data-quantity-label]');
        this.updateElement(html, '[data-sku]');
        this.updateElement(html, '[data-inventory]');
        this.updateElement(html, '[data-share]');

        if (!variant) {
          this.productForm?.toggleSubmitButton(true, window.variantStrings.unavailable);
          this.setUnavailable();
          return;
        } else {
          this.productForm?.toggleSubmitButton(
            html.querySelector('[type="submit"]')?.hasAttribute('aria-disabled') ?? true,
            window.variantStrings.soldOut
          );
        }

        const event = new CustomEvent('variant:change', {
          detail: {
            sectionId: this.sectionId,
            html,
            variant,
          },
        });
        document.dispatchEvent(event);
      }

      getSelectedVariant(html) {
        const selectedVariant = html.querySelector('variant-picker [data-selected-variant]')?.innerHTML;
        return !!selectedVariant ? JSON.parse(selectedVariant) : null;
      }

      buildRequestUrlWithParams(productUrl, selectedOptionValues) {
        const params = [];
        params.push(`section_id=${this.dataset.section}`);
        if (selectedOptionValues.length) params.push(`option_values=${selectedOptionValues.join(',')}`);
        return `${productUrl}?${params.join('&')}`;
      }

      updateElement(html, selector) {
        const source = html.querySelector(selector);
        const destination = this.querySelectorAll(selector);
        if (source && destination) destination.forEach((dest) => (dest.innerHTML = source.innerHTML));
      }

      updateQuantityLabel() {
        const currentVariantId = this.productForm?.variantIdInput?.value;
        if (!currentVariantId) return;

        fetch(`${this.dataset.url}?variant=${currentVariantId}&section_id=${this.dataset.section}`)
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            this.updateElement(html, '[data-quantity-label]');
          })
          .catch((e) => console.error(e));
      }

      updateURL(productUrl, variant) {
        if (!variant) return;
        if (this.hasAttribute('data-update-url') === true) {
          window.history.replaceState({}, '', `${productUrl}${variant.id ? `?variant=${variant.id}` : ''}`);
        }

        this.querySelector('share-button')?.updateURL(
          `${window.shopUrl}${productUrl}${variant.id ? `?variant=${variant.id}` : ''}`
        );
      }

      get productForm() {
        return this.querySelector(`product-form`);
      }

      get sectionId() {
        return this.dataset.section;
      }

      get pickupAvailability() {
        return this.querySelectorAll(`pickup-availability`);
      }
    }
  );
}
