// ==UserScript==
// @name            Your Personal Engineer
// @description     Makes your trading routine more comfortable.
// @author          https://steamcommunity.com/id/EurekaEffect/
// @version         1.0

// @updateURL       ~
// @downloadURL     ~

// @match           *://backpack.tf/stats/*
// @match           *://backpack.tf/classifieds*

// @run-at       document-start
// ==/UserScript==

const button_color = '#b98fc8'
const button_hint = 'Click to send an Instant Trade Offer.'

const trade_offer_page = {
    'you': window['UserYou'],
    'them': window['UserThem'],
    'session_id': window['g_sessionID'],
    'partner_steam_id': window['g_ulTradePartnerSteamID']
};

(async function () {
    await awaitDocumentReady()

    const listings = document.querySelectorAll('.listing')

    for (const listing of listings) {
        const item = listing.querySelector('.item')

        const asset_id = item.getAttribute('data-id')
        const price = encodeURI('{ "keys": 0, "metal": 5.22 }' /* TODO create a function that converts price argument to json */)

        const buttons = listing.querySelector('.listing-buttons')

        const trade_offer_button = buttons.querySelector('.btn-success, .btn-primary')

        const trade_offer_url = trade_offer_button.getAttribute('href')
        const is_trade_offer_url = isTradeOfferUrl(trade_offer_url)

        if (is_trade_offer_url) {
            const instant_trade_offer_button = trade_offer_button.cloneNode(true)

            instant_trade_offer_button.setAttribute('href', `${trade_offer_url}&ype.asset_id=${asset_id}&ype.price=${price}`)
            instant_trade_offer_button.setAttribute('title', button_hint)

            Object.assign(instant_trade_offer_button.style, {
                backgroundColor: button_color,
                borderColor: button_color
            })

            buttons.append(instant_trade_offer_button)
        } else {
            // Searching for trade offer url manually
        }
    }
})();

function isTradeOfferUrl(url) {
    return /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=.+$/.test(url)
}

// Thanks Brom127 for the method!
function awaitDocumentReady() {
    return new Promise(async (res) => {
        if (document.readyState !== 'loading') {
            res()
        } else {
            document.addEventListener('DOMContentLoaded', res)
        }
    })
}