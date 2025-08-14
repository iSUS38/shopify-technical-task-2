document.addEventListener("DOMContentLoaded", function () {
    const addToCartPopupWrapper = document.querySelector(".add-to-cart-confirmation-modal-container");
    const allAddToCartTileButtons = document.querySelectorAll(".card-wrapper .card__add-to-cart-button button"); 
    const addToCartPopUpCloseButton = addToCartPopupWrapper.querySelector(".add-to-cart-close");
    const addToCartSingleProductButton = addToCartPopupWrapper.querySelector(".add-to-cart-modal-item");

    allAddToCartTileButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const productCardWrapper = this.closest(".card-wrapper");
            const isAddToCartPopupEnabled = this.getAttribute("data-pop-up-enabled");
            const parentSectionEl = this.closest("[class*='section-template--']");
            const addToCartPopUpWrapper = parentSectionEl.querySelector(".add-to-cart-confirmation-modal-container");

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

    addToCartSingleProductButton?.addEventListener("click", function () {
        var productId = this.getAttribute("data-product-id");

        if (window.routes.cart_add_url && +productId) {
            let formData = {
                sections: "cart-notification-product,cart-notification-button,cart-icon-bubble-new",
                items: [{
                    id: +productId,
                    quantity: 1
                }]
            };

            fetch(window.Shopify.routes.root + 'cart/add.js', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(res => res.json())
            .then((res) => {
                addToCartPopUpCloseButton.click();

                setTimeout(() => {
                    var cart = document.querySelector('cart-notification');

                    cart.renderContentsAfterAddToCartPopup(res);
                }, 400);
            });
        }
    });
});