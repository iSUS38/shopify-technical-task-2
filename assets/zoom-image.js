if (!customElements.get('zoom-image')) {
  customElements.define(
    'zoom-image',
    class ZoomImage extends HTMLElement {
      constructor() {
        super();
        this.x = 0.5;
        this.y = 0.5;
        this.button = this.querySelector('[data-zoom-button]');
        this.modal = document.querySelector('custom-dialog[data-name="zoom"]');
        this.content = this.modal.querySelector('[data-content]');
        this.loadingSpinner = this.querySelector('.loading__spinner');
        if (window.matchMedia('(min-width: 48em)').matches) {
          this.showInline = true;
        }

        this.button.addEventListener('click', (event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          this.x = (event.clientX - rect.left) / rect.width;
          this.y = (event.clientY - rect.top) / rect.height;
          if (this.showInline) {
            if (
              document.documentElement.getAttribute('data-what-intent') === 'keyboard' ||
              ((event.clientX > 0 || event.clientY > 0) && event.pointerType === 'mouse')
            ) {
              this.activateHoverZoom();
            } else {
              this.openZoomModal();
            }
          } else {
            this.openZoomModal();
          }
        });

        document.addEventListener('dialog:open:zoom', (event) => {
          this.scrollToPosition();
          const content = this.modal.querySelector('[data-content]');
          content?.focus();
        });
      }

      activateHoverZoom() {
        this.isHovering = true;
        if (this.overlay) {
          return this.overlay.classList.remove('hidden');
        }
        this.loadingSpinner.classList.remove('hidden');
        const image = this.querySelector('img');
        image.style.opacity = '50%';
        const overlayImage = document.createElement('img');
        overlayImage.setAttribute('src', `${image.src}`);

        const overlay = document.createElement('div');
        overlay.classList.add('zoom__zoom-image');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.style.backgroundImage = `url('${image.src}')`;
        overlay.addEventListener('mousemove', (event) => this.hoverMove(image, overlay, event));
        overlay.addEventListener('click', (event) => this.hideHoverZoom());
        overlay.addEventListener('mouseleave', (event) => {
          this.isHovering = false;
          setTimeout(() => {
            if (this.isHovering === false) {
              this.hideHoverZoom();
            }
          }, 100);
        });

        this.overlay = overlay;

        overlayImage.onload = () => {
          this.loadingSpinner.classList.add('hidden');
          image.after(overlay);
          image.style.opacity = '100%';
        };
      }

      hideHoverZoom() {
        this.isHovering = false;
        this.overlay.classList.add('hidden');
      }

      hoverMove(image, overlay, event) {
        this.isHovering = true;
        const zoomRatio = 2;
        const ratio = image.height / image.width;
        const container = event.target.getBoundingClientRect();
        const xPosition = event.clientX - container.left;
        const yPosition = event.clientY - container.top;
        const xPercent = `${xPosition / (image.clientWidth / 100)}%`;
        const yPercent = `${yPosition / ((image.clientWidth * ratio) / 100)}%`;

        // determine what to show in the frame
        overlay.style.backgroundPosition = `${xPercent} ${yPercent}`;
        overlay.style.backgroundSize = `${image.width * zoomRatio}px`;
      }

      openZoomModal() {
        const img = this.getImageTag();
        this.content.replaceChildren(img);
        this.modal.openDialog();
      }

      scrollToPosition() {
        setTimeout(() => {
          const img = this.content.querySelector('img');
          this.content.scrollTo({
            left: this.x * img.width - window.innerWidth / 2,
            top: this.y * img.height - window.innerHeight / 2,
          });
        }, 50);
      }

      getImageTag() {
        const img = this.querySelector('img');
        const largestSrc = img.src.replace(/&width=\d+/, '');
        const newImg = document.createElement('img');
        newImg.src = largestSrc;
        newImg.alt = img.getAttribute('alt');
        newImg.width = img.getAttribute('width');
        newImg.height = img.getAttribute('height');
        return newImg;
      }
    }
  );
}
