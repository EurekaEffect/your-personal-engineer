import {getWindow, throwError} from "../Main";

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
                setTimeout(() => {
                    CTradeOfferStateManager['SetItemInTrade'](item, 0, 1)
                }, 1)
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