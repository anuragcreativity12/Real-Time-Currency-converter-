/* =========================================================
   RATEX — CURRENCY ENGINE
========================================================= */

"use strict";


/* =========================================================
   API
========================================================= */

const API =
    "https://api.frankfurter.app";


/* =========================================================
   ELEMENTS
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

const convertBtn =
    document.getElementById("convertBtn");

const swapBtn =
    document.getElementById("swapBtn");

const themeBtn =
    document.getElementById("themeBtn");

const refreshBtn =
    document.getElementById("marketRefresh");


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            maximumFractionDigits: 4,
            minimumFractionDigits: 2
        }
    ).format(value);

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    const toast =
        document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}


/* =========================================================
   CONNECTION STATUS
========================================================= */

function setConnectionStatus(
    connected
) {

    const status =
        document.getElementById(
            "connectionStatus"
        );

    if (!status) return;


    const dot =
        status.querySelector("span");


    if (connected) {

        status.innerHTML =
            `<span></span> Live data connected`;

        dot.style.background =
            "var(--success)";

    } else {

        status.innerHTML =
            `<span></span> Data unavailable`;

        const newDot =
            status.querySelector("span");

        newDot.style.background =
            "var(--danger)";

    }

}


/* =========================================================
   GET RATE
========================================================= */

async function getRate(
    from,
    to
) {

    if (from === to) {

        return 1;

    }


    const url =
        `${API}/latest?from=${from}&to=${to}`;


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Exchange API request failed"
        );

    }


    const data =
        await response.json();


    if (
        !data.rates ||
        typeof data.rates[to] !== "number"
    ) {

        throw new Error(
            "Rate not available"
        );

    }


    return data.rates[to];

}


/* =========================================================
   CONVERT
========================================================= */

async function convertCurrency() {

    if (!amount ||
        !fromCurrency ||
        !toCurrency ||
        !result) {

        return;

    }


    const value =
        Number(amount.value);


    const from =
        fromCurrency.value;


    const to =
        toCurrency.value;


    if (
        !Number.isFinite(value) ||
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
            "Fetching current rate...";

    }


    try {

        const rate =
            await getRate(
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
                new Date()
                .toLocaleTimeString(
                    "en-IN",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

        }


        setConnectionStatus(true);


        saveRecentConversion({
            amount: value,
            from,
            to,
            result: converted
        });


    } catch (error) {

        console.error(error);


        result.value =
            "Unavailable";


        if (rateText) {

            rateText.textContent =
                "Unable to retrieve current rate";

        }


        if (updateTime) {

            updateTime.textContent =
                "Try again later";

        }


        setConnectionStatus(false);


        showToast(
            "Live exchange data could not be loaded."
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
   AUTO CONVERT
========================================================= */

if (amount) {

    amount.addEventListener(
        "input",
        () => {

            clearTimeout(
                window.convertTimer
            );


            window.convertTimer =
                setTimeout(
                    convertCurrency,
                    500
                );

        }
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
   MARKET RATES
========================================================= */

async function loadMarketRates() {

    try {

        /*
          One USD request.
          We calculate INR pairs
          from USD reference rates.
        */

        const response =
            await fetch(
                `${API}/latest?from=USD`
            );


        if (!response.ok) {

            throw new Error(
                "Market API error"
            );

        }


        const data =
            await response.json();


        const rates =
            data.rates;


        const usdInrRate =
            rates.INR;


        const eurUsd =
            rates.EUR;


        const gbpUsd =
            rates.GBP;


        const aedUsd =
            rates.AED;


        const usdEur =
            1 / eurUsd;


        const usdGbp =
            1 / gbpUsd;


        const eurInr =
            usdInrRate / eurUsd;


        const gbpInr =
            usdInrRate / gbpUsd;


        const aedInr =
            usdInrRate / aedUsd;


        setText(
            "usdInr",
            `₹${formatNumber(usdInrRate)}`
        );


        setText(
            "eurInr",
            `₹${formatNumber(eurInr)}`
        );


        setText(
            "gbpInr",
            `₹${formatNumber(gbpInr)}`
        );


        setText(
            "aedInr",
            `₹${formatNumber(aedInr)}`
        );


        setText(
            "marketUsdInr",
            `₹${formatNumber(usdInrRate)}`
        );


        setText(
            "marketEurInr",
            `₹${formatNumber(eurInr)}`
        );


        setText(
            "marketGbpInr",
            `₹${formatNumber(gbpInr)}`
        );


        setText(
            "marketAedInr",
            `₹${formatNumber(aedInr)}`
        );


        setText(
            "marketUsdEur",
            formatNumber(usdEur)
        );


        setText(
            "marketUsdGbp",
            formatNumber(usdGbp)
        );


        setText(
            "usdStatus",
            "Updated"
        );


    } catch (error) {

        console.error(
            "Market error:",
            error
        );


        const ids = [

            "usdInr",
            "eurInr",
            "gbpInr",
            "aedInr",

            "marketUsdInr",
            "marketEurInr",
            "marketGbpInr",
            "marketAedInr",
            "marketUsdEur",
            "marketUsdGbp"

        ];


        ids.forEach(
            id => setText(
                id,
                "Unavailable"
            )
        );


        showToast(
            "Market data unavailable."
        );

    }

}


/* =========================================================
   SAFE TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   MARKET REFRESH
========================================================= */

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        async () => {

            refreshBtn.textContent =
                "↻ Updating...";


            refreshBtn.disabled =
                true;


            await loadMarketRates();


            refreshBtn.textContent =
                "↻ Refresh";


            refreshBtn.disabled =
                false;

        }
    );

}


/* =========================================================
   RECENT CONVERSIONS
========================================================= */

function saveRecentConversion(
    conversion
) {

    let recent =
        JSON.parse(
            localStorage.getItem(
                "ratexRecent"
            ) || "[]"
        );


    recent.unshift(conversion);


    recent =
        recent.slice(0, 5);


    localStorage.setItem(
        "ratexRecent",
        JSON.stringify(recent)
    );


    displayRecent();

}


function displayRecent() {

    const container =
        document.getElementById(
            "recentConversions"
        );


    if (!container) return;


    const recent =
        JSON.parse(
            localStorage.getItem(
                "ratexRecent"
            ) || "[]"
        );


    if (!recent.length) {

        container.innerHTML =
            `<div class="empty-state">
                No conversions yet.
            </div>`;

        return;

    }


    container.innerHTML =
        recent.map(
            item => `

                <div class="recent-item">

                    <div>

                        <div class="recent-pair">

                            ${item.from}
                            →
                            ${item.to}

                        </div>

                        <div class="recent-value">

                            ${formatNumber(item.amount)}
                            ${item.from}

                        </div>

                    </div>


                    <div class="recent-value">

                        ${formatNumber(item.result)}
                        ${item.to}

                    </div>

                </div>

            `
        ).join("");

}


/* =========================================================
   THEME
========================================================= */

function updateThemeIcon() {

    if (!themeBtn) return;


    const dark =
        document.body.classList.contains(
            "dark"
        );


    themeBtn.textContent =
        dark ? "☀" : "☾";

}


if (themeBtn) {

    themeBtn.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark"
            );


            const mode =
                document.body.classList.contains(
                    "dark"
                )
                    ? "dark"
                    : "light";


            localStorage.setItem(
                "ratexTheme",
                mode
            );


            updateThemeIcon();

        }
    );

}


/* =========================================================
   LOAD THEME
========================================================= */

const savedTheme =
    localStorage.getItem(
        "ratexTheme"
    );


if (savedTheme === "dark") {

    document.body.classList.add(
        "dark"
    );

}


updateThemeIcon();


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        displayRecent();

        convertCurrency();

        loadMarketRates();

    }
);


/* =========================================================
   MARKET AUTO REFRESH
========================================================= */

setInterval(
    loadMarketRates,
    5 * 60 * 1000
);
