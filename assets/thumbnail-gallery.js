if (!customElements.get('thumbnail-gallery')) {
  customElements.define(
    'thumbnail-gallery',
    class ThumbnailGallery extends HTMLElement {
      constructor() {
        super();
        this.thumbnails = this.querySelectorAll('[data-thumbnail]');
        this.media = this.querySelectorAll('[data-media-id]');

        this.thumbnails.forEach((thumbnail) => {
          thumbnail.addEventListener('click', this.onClick.bind(this));
        });
      }

      onClick(event) {
        const id = event.currentTarget.dataset.thumbnail;

        this.activateMedia(id);
      }

      activateMedia(id) {
        const hasActive = [...this.media].find((el) => el.dataset.mediaId === id);
        if (!hasActive) return;
        this.media.forEach((el) => {
          if (el.dataset.mediaId === id) {
            el.setAttribute('data-active', true);

            const autoplay = el.querySelector('[data-autoplay="true"]');
            if (autoplay) {
              autoplay.play();
            }
          } else {
            el.removeAttribute('data-active');
            pauseAllMedia(el);
          }
        });
        this.thumbnails.forEach((el) => {
          if (el.dataset.thumbnail === id) {
            el.setAttribute('aria-pressed', true);
          } else {
            el.removeAttribute('aria-pressed');
          }
        });
      }
    }
  );
}
