document.addEventListener('DOMContentLoaded', function () {
    const purchaseEventOfferContainer = document.querySelector(".purchase-product-offer-wrapper");

    if (purchaseEventOfferContainer) {
        const offerProductVariantPickerContainer = purchaseEventOfferContainer.querySelector(".variant-picker");
        const allAvailableVariantOptions = offerProductVariantPickerContainer?.querySelectorAll(".variant-picker__label");
        const offeredProductHandle = purchaseEventOfferContainer.getAttribute("data-product-handle");

        if (offeredProductHandle) {
            allAvailableVariantOptions.forEach(function (variantOption) {
                variantOption.addEventListener("click", async function () {
                    const productData = await fetchEventOfferProductData(offeredProductHandle);

                    if (productData && productData.variants) {
                        updateProductVariants(productData.variants, productData.options);
                    }
                });
            });
        }
    }
});

async function fetchEventOfferProductData(productHandle) {
    let res = await fetch(window.Shopify.routes.root + `products/${productHandle}.js`);

    if (!res.ok) throw new Error('Product not found');

    return res.json();
}

function updateProductVariants(variants, productOptions) {
    const purchaseEventOfferContainer = document.querySelector(".purchase-product-offer-wrapper");
    const allSelectedOptionsEl = purchaseEventOfferContainer.querySelectorAll(".variant-picker__radio:checked");
    const currentSelectedOptions = [];
    const availableVariantsOptions1 = [];
    const availableVariantsOptions2 = [];
    const availableVariantsOptions3 = [];

    let allAvailableVariants = variants.filter((variant) => variant.available);

    for (selectedOption of allSelectedOptionsEl) {
        currentSelectedOptions.push(selectedOption.value);
    }

    allAvailableVariants.forEach((variant) => {
        if (availableVariantsOptions1.indexOf(variant.option1) === -1) {
            availableVariantsOptions1.push(variant.option1);
        }

        if (currentSelectedOptions[0] === variant.option1 && availableVariantsOptions2.indexOf(variant.option2) === -1) {
            availableVariantsOptions2.push(variant.option2);
        }

        if (availableVariantsOptions3.indexOf(variant.option3) === -1) {
            availableVariantsOptions3.push(variant.option3);
        }
    });

    if (currentSelectedOptions.length > 1) {
        const firstSelectedOption = currentSelectedOptions[0];


        allAvailableVariants = variants.filter((variant) => variant.available && variant.options[0] ===  firstSelectedOption);

        if (currentSelectedOptions.length === 3) {
            const secondSelectedOption = currentSelectedOptions[1];

            allAvailableVariants = allAvailableVariants.filter((variant) => variant.available && variant.options[1] === secondSelectedOption);
        }

        if (currentSelectedOptions.length === 2) {
            const firstSelectedOption = currentSelectedOptions[0];

            allAvailableVariants = allAvailableVariants.filter((variant) => variant.available && variant.options[0] === firstSelectedOption);
        }
    }

    var currentSelectedVariant = getCurrentSelectedVariant(variants, currentSelectedOptions, productOptions.length);

    disableAllVariationSwatches();

    updateVariationSwathesAvailability(allAvailableVariants);

    enableDependedVariationSwatches(productOptions, availableVariantsOptions1, availableVariantsOptions2);

    updateCurrentProduct(currentSelectedVariant.length ? currentSelectedVariant[0] : {});
}

function enableDependedVariationSwatches(productOptions, availableVariantsOptions1, availableVariantsOptions2) {
    if (productOptions.length >= 2) {
        var allVariantsSwatches = getAllVariantsSwatches();

        for (variationSwatch of allVariantsSwatches) {
            const variationSwatchValue = variationSwatch.value;

            if (availableVariantsOptions1 && availableVariantsOptions1.indexOf(variationSwatchValue) !== -1) {
                enableVariationSwatch(variationSwatch);
            }

            if (productOptions.length === 3) {
                if (availableVariantsOptions2 && availableVariantsOptions2.indexOf(variationSwatchValue) !== -1) {
                    enableVariationSwatch(variationSwatch);
                }
            }
        }
    }
}

function enableVariationSwatch(variationSwatch) {
    const variationSwatchLabelEl = variationSwatch.nextElementSibling;
    const variationSwatchValue = variationSwatch.value;

    variationSwatch.classList.remove("disabled");

    if (variationSwatchLabelEl) {
        variationSwatchLabelEl.classList.remove("disabled");

        variationSwatchLabelEl.querySelector("span").innerHTML = variationSwatchValue;
    }
}

function updateVariationSwathesAvailability(availableVariants) {
    if (availableVariants && availableVariants.length) {
        var allVariantsSwatches = getAllVariantsSwatches();

        for (variationSwatch of allVariantsSwatches) {
            const variationSwatchValue = variationSwatch.value;

            for (let i = 0; i < availableVariants.length; i++) {
                const variant  = availableVariants[i];

                if (variant.options && variant.options.indexOf(variationSwatchValue) !== -1) {
                    enableVariationSwatch(variationSwatch);
                }
            }
        }
    }
}

function disableAllVariationSwatches() {
    const allVariantsSwatches = getAllVariantsSwatches();

   allVariantsSwatches.forEach(function (variantEl) {
        const optionValue = variantEl.value;
        const variantLabelEl = variantEl.nextElementSibling;

        if (variantLabelEl) {
            const variantLabelInner = variantLabelEl.querySelector("span");

            variantLabelInner.innerHTML = `<s>${optionValue}</s>`;
            variantLabelEl.classList.add("disabled");
        }

        variantEl.classList.add("disabled");
    });
}

function getAllVariantsSwatches() {
    const purchaseEventOfferContainer = document.querySelector(".purchase-product-offer-wrapper");
    const allVariantsSwatches = purchaseEventOfferContainer.querySelectorAll(".variant-picker__radio");

    return allVariantsSwatches;
}

function updateCurrentProduct(selectedProductData) {
    const purchaseEventOfferContainer = document.querySelector(".purchase-product-offer-wrapper");

    const mediaWrapper = purchaseEventOfferContainer.querySelector(".pdp__media");
    const mainImagesWrapper = mediaWrapper.querySelector(".pdp-thumbnails__main-wrapper");
    const thumbnailImagesWrapper = mediaWrapper.querySelector(".pdp-thumbnails__list");

    const addToCartButton = purchaseEventOfferContainer.querySelector(".buy-buttons__buttons button[type='submit']");
    const addToCartButtonTextInner = addToCartButton.querySelector("span");
    const addToCartForm = purchaseEventOfferContainer.querySelector(".buy-buttons__form");

    const regularPriceContainer = purchaseEventOfferContainer.querySelector(".price__regular");
    const salePriceContainer = purchaseEventOfferContainer.querySelector(".price__on-sale");

    const allVariantPickerCaptions = purchaseEventOfferContainer.querySelectorAll(".variant-picker__legend legend span");

    const currencyCode = purchaseEventOfferContainer.getAttribute("data-currency-code") || "€";
    const selectedProductImageId = selectedProductData.featured_media?.id;
    const selectedProductRegularPrice = selectedProductData.price;
    const selectedProductSalePrice = selectedProductData.compare_at_price;
    const localeTextSettings = window.variantStrings;

    if (selectedProductData.available) {

        addToCartButton.removeAttribute("aria-disabled");

        addToCartButtonTextInner.innerHTML = localeTextSettings.addToCart;
    } else {
        addToCartButton.setAttribute("aria-disabled", true);

        addToCartButtonTextInner.innerHTML = localeTextSettings.soldOut;
    }

    if (selectedProductImageId) {
        var activeMainImage = mainImagesWrapper.querySelector(".pdp-thumbnails__main[data-active]");
        var searchedMainImage = mainImagesWrapper.querySelector(`.pdp-thumbnails__main[data-media-id='${selectedProductImageId}']`);

        var activeThumbnailImage = thumbnailImagesWrapper.querySelector(".pdp-thumbnails__thumbnail[aria-pressed]");
        var searchThumbnailImage = thumbnailImagesWrapper.querySelector(`.pdp-thumbnails__thumbnail[data-thumbnail='${selectedProductImageId}']`);

        activeMainImage.removeAttribute("data-active");
        searchedMainImage?.setAttribute("data-active", true);

        activeThumbnailImage.removeAttribute("aria-pressed");
        searchThumbnailImage.setAttribute("aria-pressed", true);
    }

    allVariantPickerCaptions.forEach((caption, index) => {
        caption.innerHTML = selectedProductData.options[index];
    });

    if (selectedProductSalePrice) {
        regularPriceContainer.style.display = "none";
        salePriceContainer.style.display = "block";

        salePriceContainer.querySelector(".exception").innerHTML = currencyCode + (selectedProductRegularPrice / 100).toFixed(2);
        salePriceContainer.querySelector(".secondary").innerHTML = currencyCode + (selectedProductSalePrice / 100).toFixed(2);
    } else {
        regularPriceContainer.style.display = "block";
        salePriceContainer.style.display = "none";

        regularPriceContainer.querySelector(".price-item--regular").innerHTML = currencyCode + (selectedProductRegularPrice / 100).toFixed(2);
    }

    addToCartForm.querySelector("input[name='id']").value = selectedProductData.id;
}

function getCurrentSelectedVariant(variants, currentSelectedOptions, allOptionsCount) {
    return variants.filter((variant) => {
        switch (allOptionsCount) {
            case 1:
                if (variant.option1 === currentSelectedOptions[0]) {
                    return variant;
                }

                break;
            case 2:
                if (variant.option1 === currentSelectedOptions[0] 
                    && variant.option2 === currentSelectedOptions[1]) {
                    return variant;
                }

                break;
            case 3:
                if (variant.option1 === currentSelectedOptions[0] 
                    && variant.option2 === currentSelectedOptions[1]
                    && variant.option3 === currentSelectedOptions[2]) {
                    return variant;
                }
                break;
            default:
                break;
        }
    });
}