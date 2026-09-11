/* =========================================================
   RATEX — PROFESSIONAL CURRENCY ENGINE
   ========================================================= */

"use strict";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const amountInput =
    document.getElementById("amount");

const fromCurrency =
    document.getElementById("fromCurrency");

const toCurrency =
    document.getElementById("toCurrency");

const result =
    document.getElementById("result");

const rateText =
    document.getElementById("rateText");

const updateTime =
    document.getElementById("updateTime");

const convertBtn =
    document.getElementById("convertBtn");

const swapBtn =
    document.getElementById("swapBtn");

const refreshBtn =
    document.getElementById("refreshBtn");

const themeBtn =
    document.getElementById("themeBtn");


/* =========================================================
   CONFIGURATION
   ========================================================= */

const API_BASE =
    "https://api.frankfurter.app";


const marketPairs = [
    {
        from: "INR",
        to: "USD",
        element: "usdInr",
        changeElement: "usdChange"
    },

    {
        from: "INR",
        to: "EUR",
        element: "eurInr"
    },

    {
        from: "INR",
        to: "GBP",
        element: "gbpInr"
    },

    {
        from: "INR",
        to: "AED",
        element: "aedInr"
    }
];


/* =========================================================
   HELPERS
   ========================================================= */

function showToast(message) {

    let toast =
        document.querySelector(".toast");

    if (!toast) {

        toast =
            document.createElement("div");

        toast.className = "toast";

        document.body.appendChild(toast);
    }

    toast.textContent = message;

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    clearTimeout(
        window.toastTimer
    );

    window.toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3000);
}


function formatNumber(
    value,
    maximumFractionDigits = 2
) {

    return Number(value).toLocaleString(
        undefined,
        {
            minimumFractionDigits: 2,
            maximumFractionDigits
        }
    );
}


function setLoading(
    element,
    state = true
) {

    if (!element) return;

    element.classList.toggle(
        "loading",
        state
    );
}


/* =========================================================
   MAIN CONVERTER
   ========================================================= */

async function convertCurrency() {

    const amount =
        Number(amountInput.value);

    const from =
        fromCurrency.value;

    const to =
        toCurrency.value;


    if (!Number.isFinite(amount) || amount < 0) {

        result.value = "";

        rateText.textContent =
            "Please enter a valid amount.";

        updateTime.textContent =
            "Waiting for input.";

        return;
    }


    if (from === to) {

        result.value =
            formatNumber(amount);

        rateText.textContent =
            `1 ${from} = 1 ${to}`;

        updateTime.textContent =
            "Same currency";

        return;
    }


    try {

        result.value = "...";

        setLoading(
            rateText,
            true
        );


        const url =
            `${API_BASE}/latest?amount=1&from=${from}&to=${to}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        const rate =
            data.rates[to];


        if (!rate) {

            throw new Error(
                "Exchange rate unavailable"
            );
        }


        const converted =
            amount * rate;


        result.value =
            formatNumber(
                converted
            );


        rateText.textContent =
            `1 ${from} = ${formatNumber(
                rate,
                6
            )} ${to}`;


        updateTime.textContent =
            `Reference rate • ${data.date}`;


    }

    catch (error) {

        console.error(
            "Conversion error:",
            error
        );


        result.value =
            "—";


        rateText.textContent =
            "Exchange rate unavailable";


        updateTime.textContent =
            "Please try again later.";


        showToast(
            "Unable to fetch the exchange rate."
        );
    }

    finally {

        setLoading(
            rateText,
            false
        );
    }
}


/* =========================================================
   SWAP
   ========================================================= */

swapBtn.addEventListener(
    "click",
    async () => {

        swapBtn.style.transform =
            "rotate(180deg)";


        const oldFrom =
            fromCurrency.value;

        const oldTo =
            toCurrency.value;


        fromCurrency.value =
            oldTo;

        toCurrency.value =
            oldFrom;


        await convertCurrency();


        setTimeout(() => {

            swapBtn.style.transform =
                "";

        }, 350);
    }
);


/* =========================================================
   CONVERSION EVENTS
   ========================================================= */

convertBtn.addEventListener(
    "click",
    convertCurrency
);


fromCurrency.addEventListener(
    "change",
    convertCurrency
);


toCurrency.addEventListener(
    "change",
    convertCurrency
);


/*
   Debounced amount conversion
   prevents excessive API requests
*/

let typingTimer;

amountInput.addEventListener(
    "input",
    () => {

        clearTimeout(
            typingTimer
        );

        typingTimer =
            setTimeout(
                convertCurrency,
                450
            );
    }
);


/* =========================================================
   MARKET RATES
   ========================================================= */

async function loadMarketRates() {

    refreshBtn.classList.add(
        "loading"
    );


    try {

        const currencies =
            "USD,EUR,GBP,AED";


        const url =
            `${API_BASE}/latest?from=INR&to=${currencies}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        marketPairs.forEach(
            pair => {

                const card =
                    document.getElementById(
                        pair.element
                    );


                if (!card) return;


                const directRate =
                    data.rates[pair.to];


                if (!directRate) {

                    card.textContent =
                        "N/A";

                    return;
                }


                /*
                   API gives:

                   1 INR = X USD

                   For displaying:

                   1 USD = X INR

                   therefore:

                   1 / X
                */

                const inverseRate =
                    1 / directRate;


                card.textContent =
                    `₹${formatNumber(
                        inverseRate,
                        4
                    )}`;


                if (pair.changeElement) {

                    const change =
                        document.getElementById(
                            pair.changeElement
                        );


                    if (change) {

                        change.textContent =
                            `Reference • ${data.date}`;
                    }
                }
            }
        );


        showToast(
            "Market rates refreshed."
        );


    }

    catch (error) {

        console.error(
            "Market error:",
            error
        );


        marketPairs.forEach(
            pair => {

                const element =
                    document.getElementById(
                        pair.element
                    );


                if (element) {

                    element.textContent =
                        "—";
                }
            }
        );


        showToast(
            "Market data could not be refreshed."
        );
    }

    finally {

        refreshBtn.classList.remove(
            "loading"
        );
    }
}


/* =========================================================
   REFRESH BUTTON
   ========================================================= */

refreshBtn.addEventListener(
    "click",
    async () => {

        await Promise.all([
            loadMarketRates(),
            convertCurrency()
        ]);
    }
);


/* =========================================================
   DARK MODE
   ========================================================= */

function applyTheme(theme) {

    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeBtn.textContent =
            "☀️";

    } else {

        document.body.classList.remove(
            "dark"
        );

        themeBtn.textContent =
            "🌙";
    }
}


const savedTheme =
    localStorage.getItem(
        "rateX-theme"
    );


applyTheme(
    savedTheme || "light"
);


themeBtn.addEventListener(
    "click",
    () => {

        const isDark =
            document.body.classList.contains(
                "dark"
            );


        const newTheme =
            isDark
                ? "light"
                : "dark";


        applyTheme(
            newTheme
        );


        localStorage.setItem(
            "rateX-theme",
            newTheme
        );
    }
);


/* =========================================================
   KEYBOARD SHORTCUT
   Enter = Convert
   ========================================================= */

amountInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            convertCurrency();
        }
    }
);


/* =========================================================
   AUTO REFRESH
   ========================================================= */

/*
   Refresh reference rates every 5 minutes.

   This does NOT mean the source itself
   provides tick-by-tick FX market prices.
*/

setInterval(
    () => {

        loadMarketRates();

    },
    5 * 60 * 1000
);


/* =========================================================
   INITIAL LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await convertCurrency();

        await loadMarketRates();

    }
);
