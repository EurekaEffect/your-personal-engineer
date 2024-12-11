// I'm going to redo everything I did before using TypeScript to make the code more readable.
// TS will compile every .ts file into a JS bundle (ype.bundle.user.js).
// I will use it because I don't know how to divide a one single JS file into multiple files and make it work in TamperMonkey.
// BTW even if I knew I'd use TS since it's way cooler than JS :sunglasses:.

import {SetItemInTrade, isTradeOfferUrl, refreshTradeStatus, SearchItemByName} from "./TradeOffer";

// Main code.
(async function () {
    const is_trade_offer_page = isTradeOfferUrl(location.href)

    if (is_trade_offer_page) {
        loadInventory('UserYou')
        loadInventory('UserThem')
    }
})()

// Listeners.
window.addEventListener('inventory_load_complete', (event) => {
    const user = event['detail']['user']
    const is_user_you = user === 'UserYou'
    const is_user_them = user === 'UserThem'
    const inventory = event['detail']['inventory']['rgInventory']

    const params = new URLSearchParams(location.search)
    const asset_id = params.get('ype.asset_id') // ID of the item.
    const item_name = params.get('ype.item_name') // In case when the item is sold but the item is liquid like a key.

    if (is_user_them && asset_id) {
        try {
            log('Main.inventory_load_complete', `Adding an item with id '${asset_id}' to the trade offer.`)
            SetItemInTrade(asset_id)
        } catch (error) { // Item is not found, searching another one by name.
            log('Main.inventory_load_complete', `Item with id '${asset_id}' not found.`)

            if (item_name) {
                log('Main.inventory_load_complete', `Searching for '${item_name}' instead.`)
                const second_asset_id = SearchItemByName(user, item_name)

                if (second_asset_id) {
                    log('Main.inventory_load_complete', `Found an item with the exact name, it's id is '${second_asset_id}', adding to the trade offer.`)
                    SetItemInTrade(second_asset_id)
                } else {
                    const error_message = `Cannot find an item with id '${asset_id}' nor with item '${item_name}'.`

                    alert(error_message)
                    throwError(error_message)
                }
            } else {
                const error_message = `Cannot find an item with id '${asset_id}', ype.item_name is not presents.`

                alert(error_message)
                throwError(error_message)
            }
        }
    }
})

// Functions.
function loadInventory(user: string) {
    const is_user_you = user === 'UserYou'
    const is_user_them = user === 'UserThem'

    if (!is_user_you && !is_user_them) {
        return console.error(`[YPE, Main.loadInventory] Unknown user '${user}'.`)
    }

    if (is_user_them) {
        getWindow()[user]['loadInventory'](440, 2) // Loading their inventory element.
    }

    const prev_OnLoadInventoryComplete = getWindow()[user]['OnLoadInventoryComplete']
    getWindow()[user]['OnLoadInventoryComplete'] = function (transport: any, appid: any, contextid: any ) {
        getWindow()[user]['OnLoadInventoryComplete'] = prev_OnLoadInventoryComplete
        getWindow()[user]['OnLoadInventoryComplete'](transport, appid, contextid) // Running the original function that will add an inventory element, required for the next code.

        const inventory = getWindow()[user]['getInventory'](440, 2)

        if (is_user_them) {
            // Loading items.
            inventory['Initialize']()
            inventory['MakeActive']()

            // Hiding the inventory because it overlaps ours.
            getWindow()['g_ActiveInventory'] = inventory
            getWindow()['g_ActiveInventory']['hide']()
            getWindow()['SelectInventoryFromUser'](getWindow()['UserYou'], 440, 2, false)
        }

        const event = new CustomEvent('inventory_load_complete', {
            detail: {
                user: user,
                inventory: inventory
            }
        })
        window.dispatchEvent(event)
    }
}

// Yeah, it atertinating.
export function alert(message: string) {
    window.alert(`Script: Your Personal Engineer\nMessage: ${message}`)
}

// Yeah, it logs.
export function log(method: string, message: string) {
    console.log(`[YPE, ${method}] ${message}`);
}

// Yeah, it throws an error.
export function throwError(message: string) {
    throw Error(message)
}

// Getting the access to the global variables.
export function getWindow(): object {
    // @ts-ignore
    return unsafeWindow
}