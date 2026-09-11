"use strict";


/* =========================================================
   RATEX
   CURRENCY ENGINE
========================================================= */


/* =========================================================
   API
========================================================= */

const API = "https://api.frankfurter.app";


/* =========================================================
   DOM
========================================================= */

const amount =
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

const refreshBtn =
    document.getElementById("refreshBtn");

const themeBtn =
    document.getElementById("themeBtn");

const toast =
    document.getElementById("toast");


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);
}


/* =========================================================
   API FETCH
========================================================= */

async function fetchRate(from, to) {

    if (from === to) {

        return 1;

    }


    const url =
        `${API}/latest?from=${from}&to=${to}`;


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Exchange rate service unavailable"
        );

    }


    const data =
        await response.json();


    if (!data.rates || !data.rates[to]) {

        throw new Error(
            "Currency rate unavailable"
        );

    }


    return data.rates[to];

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(number) {

    return Number(number).toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 4
        }
    );

}


/* =========================================================
   CONVERTER
========================================================= */

async function convertCurrency() {

    if (
        !amount ||
        !fromCurrency ||
        !toCurrency ||
        !result
    ) {

        return;

    }


    const value =
        Number(amount.value);


    const from =
        fromCurrency.value;


    const to =
        toCurrency.value;


    if (
        Number.isNaN(value) ||
        value < 0
    ) {

        result.value =
            "Invalid amount";

        return;

    }


    result.value =
        "Loading...";


    if (rateText) {

        rateText.textContent =
            "Fetching live reference rate...";

    }


    try {

        const rate =
            await fetchRate(
                from,
                to
            );


        const converted =
            value * rate;


        result.value =
            formatNumber(converted);


        if (rateText) {

            rateText.textContent =
                `1 ${from} = ${formatNumber(rate)} ${to}`;

        }


        if (updateTime) {

            updateTime.textContent =
                `Updated ${new Date().toLocaleString()}`;

        }

    }

    catch (error) {

        console.error(error);


        result.value =
            "Unavailable";


        if (rateText) {

            rateText.textContent =
                "Unable to retrieve live rate";

        }


        if (updateTime) {

            updateTime.textContent =
                "Please try again";

        }


        showToast(
            "Unable to retrieve exchange rate."
        );

    }

}


/* =========================================================
   SWAP
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

if (amount) {

    amount.addEventListener(
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
   POPULAR RATES
========================================================= */

async function loadPopularRates() {

    const currencies = {

        USD: "usdInr",

        EUR: "eurInr",

        GBP: "gbpInr",

        AED: "aedInr"

    };


    for (
        const currency in currencies
    ) {

        const element =
            document.getElementById(
                currencies[currency]
            );


        if (!element) continue;


        try {

            const rate =
                await fetchRate(
                    currency,
                    "INR"
                );


            element.textContent =
                formatNumber(rate);

        }

        catch (error) {

            element.textContent =
                "Unavailable";

        }

    }

}


/* =========================================================
   MARKET PAGE
========================================================= */

const marketTable =
    document.getElementById("marketTable");

const currencySearch =
    document.getElementById("currencySearch");

const marketUpdated =
    document.getElementById("marketUpdated");

const marketRefresh =
    document.getElementById("marketRefresh");


const currencies = [

    {
        code: "USD",
        name: "US Dollar",
        flag: "🇺🇸"
    },

    {
        code: "EUR",
        name: "Euro",
        flag: "🇪🇺"
    },

    {
        code: "GBP",
        name: "British Pound",
        flag: "🇬🇧"
    },

    {
        code: "AED",
        name: "UAE Dirham",
        flag: "🇦🇪"
    },

    {
        code: "SAR",
        name: "Saudi Riyal",
        flag: "🇸🇦"
    },

    {
        code: "JPY",
        name: "Japanese Yen",
        flag: "🇯🇵"
    },

    {
        code: "CAD",
        name: "Canadian Dollar",
        flag: "🇨🇦"
    },

    {
        code: "AUD",
        name: "Australian Dollar",
        flag: "🇦🇺"
    },

    {
        code: "CHF",
        name: "Swiss Franc",
        flag: "🇨🇭"
    },

    {
        code: "SGD",
        name: "Singapore Dollar",
        flag: "🇸🇬"
    },

    {
        code: "CNY",
        name: "Chinese Yuan",
        flag: "🇨🇳"
    }

];


async function loadMarket() {

    if (!marketTable) return;


    marketTable.innerHTML = "";


    for (
        const currency of currencies
    ) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${currency.flag}
                ${currency.name}
            </td>

            <td>
                <strong>
                    ${currency.code}
                </strong>
            </td>

            <td id="rate-${currency.code}">
                Loading...
            </td>

            <td>
                <span class="status">
                    Live Reference
                </span>
            </td>

        `;


        marketTable.appendChild(row);


        try {

            const rate =
                await fetchRate(
                    currency.code,
                    "INR"
                );


            const cell =
                document.getElementById(
                    `rate-${currency.code}`
                );


            if (cell) {

                cell.textContent =
                    formatNumber(rate);

            }

        }

        catch (error) {

            const cell =
                document.getElementById(
                    `rate-${currency.code}`
                );


            if (cell) {

                cell.textContent =
                    "Unavailable";

            }

        }

    }


    if (marketUpdated) {

        marketUpdated.textContent =
            `Updated ${new Date().toLocaleString()}`;

    }


    loadMarketCards();

}


/* =========================================================
   MARKET CARDS
========================================================= */

async function loadMarketCards() {

    const cards = {

        USD: "marketUsd",

        EUR: "marketEur",

        GBP: "marketGbp",

        JPY: "marketJpy"

    };


    for (
        const currency in cards
    ) {

        const element =
            document.getElementById(
                cards[currency]
            );


        if (!element) continue;


        try {

            const rate =
                await fetchRate(
                    currency,
                    "INR"
                );


            element.textContent =
                formatNumber(rate);

        }

        catch (error) {

            element.textContent =
                "Unavailable";

        }

    }

}


/* =========================================================
   MARKET SEARCH
========================================================= */

if (currencySearch) {

    currencySearch.addEventListener(
        "input",
        () => {

            const search =
                currencySearch.value
                    .toLowerCase()
                    .trim();


            const rows =
                marketTable.querySelectorAll(
                    "tr"
                );


            rows.forEach(row => {

                const text =
                    row.textContent
                        .toLowerCase();


                row.style.display =
                    text.includes(search)
                        ? ""
                        : "none";

            });

        }
    );

}


/* =========================================================
   MARKET REFRESH
========================================================= */

if (marketRefresh) {

    marketRefresh.addEventListener(
        "click",
        async () => {

            marketRefresh.disabled =
                true;

            marketRefresh.textContent =
                "⏳ Loading...";


            await loadMarket();


            marketRefresh.disabled =
                false;

            marketRefresh.textContent =
                "🔄 Refresh";

        }
    );

}


/* =========================================================
   HOMEPAGE REFRESH
========================================================= */

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        async () => {

            refreshBtn.disabled =
                true;

            refreshBtn.textContent =
                "⏳ Updating...";


            await convertCurrency();

            await loadPopularRates();


            refreshBtn.disabled =
                false;

            refreshBtn.textContent =
                "🔄 Refresh";


            showToast(
                "Rates refreshed."
            );

        }
    );

}


/* =========================================================
   DARK MODE
========================================================= */

function setTheme(theme) {

    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );


        if (themeBtn) {

            themeBtn.textContent =
                "☀️";

        }

    }

    else {

        document.body.classList.remove(
            "dark"
        );


        if (themeBtn) {

            themeBtn.textContent =
                "🌙";

        }

    }

}


const savedTheme =
    localStorage.getItem(
        "ratex-theme"
    );


if (savedTheme) {

    setTheme(savedTheme);

}


if (themeBtn) {

    themeBtn.addEventListener(
        "click",
        () => {

            const dark =
                document.body.classList.contains(
                    "dark"
                );


            const newTheme =
                dark
                    ? "light"
                    : "dark";


            setTheme(newTheme);


            localStorage.setItem(
                "ratex-theme",
                newTheme
            );

        }
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            amount &&
            fromCurrency &&
            toCurrency
        ) {

            convertCurrency();

            loadPopularRates();

        }


        if (marketTable) {

            loadMarket();

        }

    }
);
