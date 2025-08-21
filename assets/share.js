if (!customElements.get('share-button')) {
  customElements.define(
    'share-button',
    class ShareButton extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        if (navigator.share) {
          this.shareButton.addEventListener('click', () => {
            navigator.share({ url: this.urlToShare, title: document.title });
          });
        } else {
          this.shareButton.addEventListener('click', () => {
            navigator.clipboard.writeText(this.urlToShare).then(() => {
              this.shareButton.setAttribute('data-copied', true);
              window.utils.announce(window.accessibilityStrings.shareSuccessMessage);

              setTimeout(() => {
                this.shareButton.setAttribute('data-copied', false);
              }, 2000);
            });
          });
        }
      }

      updateURL(url) {
        this.dataset.shareUrl = url;
      }

      get shareButton() {
        return this.querySelector('button');
      }

      get urlToShare() {
        return this.dataset.shareUrl ? this.dataset.shareUrl : document.location.href;
      }
    }
  );
}
