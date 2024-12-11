// I'm going to redo everything I did before using TypeScript to make the code more readable.
// TS will compile every .ts file into a JS bundle (ype.bundle.user.js).
// I will use it because I don't know how to divide a one single JS file into multiple files and make it work in TamperMonkey.
// BTW even if I knew I'd use TS since it's way cooler than JS :sunglasses:.

import {SetItemInTrade, isTradeOfferUrl, refreshTradeStatus} from "./TradeOffer";

(async function () {
    const is_trade_offer_page = isTradeOfferUrl(location.href)

    if (is_trade_offer_page) {
        const params = new URLSearchParams(location.search)

        const asset_id = params.get('ype.asset_id')
        if (!asset_id) return

        // Loading their inventory element.
        window()['UserThem']['loadInventory'](440, 2)

        const prev_their_OnLoadInventoryComplete = window()['UserThem']['OnLoadInventoryComplete']
        window()['UserThem']['OnLoadInventoryComplete'] = function (transport: any, appid: any, contextid: any ) {
            window()['UserThem']['OnLoadInventoryComplete'] = prev_their_OnLoadInventoryComplete
            window()['UserThem']['OnLoadInventoryComplete'](transport, appid, contextid) // Running the original function that will add their inventory element, required for the next code.

            // Loading their items.
            const inventory = window()['UserThem']['getInventory'](440, 2)
            inventory['Initialize']()
            inventory['MakeActive']()

            // Hiding the inventory because it overlaps ours.
            window()['g_ActiveInventory'] = inventory
            window()['g_ActiveInventory']['hide']()
            window()['SelectInventoryFromUser'](window()['UserYou'], 440, 2, false)

            SetItemInTrade(asset_id)
        }
    }
})()

/* Logger */
export function throwError(message: string) {
    alert(`Script: Your Personal Engineer\nMessage: ${message}`)
    throw Error(message)
}

export function window(): object {
    // @ts-ignore
    return unsafeWindow
}