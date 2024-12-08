// ==UserScript==
// @name            Your Personal Engineer
// @description     Makes your trading routine more comfortable.
// @author          https://steamcommunity.com/id/EurekaEffect/
// @version         1.0

// @updateURL       https://github.com/EurekaEffect/your-personal-engineer/raw/refs/heads/master/ype.user.js
// @downloadURL     https://github.com/EurekaEffect/your-personal-engineer/raw/refs/heads/master/ype.user.js

// @match           *://backpack.tf/stats/*
// @match           *://backpack.tf/classifieds*

// @run-at          document-start
// ==/UserScript==

// TODO: додати кнопку на stats/classifieds яка дасть змогу перевірити обмін перед його надсиланням (запобіжник)

const button_color = '#b98fc8';
const button_color_warning = '#ef4363';

const button_hint = 'Click to send an Instant Trade Offer.';
const button_hint_warning = 'Warning! Double-check the item that the script will add and make sure it is the correct one. Click to send an Instant Trade Offer.';

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
                $instant_trade_offer_button.setAttribute('title', button_hint)

                Object.assign($instant_trade_offer_button.style, {
                    backgroundColor: button_color,
                    borderColor: button_color
                })
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
                        modifications['paint'] = paint_name // Adding the paint to the descriptions.
                    }
                }

                // Handling the killstreak attributes.
                if ($item.hasAttribute('data-ks_tier')) {
                    const is_sheen_present = $item.hasAttribute('data-sheen')
                    const is_effect_present = $item.hasAttribute('data-killstreaker')

                    if (is_sheen_present || is_effect_present) {
                        modifications['ks'] = [] // Adding the killstreaker.

                        if (is_sheen_present) {
                            modifications['ks'].push(killstreak_sheen) // Adding the sheen to the descriptions.
                        }

                        if (is_effect_present) {
                            modifications['ks'].push(killstreak_effect) // Adding the effect to the descriptions.
                        }
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

                $instant_trade_offer_button.setAttribute('title', button_hint_warning)

                Object.assign($instant_trade_offer_button.style, {
                    backgroundColor: button_color_warning,
                    borderColor: button_color_warning
                })
            }

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

/* Trade Offer */
function addItemToTradeOffer(asset_id) {
    const your_side = window['g_rgCurrentTradeStatus']['me']['assets']
    const their_side = window['g_rgCurrentTradeStatus']['them']['assets']

    asset_id = String(asset_id) // asset_id's should be treated as string.

    const $item = document.querySelector(`#item440_2_${asset_id}`)

    if ($item) {
        const item = $item['rgItem']
        const is_their_item = item['is_their_item']
        const side = (is_their_item ? their_side : your_side)

        const is_in_trade = side.find((item) => item['assetid'] === asset_id)

        if (is_in_trade) {
            error(`Item with asset_id '${asset_id}' is already in a trade offer.`)
        } else {
            side.push({
                appid: 440,
                contextid: '2',
                amount: 1,
                assetid: asset_id
            })

            window['GTradeStateManager']['m_bChangesMade'] = true
            window['g_rgCurrentTradeStatus']['version']++
        }
    } else {
        error(`Item with asset_id '${asset_id}' was not found.`)
    }
}

function removeItemFromTradeOffer(asset_id) {
    const $item = document.querySelector(`#item440_2_${asset_id}`)

    if ($item) {
        const item = $item['rgItem']

        if (window['BIsInTradeSlot'](item)) {
            window['GTradeStateManager']['RemoveItemFromTrade'](item)
        } else {
            error(`Item with asset_id '${asset_id}' is not in a trade slot.`)
        }
    } else {
        error(`Item with asset_id '${asset_id}' was not found.`)
    }
}

function updateRenderingItems() {
    window['RefreshTradeStatus'](window['g_rgCurrentTradeStatus'])
}

async function getTheirInventory() {
    const them = window['UserThem']

    function preloadTheirInventoryElements() {
        const inventory = them['getInventory'](440, 2)
        const $inventory = inventory['elInventory']

        inventory['Initialize']()
        inventory['MakeActive']()

        $inventory.style.display = 'none' // Hiding their inventory to prevent overlapping.
    }

    return await new Promise(async (resolve, reject) => {
        const tf2_inventory_presents = them['rgContexts'][440]

        if (!tf2_inventory_presents) {
            error(`tf2_inventory_not_present`)
            resolve([])
            return
        }

        preloadTheirInventoryElements()

        const timeout = setTimeout(() => {
            error(`Can't load the inventory.`)
            resolve([])
        }, 15_000)

        while (true) {
            const inventory = them['getInventory'](440, 2)

            if (inventory['rgInventory']) {
                clearTimeout(timeout)
                resolve(inventory)
                break
            } else {
                await new Promise((resolve, reject) => setTimeout(resolve, 1))
            }
        }
    })
}
/* Trade Offer */

/* Misc */
function error(message) {
    alert(`Script: Your Personal Engineer\nMessage: ${message}`)
    throw Error(message)
}
/* Misc */

// I need this for the future updates.
// descriptions.push({value: `Paint Color: ${paint_name}`})
// descriptions.push({ value: `Sheen: ${killstreak_sheen}` })
// descriptions.push({ value: `Killstreaker: ${killstreak_effect}` })
// descriptions.push({ value: `Killstreaker: ${killstreak_effect}` })
// function toDescription(data_spell) {
//     const spell_name = data_spell.split(':')[1].trim()
//     return `Halloween: ${spell_name} (spell only active during event)`
// }
// descriptions.push({ value: toDescription(spell_1) })