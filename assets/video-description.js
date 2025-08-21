class VideoDescriptionModal extends CustomDialog {
  constructor() {
    super();
    this.body = this.querySelector('[data-body]');
    document.addEventListener(`dialog:trigger:video-description`, this.openDialog.bind(this));
  }

  openDialog(event) {
    this.body.innerHTML = event.detail.detail;
    super.openDialog();
  }
}

customElements.define('video-description-modal', VideoDescriptionModal);
