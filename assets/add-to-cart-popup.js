document.addEventListener("DOMContentLoaded", function () {
    const allAddToCartButtons = document.querySelectorAll(".card-wrapper .card__add-to-cart-button button"); 
    const addToCartPopUpCloseButton = document.querySelector(".add-to-cart-confirmation-modal-container .add-to-cart-close");

    allAddToCartButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const productCardWrapper = this.closest(".card-wrapper");
            const isAddToCartPopupEnabled = this.getAttribute("data-pop-up-enabled");
            const parentSectionEl = this.closest("[class*='section-template--']");
            console.log(parentSectionEl)
            const addToCartPopUpWrapper = document.querySelector(".add-to-cart-confirmation-modal-container");

            if (isAddToCartPopupEnabled && addToCartPopUpWrapper) {
                const productImageUrl = productCardWrapper.querySelector(".media img").src;
                const productName = productCardWrapper.querySelector(".card__heading[data-product-name]")?.getAttribute("data-product-name");

                const addToCartPopupMainImage = addToCartPopUpWrapper.querySelector(".add-to-cart-modal-product-image img");
                const addToCartPopupProductTitleEl = addToCartPopUpWrapper.querySelector(".add-to-cart-modal-product-name");

                console.log(productCardWrapper.querySelector(".card__heading"))
                addToCartPopupProductTitleEl.innerHTML = productName;
                addToCartPopupMainImage.src = productImageUrl;

                addToCartPopUpWrapper.classList.add("modal-show");
            }
        });
    });

    addToCartPopUpCloseButton?.addEventListener("click", function () {
        const addToCartContainer = this.closest(".add-to-cart-confirmation-modal-container");

        addToCartContainer?.classList.remove("modal-show");
    });
});