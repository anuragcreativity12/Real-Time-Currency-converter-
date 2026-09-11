"use strict";

/* =========================================================
   RATEX CURRENCY ENGINE
   Works with the existing index.html
   ========================================================= */


/* ---------------------------------------------------------
   API
   --------------------------------------------------------- */

const API_BASE =
    "https://open.er-api.com/v6/latest";


/* ---------------------------------------------------------
   DOM ELEMENTS
   --------------------------------------------------------- */

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


/* ---------------------------------------------------------
   STORAGE
   --------------------------------------------------------- */

let ratesCache = {};

let lastBaseCurrency = null;


/* ---------------------------------------------------------
   FORMAT NUMBER
   --------------------------------------------------------- */

function formatNumber(
    number,
    decimals = 2
) {

    return Number(number).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }
    );
}


/* ---------------------------------------------------------
   TOAST
   --------------------------------------------------------- */

function showToast(message) {

    let toast =
        document.querySelector(".toast");


    if (!toast) {

        toast =
            document.createElement("div");

        toast.className =
            "toast";

        document.body.appendChild(
            toast
        );
    }


    toast.textContent =
        message;


    requestAnimationFrame(() => {

        toast.classList.add(
            "show"
        );

    });


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 3500);
}


/* ---------------------------------------------------------
   API REQUEST
   --------------------------------------------------------- */

async function getRates(
    baseCurrency
) {

    try {

        const response =
            await fetch(
                `${API_BASE}/${baseCurrency}`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        if (
            data.result !==
            "success"
        ) {

            throw new Error(
                "API returned an error"
            );
        }


        ratesCache =
            data.rates;


        lastBaseCurrency =
            data.base_code;


        return data;

    }

    catch (error) {

        console.error(
            "Currency API error:",
            error
        );


        throw error;
    }
}


/* ---------------------------------------------------------
   CONVERT
   --------------------------------------------------------- */

async function convertCurrency() {

    const amount =
        Number(
            amountInput.value
        );


    const from =
        fromCurrency.value;


    const to =
        toCurrency.value;


    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {

        result.value =
            "";

        rateText.textContent =
            "Enter a valid amount";

        updateTime.textContent =
            "Waiting for input";

        return;
    }


    try {

        result.value =
            "Loading...";


        /*
         * If our cached rates are not based
         * on the selected FROM currency,
         * request new rates.
         */

        if (
            lastBaseCurrency !==
            from
        ) {

            const data =
                await getRates(
                    from
                );


            updateTime.textContent =
                `Updated: ${formatUpdateTime(
                    data.time_last_update_unix
                )}`;
        }


        const rate =
            ratesCache[to];


        if (
            rate === undefined
        ) {

            throw new Error(
                `Rate for ${to} unavailable`
            );
        }


        const converted =
            amount * rate;


        result.value =
            formatNumber(
                converted,
                getDecimalPlaces(to)
            );


        rateText.textContent =
            `1 ${from} = ${formatRate(
                rate
            )} ${to}`;


        if (
            lastBaseCurrency ===
            from
        ) {

            if (
                updateTime.textContent ===
                ""
            ) {

                updateTime.textContent =
                    "Rate loaded successfully";
            }
        }


    }

    catch (error) {

        console.error(
            error
        );


        result.value =
            "Unavailable";


        rateText.textContent =
            "Unable to retrieve exchange rate";


        updateTime.textContent =
            "Check your internet connection";


        showToast(
            "Currency data could not be loaded."
        );
    }
}


/* ---------------------------------------------------------
   RATE DECIMAL LOGIC
   --------------------------------------------------------- */

function getDecimalPlaces(
    currency
) {

    const zeroDecimalCurrencies = [
        "JPY",
        "KRW",
        "VND",
        "IDR"
    ];


    if (
        zeroDecimalCurrencies.includes(
            currency
        )
    ) {

        return 0;
    }


    return 2;
}


function formatRate(
    rate
) {

    if (rate >= 100) {

        return Number(rate)
            .toFixed(2);
    }


    if (rate >= 10) {

        return Number(rate)
            .toFixed(3);
    }


    return Number(rate)
        .toFixed(4);
}


/* ---------------------------------------------------------
   UPDATE TIME
   --------------------------------------------------------- */

function formatUpdateTime(
    unixTime
) {

    if (!unixTime) {

        return "Latest available rate";
    }


    const date =
        new Date(
            unixTime * 1000
        );


    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


/* ---------------------------------------------------------
   SWAP
   --------------------------------------------------------- */

swapBtn.addEventListener(
    "click",
    async () => {

        const oldFrom =
            fromCurrency.value;


        const oldTo =
            toCurrency.value;


        fromCurrency.value =
            oldTo;


        toCurrency.value =
            oldFrom;


        lastBaseCurrency =
            null;


        await convertCurrency();


        showToast(
            "Currencies swapped"
        );
    }
);


/* ---------------------------------------------------------
   CONVERT BUTTON
   --------------------------------------------------------- */

convertBtn.addEventListener(
    "click",
    convertCurrency
);


/* ---------------------------------------------------------
   AMOUNT INPUT
   --------------------------------------------------------- */

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
                500
            );
    }
);


/* ---------------------------------------------------------
   CURRENCY CHANGE
   --------------------------------------------------------- */

fromCurrency.addEventListener(
    "change",
    async () => {

        lastBaseCurrency =
            null;


        await convertCurrency();
    }
);


toCurrency.addEventListener(
    "change",
    async () => {

        await convertCurrency();
    }
);


/* ---------------------------------------------------------
   MARKET CARDS
   --------------------------------------------------------- */

async function loadMarketRates() {

    refreshBtn.classList.add(
        "loading"
    );


    try {

        /*
         * One request gets all
         * INR-based rates.
         */

        const data =
            await getRates(
                "INR"
            );


        const rates =
            data.rates;


        /*
         * API gives:

         * 1 INR = USD value

         * We need:

         * 1 USD = INR value
         */

        updateMarketCard(
            "usdInr",
            rates.USD
        );


        updateMarketCard(
            "eurInr",
            rates.EUR
        );


        updateMarketCard(
            "gbpInr",
            rates.GBP
        );


        updateMarketCard(
            "aedInr",
            rates.AED
        );


        const usdChange =
            document.getElementById(
                "usdChange"
            );


        if (usdChange) {

            usdChange.textContent =
                `Updated ${formatUpdateTime(
                    data.time_last_update_unix
                )}`;
        }


        showToast(
            "Market rates refreshed"
        );


    }

    catch (error) {

        console.error(
            "Market loading error:",
            error
        );


        setMarketUnavailable(
            "usdInr"
        );


        setMarketUnavailable(
            "eurInr"
        );


        setMarketUnavailable(
            "gbpInr"
        );


        setMarketUnavailable(
            "aedInr"
        );


        showToast(
            "Unable to retrieve market data"
        );
    }


    finally {

        refreshBtn.classList.remove(
            "loading"
        );
    }
}


/* ---------------------------------------------------------
   MARKET CARD UPDATE
   --------------------------------------------------------- */

function updateMarketCard(
    elementId,
    directRate
) {

    const element =
        document.getElementById(
            elementId
        );


    if (
        !element ||
        !directRate
    ) {

        return;
    }


    const inverseRate =
        1 / directRate;


    element.textContent =
        `₹${formatNumber(
            inverseRate,
            4
        )}`;
}


/* ---------------------------------------------------------
   MARKET UNAVAILABLE
   --------------------------------------------------------- */

function setMarketUnavailable(
    elementId
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            "Unavailable";
    }
}


/* ---------------------------------------------------------
   REFRESH
   --------------------------------------------------------- */

refreshBtn.addEventListener(
    "click",
    async () => {

        lastBaseCurrency =
            null;


        await loadMarketRates();


        await convertCurrency();
    }
);


/* ---------------------------------------------------------
   DARK MODE
   --------------------------------------------------------- */

function applyTheme(
    theme
) {

    if (
        theme ===
        "dark"
    ) {

        document.body.classList.add(
            "dark"
        );


        themeBtn.textContent =
            "☀️";

    }

    else {

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
    savedTheme ||
    "light"
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


/* ---------------------------------------------------------
   KEYBOARD
   --------------------------------------------------------- */

amountInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            convertCurrency();
        }
    }
);


/* ---------------------------------------------------------
   INITIAL LOAD
   --------------------------------------------------------- */

async function initializeRateX() {

    try {

        /*
         * Load INR market cards first.
         */

        await loadMarketRates();


        /*
         * Then perform the user's
         * selected conversion.
         */

        await convertCurrency();

    }

    catch (error) {

        console.error(
            "Initialization failed:",
            error
        );
    }
}


/* ---------------------------------------------------------
   START
   --------------------------------------------------------- */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeRateX
    );

}

else {

    initializeRateX();
}
