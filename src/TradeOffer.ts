import {getWindow, throwError} from "./Main";
import {Currencies} from "./Items";

export function SetItemsInTrade(asset_ids: string[]) {
    const CTradeOfferStateManager = getWindow()['CTradeOfferStateManager']

    const prev_UpdateTradeStatus = CTradeOfferStateManager['UpdateTradeStatus']
    // This function slow-downs adding an item to the trade offer,
    // so we overriding it and setting it back later.
    CTradeOfferStateManager['UpdateTradeStatus'] = function () {}

    for (let asset_id of asset_ids) {
        const $item = document.querySelector(`#item440_2_${asset_id}`)

        if ($item) {
            const item = $item['rgItem']
            const is_in_trade_slot = getWindow()['BIsInTradeSlot'](item)

            if (is_in_trade_slot) {
                throwError(`Item with id '${asset_id}' is already in a trade slot.`)
            } else {
                CTradeOfferStateManager['SetItemInTrade'](item, 0, 1)
            }
        } else {
            throwError(`Item with id '${asset_id}' not found.`)
        }
    }

    CTradeOfferStateManager['UpdateTradeStatus'] = prev_UpdateTradeStatus
    CTradeOfferStateManager['UpdateTradeStatus']()
}

export function SetItemInTrade(asset_id: string) {
    const $item = document.querySelector(`#item440_2_${asset_id}`)

    if ($item) {
        const item = $item['rgItem']
        const is_in_trade_slot = getWindow()['BIsInTradeSlot'](item)

        if (is_in_trade_slot) {
            throwError(`Item with id '${asset_id}' is already in a trade slot.`)
        } else {
            getWindow()['CTradeOfferStateManager']['SetItemInTrade'](item, 0, 1)
        }
    } else {
        throwError(`Item with id '${asset_id}' not found.`)
    }
}

export function SearchItemByName(user: string, item_name_to_search: string) {
    const is_user_you = user === 'UserYou'
    const is_user_them = user === 'UserThem'

    if (!is_user_you && !is_user_them) {
        throwError(`Unknown user '${user}'.`)
    }

    const inventory = getWindow()[user]['getInventory'](440, 2)['rgInventory']

    for (let asset_id in inventory) {
        const item = inventory[asset_id]
        const item_name = item['market_name']

        if (item_name === item_name_to_search) {
            return asset_id
        }
    }

    return undefined
}

export function removeItemFromTradeOffer(asset_id: string) {}

export function refreshTradeStatus() {
    getWindow()['RefreshTradeStatus'](getWindow()['g_rgCurrentTradeStatus'])
}

export function isTradeOfferUrl(url: string) {
    return /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=.+$/.test(url)
}

//
export function updateCurrencies(currencies: Currencies) {
    updateCurrency('key-count', currencies['key'].length)
    updateCurrency('ref-count', currencies['ref'].length)
    updateCurrency('rec-count', currencies['rec'].length)
    updateCurrency('scrap-count', currencies['scrap'].length)
}

function updateCurrency(item_id: string, count: number) {
    const item_ids = ['key-count', 'ref-count', 'rec-count', 'scrap-count']

    if (!item_ids.includes(item_id)) {
        throwError(`Item id '${item_id}' is not valid.`)
    }

    const item_count = document.querySelector(`#${item_id}`)

    if (item_count) {
        item_count.textContent = `${count}x`
    } else {
        throwError(`Element '${item_id}' was not found.`)
    }
}