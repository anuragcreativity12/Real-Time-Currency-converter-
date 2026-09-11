/* =========================================================
   RATEX — LIVE CURRENCY CONVERTER
   Uses Frankfurter API (ECB reference exchange rates)
   ========================================================= */

"use strict";

const amountInput = document.getElementById("amount");
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");

const result = document.getElementById("result");
const rateText = document.getElementById("rateText");
const updateTime = document.getElementById("updateTime");

const swapBtn = document.getElementById("swapBtn");
const convertBtn = document.getElementById("convertBtn");
const refreshBtn = document.getElementById("refreshBtn");

const usdInr = document.getElementById("usdInr");
const eurInr = document.getElementById("eurInr");
const gbpInr = document.getElementById("gbpInr");
const aedInr = document.getElementById("aedInr");

const themeBtn = document.getElementById("themeBtn");

let currentRate = null;


/* =========================================================
   API
   ========================================================= */

const API_URL = "https://api.frankfurter.app";


/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatNumber(number) {

    return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    }).format(number);

}


/* =========================================================
   SHOW TOAST
   ========================================================= */

function showToast(message) {

    let toast = document.querySelector(".toast");

    if (!toast) {

        toast = document.createElement("div");

        toast.className = "toast";

        document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}


/* =========================================================
   GET EXCHANGE RATE
   ========================================================= */

async function getRate(from, to) {

    if (from === to) {

        return 1;

    }

    const url =
        `${API_URL}/latest?from=${from}&to=${to}`;

    const response = await fetch(url);

    if (!response.ok) {

        throw new Error(
            `API Error: ${response.status}`
        );

    }

    const data = await response.json();

    if (
        !data.rates ||
        data.rates[to] === undefined
    ) {

        throw new Error(
            "Exchange rate unavailable"
        );

    }

    return data.rates[to];

}


/* =========================================================
   CONVERT CURRENCY
   ========================================================= */

async function convertCurrency() {

    const amount =
        parseFloat(amountInput.value);

    const from =
        fromCurrency.value;

    const to =
        toCurrency.value;


    if (isNaN(amount) || amount < 0) {

        result.value = "Invalid amount";

        return;

    }


    if (from === to) {

        currentRate = 1;

        result.value =
            formatNumber(amount);

        rateText.textContent =
            `1 ${from} = 1 ${to}`;

        updateTime.textContent =
            "Same currency";

        return;

    }


    result.value = "Loading...";

    rateText.textContent =
        "Fetching live exchange rate...";

    updateTime.textContent =
        "Connecting to market data";


    try {

        currentRate =
            await getRate(from, to);


        const converted =
            amount * currentRate;


        result.value =
            formatNumber(converted);


        rateText.textContent =
            `1 ${from} = ${formatNumber(currentRate)} ${to}`;


        updateTime.textContent =
            `Updated: ${new Date().toLocaleString(
                "en-IN"
            )}`;


    } catch (error) {

        console.error(error);

        result.value =
            "Unavailable";

        rateText.textContent =
            "Unable to retrieve exchange rate";

        updateTime.textContent =
            "Please try again";


        showToast(
            "Unable to load live exchange data."
        );

    }

}


/* =========================================================
   MARKET RATES
   ========================================================= */

async function loadMarketRates() {

    try {

        const response =
            await fetch(
                `${API_URL}/latest?from=USD&to=INR,EUR,GBP`
            );


        if (!response.ok) {

            throw new Error(
                "Market API error"
            );

        }


        const data =
            await response.json();


        const usdRate =
            data.rates.INR;

        const eurRate =
            data.rates.EUR;

        const gbpRate =
            data.rates.GBP;


        /* USD → INR */

        if (usdInr) {

            usdInr.textContent =
                `₹${formatNumber(usdRate)}`;

        }


        /* EUR → INR */

        if (eurInr) {

            const eurToInr =
                usdRate / eurRate;

            eurInr.textContent =
                `₹${formatNumber(eurToInr)}`;

        }


        /* GBP → INR */

        if (gbpInr) {

            const gbpToInr =
                usdRate / gbpRate;

            gbpInr.textContent =
                `₹${formatNumber(gbpToInr)}`;

        }


        /*
           AED is not included in
           this API response.
        */

        if (aedInr) {

            try {

                const aedRate =
                    await getRate(
                        "AED",
                        "INR"
                    );

                aedInr.textContent =
                    `₹${formatNumber(aedRate)}`;

            } catch {

                aedInr.textContent =
                    "Unavailable";

            }

        }


        const changeElements =
            document.querySelectorAll(
                ".market-card small"
            );


        changeElements.forEach(
            element => {

                element.textContent =
                    "Latest reference rate";

            }
        );


    } catch (error) {

        console.error(
            "Market error:",
            error
        );


        if (usdInr)
            usdInr.textContent = "Unavailable";

        if (eurInr)
            eurInr.textContent = "Unavailable";

        if (gbpInr)
            gbpInr.textContent = "Unavailable";

        if (aedInr)
            aedInr.textContent = "Unavailable";


        showToast(
            "Market data could not be loaded."
        );

    }

}


/* =========================================================
   SWAP CURRENCIES
   ========================================================= */

if (swapBtn) {

    swapBtn.addEventListener(
        "click",
        () => {

            const oldFrom =
                fromCurrency.value;

            fromCurrency.value =
                toCurrency.value;

            toCurrency.value =
                oldFrom;


            convertCurrency();

        }
    );

}


/* =========================================================
   CONVERT BUTTON
   ========================================================= */

if (convertBtn) {

    convertBtn.addEventListener(
        "click",
        convertCurrency
    );

}


/* =========================================================
   AUTO CONVERSION
   ========================================================= */

if (amountInput) {

    amountInput.addEventListener(
        "input",
        convertCurrency
    );

}


if (fromCurrency) {

    fromCurrency.addEventListener(
        "change",
        convertCurrency
    );

}


if (toCurrency) {

    toCurrency.addEventListener(
        "change",
        convertCurrency
    );

}


/* =========================================================
   REFRESH MARKET
   ========================================================= */

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        async () => {

            refreshBtn.classList.add(
                "loading"
            );

            refreshBtn.textContent =
                "⟳ Updating...";


            await loadMarketRates();


            refreshBtn.classList.remove(
                "loading"
            );

            refreshBtn.textContent =
                "🔄 Refresh";

        }
    );

}


/* =========================================================
   DARK MODE
   ========================================================= */

if (themeBtn) {

    themeBtn.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark"
            );


            const darkMode =
                document.body.classList.contains(
                    "dark"
                );


            themeBtn.textContent =
                darkMode ? "☀️" : "🌙";


            localStorage.setItem(
                "ratex-theme",
                darkMode
                    ? "dark"
                    : "light"
            );

        }
    );

}


/* =========================================================
   LOAD SAVED THEME
   ========================================================= */

const savedTheme =
    localStorage.getItem(
        "ratex-theme"
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


/* =========================================================
   AUTO REFRESH
   Every 5 minutes
   ========================================================= */

setInterval(
    loadMarketRates,
    5 * 60 * 1000
);
