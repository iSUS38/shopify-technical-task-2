document.addEventListener("DOMContentLoaded", function () {
    const allAddToCartTileButtons = document.querySelectorAll(".card-wrapper .card__add-to-cart-button button"); 
    const addToCartPopupWrapper = document.querySelector(".add-to-cart-confirmation-modal-container");

    if (addToCartPopupWrapper) {
        const addToCartPopUpCloseButton = addToCartPopupWrapper.querySelector(".add-to-cart-close");
        const addToCartSingleProductButton = addToCartPopupWrapper.querySelector(".add-to-cart-modal-item");
        const addToCartAllProducts = addToCartPopupWrapper.querySelector(".add-to-cart-modal-all");

        addToCartPopUpCloseButton?.addEventListener("click", function () {
            const addToCartContainer = this.closest(".add-to-cart-confirmation-modal-container");

            addToCartContainer?.classList.remove("modal-show");
            document.body.classList.remove("add-to-cart-modal-shown");
        });

        addToCartSingleProductButton?.addEventListener("click", function () {
            const productId = this.getAttribute("data-product-id");

            if (window.routes.cart_add_url && +productId) {
                let formData = {
                    sections: "cart-notification-last-added-product,cart-notification-button,cart-icon-bubble-new",
                    attributes: { last_added_items: [+productId] },
                    items: [{
                        id: +productId,
                        quantity: 1
                    }]
                };

                addToCartProducts(formData);
            }
        });

        addToCartAllProducts.addEventListener("click", function () {
            const mainProductId = this.getAttribute("data-product-id");
            const allRecommendedProductsWrappers = addToCartPopupWrapper.querySelectorAll(".add-to-cart-modal-recommended-products .add-to-cart-modal-recommendation-product");
            const allProductIds = [];

            allRecommendedProductsWrappers.forEach((recommendedProduct) => {
                const recommendedProductId = recommendedProduct.getAttribute("data-product-id");

                if (+recommendedProductId) {
                    allProductIds.push(+recommendedProductId);
                }
            });

            allProductIds.unshift(+mainProductId);

            const productsArray = allProductIds.map(productId => {
                return {
                    id: productId,
                    quantity: 1
                }
            });

            const formData = {
                sections: "cart-notification-last-added-product,cart-notification-button,cart-icon-bubble-new",
                items: productsArray,
                attributes:  { last_added_items: allProductIds },
            }

            if (window.routes.cart_add_url) {
                addToCartProducts(formData);
            }
        });
    }

    allAddToCartTileButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const productCardWrapper = this.closest(".card-wrapper");
            const parentSectionEl = this.closest("[class*='section-template--']");
            const addToCartPopUpWrapper = parentSectionEl.querySelector(".add-to-cart-confirmation-modal-container");
            const pageTemplateName = addToCartPopUpWrapper?.getAttribute("data-template-name");

            let isAddToCartPopupEnabled = this.getAttribute("data-pop-up-enabled");
            let addToCartPopupDisplaysCount = addToCartPopUpWrapper?.getAttribute("data-popup-displays-count");
            let popupCurrentDisplaysCount = +(localStorage.getItem(`template-${pageTemplateName}-addToCartPopupDisplaysCount`));

            if (isAddToCartPopupEnabled && addToCartPopUpWrapper) {
                if (!(+addToCartPopupDisplaysCount)) {
                    localStorage.removeItem(`template-${pageTemplateName}-addToCartPopupDisplaysCount`);
                } else {
                    if (popupCurrentDisplaysCount >= +addToCartPopupDisplaysCount) {
                        isAddToCartPopupEnabled = false;
                    }
                }
            }

            if (isAddToCartPopupEnabled && addToCartPopUpWrapper) {
                setNewProductData(productCardWrapper, addToCartPopUpWrapper);                

                addToCartPopUpWrapper.classList.add("modal-show");
                document.body.classList.add("add-to-cart-modal-shown");

                localStorage.setItem(`template-${pageTemplateName}-addToCartPopupDisplaysCount`, (popupCurrentDisplaysCount ? ++popupCurrentDisplaysCount : 1));
            } else {
                const productID = productCardWrapper.querySelector(".card__heading[data-product-id]")?.getAttribute("data-product-id");

                if (+productID) {
                    const addToCartFormData = {
                        sections: "cart-notification-last-added-product,cart-notification-button,cart-icon-bubble-new",
                        attributes:  { last_added_items: [+productID] },
                        items: [{
                            id: +productID,
                            quantity: 1
                        }]
                    }

                    addToCartProducts(addToCartFormData);
                }
            }
        });
    });
});

function addToCartProducts(formData) {
    fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(res => res.json())
    .then(res => {
        const addToCartPopupWrapper = document.querySelector(".add-to-cart-confirmation-modal-container");
        const cart = document.querySelector('cart-notification');

        if (addToCartPopupWrapper) {
            const addToCartPopUpCloseButton = addToCartPopupWrapper.querySelector(".add-to-cart-close");

            addToCartPopUpCloseButton.click();
        }

        cart.renderContentsAfterAddToCartPopup(res);
    });
}

function setNewProductData(productCardWrapper, addToCartPopUpWrapper) {
    const productImageUrl = productCardWrapper.querySelector(".media img")?.src;
    const productName = productCardWrapper.querySelector(".card__heading[data-product-name]")?.getAttribute("data-product-name");
    const productID = productCardWrapper.querySelector(".card__heading[data-product-id]")?.getAttribute("data-product-id");

    const addToCartPopupMainImage = addToCartPopUpWrapper.querySelector(".add-to-cart-modal-product-image img");
    const addToCartPopupProductTitleEl = addToCartPopUpWrapper.querySelector(".add-to-cart-modal-product-name");
    const addToCartSingleItemButtonUpdated = addToCartPopUpWrapper.querySelector(".add-to-cart-modal-item");
    const addToCartAllItemsButton = addToCartPopUpWrapper.querySelector(".add-to-cart-modal-all");

    if (addToCartPopupProductTitleEl) {
        addToCartPopupProductTitleEl.innerHTML = productName;
    }

    if (addToCartPopupMainImage) {
        addToCartPopupMainImage.src = productImageUrl;
    }

    if (addToCartAllItemsButton) {
        addToCartAllItemsButton.setAttribute("data-product-id", productID)
    }

    if (addToCartSingleItemButtonUpdated) {
        addToCartSingleItemButtonUpdated.setAttribute("data-product-id", productID);
    }
}