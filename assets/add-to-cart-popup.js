document.addEventListener("DOMContentLoaded", function () {
    const allAddToCartButtons = document.querySelectorAll(".card-wrapper .card__add-to-cart-button button"); 

    allAddToCartButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const productCardWrapper = this.closest(".card-wrapper");
            const isAddToCartPopupEnabled = this.getAttribute("data-pop-up-enabled");
            const addToCartPopUpWrapper = productCardWrapper.querySelector(".add-to-cart-confirmation-modal-container");

            console.log(addToCartPopUpWrapper)
            console.log(isAddToCartPopupEnabled)

            if (isAddToCartPopupEnabled && addToCartPopUpWrapper) {
                const productImageUrl = productCardWrapper.querySelector(".media img").src;

                const addToCartPopupMainImage = addToCartPopUpWrapper.querySelector(".add-to-cart-modal-product-image img");

                addToCartPopupMainImage.src = productImageUrl;

                addToCartPopUpWrapper.classList.add("modal-show");

                addToCartPopUpWrapper.classList.add("modal-show");
            }
        });
    });
});