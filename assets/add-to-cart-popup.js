document.addEventListener("DOMContentLoaded", function () {
    const addToCartPopupWrapper = document.querySelector(".add-to-cart-confirmation-modal-container");
    const allAddToCartTileButtons = document.querySelectorAll(".card-wrapper .card__add-to-cart-button button"); 
    const addToCartPopUpCloseButton = addToCartPopupWrapper.querySelector(".add-to-cart-close");
    const addToCartSingleProductButton = addToCartPopupWrapper.querySelector(".add-to-cart-modal-item");
    const addToCartAllProducts = addToCartPopupWrapper.querySelector(".add-to-cart-modal-all")

    allAddToCartTileButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const productCardWrapper = this.closest(".card-wrapper");
            const isAddToCartPopupEnabled = this.getAttribute("data-pop-up-enabled");
            const parentSectionEl = this.closest("[class*='section-template--']");
            const addToCartPopUpWrapper = parentSectionEl.querySelector(".add-to-cart-confirmation-modal-container");

            if (isAddToCartPopupEnabled && addToCartPopUpWrapper) {
                const productImageUrl = productCardWrapper.querySelector(".media img").src;
                const productName = productCardWrapper.querySelector(".card__heading[data-product-name]")?.getAttribute("data-product-name");
                const productID = productCardWrapper.querySelector(".card__heading[data-product-id]")?.getAttribute("data-product-id");

                const addToCartPopupMainImage = addToCartPopUpWrapper.querySelector(".add-to-cart-modal-product-image img");
                const addToCartPopupProductTitleEl = addToCartPopUpWrapper.querySelector(".add-to-cart-modal-product-name");
                const addToCartSingleItemButtonUpdated = addToCartPopUpWrapper.querySelector(".add-to-cart-modal-item");

                addToCartPopupProductTitleEl.innerHTML = productName;
                addToCartPopupMainImage.src = productImageUrl;
                addToCartSingleItemButtonUpdated.setAttribute("data-product-id", productID);

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
                sections: "cart-notification-last-added-product,cart-notification-button,cart-icon-bubble-new",
                items: [{
                    id: +productId,
                    quantity: 1
                }]
            };

            addToCartProducts(formData);
        }
    });

    addToCartAllProducts.addEventListener("click", function () {
        var mainProductId = this.getAttribute("data-product-id");
        var allRecommendedProductsWrappers = addToCartPopupWrapper.querySelectorAll(".add-to-cart-modal-recommended-products .add-to-cart-modal-recommendation-product");
        var allProductIds = [];

        allRecommendedProductsWrappers.forEach((recommendedProduct) => {
            const recommendedProductId = recommendedProduct.getAttribute("data-product-id");

            if (+recommendedProductId) {
                allProductIds.push(recommendedProductId);
            }
        });

        allProductIds.unshift(mainProductId);

        const productsArray = allProductIds.map(productId => {
            return {
                id: productId,
                quantity: 1
            }
        });

        const formData = {
            
        }

        if (window.routes.cart_add_url) {
            addToCartProducts(formData);
        }
    });
});

function addToCartProducts(formData) {
    const addToCartPopupWrapper = document.querySelector(".add-to-cart-confirmation-modal-container");
    const addToCartPopUpCloseButton = addToCartPopupWrapper.querySelector(".add-to-cart-close");

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