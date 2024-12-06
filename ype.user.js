// ==UserScript==
// @name            Your Personal Engineer
// @description     Makes your trading routine more comfortable.
// @author          https://steamcommunity.com/id/EurekaEffect/
// @version         1.0

// @updateURL       https://github.com/EurekaEffect/your-personal-engineer/raw/refs/heads/master/ype.user.js
// @downloadURL     https://github.com/EurekaEffect/your-personal-engineer/raw/refs/heads/master/ype.user.js

// @match           *://backpack.tf/stats/*
// @match           *://backpack.tf/classifieds*

// @run-at       document-start
// ==/UserScript==

const button_color = '#b98fc8';
const button_hint = 'Click to send an Instant Trade Offer.';

(async function () {
    await awaitDocumentReady()

    const listings = document.querySelectorAll('.listing')

    for (const listing of listings) {
        const $item = listing.querySelector('.item')

        /* Item parameters */
        const item_name = $item.getAttribute('title')
        const asset_id = $item.getAttribute('data-id')
        const price = $item.getAttribute("data-listing_price");

        const paint_name = $item.getAttribute("data-paint_name")

        const killstreak_tier = $item.getAttribute('data-ks_tier')
        const killstreak_sheen = $item.getAttribute('data-sheen')
        const killstreak_effect = $item.getAttribute('data-killstreaker')

        const spell_1 = $item.getAttribute('data-spell_1')
        const spell_2 = $item.getAttribute('data-spell_2')

        const strange_part_1 = $item.getAttribute('data-part_name_1')
        const strange_part_2 = $item.getAttribute('data-part_name_2')
        const strange_part_3 = $item.getAttribute('data-part_name_3')

        const intent = $item.getAttribute('data-listing_intent')
        /* Item parameters */

        if (!price) {
            // Probably $ instead of virtual currency.
            continue
        }

        const $buttons = listing.querySelector('.listing-buttons')

        const $trade_offer_button = $buttons.querySelector('.btn-success, .btn-primary')

        const trade_offer_url = $trade_offer_button.getAttribute('href')
        const is_trade_offer_url = isTradeOfferUrl(trade_offer_url)

        if (is_trade_offer_url) {
            const $instant_trade_offer_button = $trade_offer_button.cloneNode(true)

            if (intent === 'sell') {
                // Sell order.
                $instant_trade_offer_button.setAttribute('href', `${trade_offer_url}&ype.asset_id=${asset_id}&ype.price=${price}`)
            } else {
                // Buy order.
                const modifications = {}

                if (item_name.includes('Unusual')) {
                    if (item_name.includes("Horseless Headless Horsemann's Headtaker") || item_name.includes('Metal Scrap')) {
                        // Treat like a normal listing.
                    } else {
                        // Skip, the listing doesn't have an unusual effect.
                        continue
                    }
                }

                // Handling the paint attribute.
                if ($item.hasAttribute('data-paint_name')) {
                    if (item_name === paint_name) {
                        // The item is a paint can.
                    } else {
                        // Adding the paint to the descriptions.
                        modifications['paint'] = paint_name
                    }
                }

                // Handling the killstreak attributes.
                if ($item.hasAttribute('data-ks_tier')) {
                    // Adding the killstreaker.
                    modifications['ks'] = []

                    if ($item.hasAttribute('data-sheen')) {
                        // Adding the sheen to the descriptions.
                        modifications['ks'].push(killstreak_sheen)
                    }

                    if ($item.hasAttribute('data-killstreaker')) {
                        // Adding the effect to the descriptions.
                        modifications['ks'].push(killstreak_effect)
                    }
                }

                // Handling the spell attributes.
                if ($item.hasAttribute('data-spell_1')) {
                    function toSpellName(data_spell) {
                        return data_spell.split(':')[1].trim()
                    }

                    // Adding the first spell.
                    const spell_name_1 = toSpellName(spell_1)
                    modifications['spells'] = [spell_name_1]

                    if ($item.hasAttribute('data-spell_2')) {
                        // Adding the second spell.
                        const spell_name_2 = toSpellName(spell_2)
                        modifications['spells'].push(spell_name_2)
                    }
                }

                // Handling the strange part attributes.
                if ($item.hasAttribute('data-part_name_1')) {
                    // Adding the first strange part.
                    modifications['parts'] = [strange_part_1]

                    if ($item.hasAttribute('data-part_name_2')) {
                        // Adding the second strange part.
                        modifications['parts'].push(strange_part_2)

                        if ($item.hasAttribute('data-part_name_3')) {
                            // Adding the third strange part.
                            modifications['parts'].push(strange_part_3)
                        }
                    }
                }

                if (Object.keys(modifications).length > 0) {
                    const encoded_descriptions = encodeURI(JSON.stringify(modifications))
                    $instant_trade_offer_button.setAttribute('href', `${trade_offer_url}&ype.item_name=${item_name}&ype.price=${price}&ype.descriptions=${encoded_descriptions}`)
                } else {
                    $instant_trade_offer_button.setAttribute('href', `${trade_offer_url}&ype.item_name=${item_name}&ype.price=${price}`)
                }
            }

            $instant_trade_offer_button.setAttribute('title', button_hint)

            Object.assign($instant_trade_offer_button.style, {
                backgroundColor: button_color,
                borderColor: button_color
            })

            $buttons.append($instant_trade_offer_button)
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

/*
if (intent === 'sell') {
                // Sell order.
                $instant_trade_offer_button.setAttribute('href', `${trade_offer_url}&ype.asset_id=${asset_id}&ype.price=${price}`)
            } else {
                // Buy order.

                const descriptions = []

                if (item_name.includes('Unusual')) {
                    if (item_name.includes("Horseless Headless Horsemann's Headtaker") || item_name.includes('Metal Scrap')) {
                        // Treat like a normal listing.
                    } else {
                        // Skip, the listing doesn't have an unusual effect.
                        continue
                    }
                }

                if ($item.hasAttribute('data-paint_name')) {
                    if (item_name === paint_name) {
                        // The item is the paint can.
                    } else {
                        // Adding the paint to the descriptions.
                        descriptions.push({value: `Paint Color: ${paint_name}`})
                    }
                }

                if ($item.hasAttribute('data-ks_tier')) {
                    if ($item.hasAttribute('data-sheen')) {
                        // Adding the sheen to the descriptions.
                        descriptions.push({ value: `Sheen: ${killstreak_sheen}` })
                    }

                    if ($item.hasAttribute('data-killstreaker')) {
                        // Adding the effect to the descriptions.
                        descriptions.push({ value: `Killstreaker: ${killstreak_effect}` })
                    }

                    // Adding the killstreaker.
                    descriptions.push({ value: `Killstreaks Active` })
                }

                if ($item.hasAttribute('data-spell_1')) {
                    function toDescription(data_spell) {
                        const spell_name = data_spell.split(':')[1].trim()
                        return `Halloween: ${spell_name} (spell only active during event)`
                    }

                    // Adding the first spell.
                    descriptions.push({ value: toDescription(spell_1) })

                    if ($item.hasAttribute('data-spell_2')) {
                        // Adding the second spell.
                        descriptions.push({ value: toDescription(spell_2) })
                    }
                }

                if (descriptions.length > 0) {
                    const encoded_descriptions = encodeURI(JSON.stringify(descriptions))
                    $instant_trade_offer_button.setAttribute('href', `${trade_offer_url}&ype.item_name=${item_name}&ype.descriptions=${encoded_descriptions}&ype.price=${price}`)
                } else {
                    $instant_trade_offer_button.setAttribute('href', `${trade_offer_url}&ype.item_name=${item_name}&ype.price=${price}`)
                }
            }
 */