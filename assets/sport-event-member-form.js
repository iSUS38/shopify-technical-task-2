document.addEventListener("DOMContentLoaded", function () {
    const allSportEventsForm = document.querySelectorAll(".sport-event-member-form-wrapper form");
    const allSportEventsFormEditButtons = document.querySelectorAll(".sport-event-member-form-wrapper  .event-form-edit-button button");

    allSportEventsForm.forEach(function (form) {
        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const formEl = event.target;
            const requestObject = {};
            let actionUrl = formEl.getAttribute("data-action");

            const firstName = formEl.querySelector("input[name='attributes[Firstname]']");
            const lastName = formEl.querySelector("input[name='attributes[Lastname]']");
            const email = formEl.querySelector("input[name='attributes[Email]']");
            const phoneNumber = formEl.querySelector("input[name='attributes[Phone number]']");
            const postalCode = formEl.querySelector("input[name='attributes[Postal code]']");
            const sex = formEl.querySelector("select[name='attributes[Sex]']");
            const birthDate = formEl.querySelector("input[name='attributes[Birth date]']");
            const memberId = formEl.querySelector("input[name='attributes[Member id]']");

            if (firstName) {
                requestObject["First name"] = firstName.value;
            }

            if (lastName) {
                requestObject["Last name"] = lastName.value;
            }

            if (email) {
                requestObject["Email"] = email.value;
            }

            if (phoneNumber) {
                requestObject["Phone number"] = phoneNumber.value;
            }

            if (postalCode) {
                requestObject["Postal code"] = postalCode.value;
            }

            if (sex) {
                requestObject["Sex"] = sex.value;
            }

            if (birthDate) {
                requestObject["Birth date"] = birthDate.value;
            }

            if (memberId) {
                requestObject["Member ID"] = memberId.value;
            }

            requestObject["sport_event_participant"] = true;

            if (actionUrl) {
                actionUrl = "/" + actionUrl;

                fetch(actionUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "attributes": requestObject
                    })
                })
                .then(res => res.json())
                .then(() => {
                    const formContainerEl = formEl.closest(".sport-event-member-form-wrapper");
                    const submittedFormTitleEl = formContainerEl.querySelector("h4[data-submitted-form-title]");

                    formEl.classList.add("form-submitted");
                    submittedFormTitleEl.innerHTML = submittedFormTitleEl.getAttribute("data-submitted-form-title");
                })
            }
        });
    });

    allSportEventsFormEditButtons.forEach(function (editButton) {
        editButton.addEventListener("click", function () {
            const parentEl = this.closest(".sport-event-member-form-wrapper");
            const formEl = parentEl.querySelector("form");
            const formTitleEl = parentEl.querySelector("h4[data-submitted-form-title]");

            formEl.classList.remove("form-submitted");
            formTitleEl.innerHTML = formTitleEl.getAttribute("data-not-submitted-form-title");
        });
    })
});