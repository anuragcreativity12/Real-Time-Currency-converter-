"use strict";


/* =========================================================
   RATEX CURRENCY ENGINE
   ========================================================= */


const API_URL =
    "https://api.frankfurter.app/latest";


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let rates = {};
let ratesLoaded = false;
let lastUpdated = null;


/* =========================================================
   DOM
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

const swapBtn =
    document.getElementById("swapBtn");

const convertBtn =
    document.getElementById("convertBtn");

const themeBtn =
    document.getElementById("themeBtn");

const refreshBtn =
    document.getElementById("refreshBtn");

const toast =
    document.getElementById("toast");


/* =========================================================
   CURRENCIES
   ========================================================= */

const currencies = [
    "USD",
    "EUR",
    "GBP",
    "INR",
    "AED",
    "SAR",
    "JPY",
    "CAD",
    "AUD",
    "SGD",
    "CHF"
];


/* =========================================================
   FETCH LIVE RATES
   ========================================================= */

async function fetchRates() {

    try {

        showLoading();

        /*
         * We request USD based rates.
         *
         * Frankfurter provides rates from
         * the European Central Bank reference data.
         */

        const response =
            await fetch(
                `${API_URL}?from=USD&to=${currencies.join(",")}`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to connect to exchange-rate server."
            );

        }


        const data =
            await response.json();


        /*
         * USD itself is always 1.
         */

        rates = {
            USD: 1,
            ...data.rates
        };


        ratesLoaded = true;

        lastUpdated =
            new Date();


        updateTimeText();


        /*
         * Calculate immediately.
         */

        calculate();


        /*
         * If market page exists,
         * update market cards.
         */

        updateMarket();


        showToast(
            "Live exchange rates updated."
        );


    } catch (error) {

        console.error(
            "RateX API Error:",
            error
        );


        ratesLoaded = false;


        if (updateTime) {

            updateTime.textContent =
                "Unable to retrieve live rates.";

        }


        if (rateText) {

            rateText.textContent =
                "Live rate unavailable";

        }


        if (result) {

            result.value =
                "API Error";

        }


        showToast(
            "Could not retrieve live market data."
        );

    }

}


/* =========================================================
   CALCULATE CONVERSION
   ========================================================= */

function calculate() {

    if (!amountInput ||
        !fromCurrency ||
        !toCurrency ||
        !result) {

        return;

    }


    if (!ratesLoaded) {

        result.value =
            "Loading...";

        return;

    }


    const amount =
        parseFloat(
            amountInput.value
        );


    const from =
        fromCurrency.value;


    const to =
        toCurrency.value;


    if (
        Number.isNaN(amount) ||
        amount < 0
    ) {

        result.value =
            "Enter amount";

        return;

    }


    /*
     * Since all rates are relative to USD:
     *
     * USD → target = rates[target]
     *
     * From → USD = 1 / rates[from]
     *
     * Therefore:
     *
     * From → To =
     * rates[to] / rates[from]
     */

    const conversionRate =
        rates[to] / rates[from];


    const converted =
        amount * conversionRate;


    result.value =
        formatNumber(converted);


    rateText.textContent =
        `1 ${from} = ${formatNumber(conversionRate, 6)} ${to}`;

}


/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatNumber(
    number,
    maximumDigits = 4
) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            maximumFractionDigits:
                maximumDigits
        }
    ).format(number);

}


/* =========================================================
   UPDATE TIME
   ========================================================= */

function updateTimeText() {

    if (!updateTime ||
        !lastUpdated) {

        return;

    }


    updateTime.textContent =
        `Last updated: ${
            lastUpdated.toLocaleTimeString()
        }`;

}


/* =========================================================
   SWAP
   ========================================================= */

if (swapBtn) {

    swapBtn.addEventListener(
        "click",
        function () {

            const oldFrom =
                fromCurrency.value;

            fromCurrency.value =
                toCurrency.value;

            toCurrency.value =
                oldFrom;

            calculate();

        }
    );

}


/* =========================================================
   CONVERT BUTTON
   ========================================================= */

if (convertBtn) {

    convertBtn.addEventListener(
        "click",
        function () {

            calculate();

            showToast(
                "Currency converted successfully."
            );

        }
    );

}


/* =========================================================
   AUTO CALCULATION
   ========================================================= */

if (amountInput) {

    amountInput.addEventListener(
        "input",
        calculate
    );

}


if (fromCurrency) {

    fromCurrency.addEventListener(
        "change",
        calculate
    );

}


if (toCurrency) {

    toCurrency.addEventListener(
        "change",
        calculate
    );

}


/* =========================================================
   MARKET PAGE
   ========================================================= */

function updateMarket() {

    if (!ratesLoaded) {
        return;
    }


    /*
     * All market cards are INR based.
     */

    setMarketRate(
        "usdInr",
        "USD",
        "INR"
    );


    setMarketRate(
        "eurInr",
        "EUR",
        "INR"
    );


    setMarketRate(
        "gbpInr",
        "GBP",
        "INR"
    );


    setMarketRate(
        "aedInr",
        "AED",
        "INR"
    );


    setMarketRate(
        "sarInr",
        "SAR",
        "INR"
    );


    setMarketRate(
        "jpyInr",
        "JPY",
        "INR"
    );


    setMarketRate(
        "cadInr",
        "CAD",
        "INR"
    );


    setMarketRate(
        "audInr",
        "AUD",
        "INR"
    );


    const status =
        document.getElementById(
            "marketStatus"
        );


    if (status) {

        status.textContent =
            `Updated ${
                lastUpdated.toLocaleTimeString()
            }`;

    }


    const time =
        document.getElementById(
            "usdInrTime"
        );


    if (time) {

        time.textContent =
            "Live reference";

    }

}


/* =========================================================
   MARKET RATE FUNCTION
   ========================================================= */

function setMarketRate(
    elementId,
    from,
    to
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    if (
        !rates[from] ||
        !rates[to]
    ) {

        element.textContent =
            "Unavailable";

        return;

    }


    const rate =
        rates[to] / rates[from];


    element.textContent =
        formatNumber(rate, 4);

}


/* =========================================================
   REFRESH MARKET
   ========================================================= */

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        async function () {

            refreshBtn.disabled =
                true;

            refreshBtn.textContent =
                "⏳ Updating...";


            await fetchRates();


            refreshBtn.disabled =
                false;

            refreshBtn.textContent =
                "🔄 Refresh";

        }
    );

}


/* =========================================================
   DARK MODE
   ========================================================= */

function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "rateXTheme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark"
        );

        if (themeBtn) {

            themeBtn.textContent =
                "☀️";

        }

    }

}


if (themeBtn) {

    themeBtn.addEventListener(
        "click",
        function () {

            document.body.classList.toggle(
                "dark"
            );


            const isDark =
                document.body.classList.contains(
                    "dark"
                );


            localStorage.setItem(
                "rateXTheme",
                isDark
                    ? "dark"
                    : "light"
            );


            themeBtn.textContent =
                isDark
                    ? "☀️"
                    : "🌙";

        }
    );

}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer;


function showToast(message) {

    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading() {

    if (rateText) {

        rateText.textContent =
            "Getting live exchange rate...";

    }


    if (updateTime) {

        updateTime.textContent =
            "Connecting to market data...";

    }

}


/* =========================================================
   INITIALIZE
   ========================================================= */

loadTheme();

fetchRates();
