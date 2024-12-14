import {error, getWindow, throwError} from "../Main";

export async function SetItemsInTrade(asset_ids: string[]) {
    return new Promise<string[]>((resolve) => {
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
                    alert(`Item with id '${asset_id}' is already in a trade slot.`)
                    error('TradeOffer.SetItemsInTrade', `Item with id '${asset_id}' is already in a trade slot.`)
                } else {
                    //setTimeout(() => {
                        CTradeOfferStateManager['SetItemInTrade'](item, 0, 1)
                    //}, 1)
                }
            } else {
                alert(`Item with id '${asset_id}' not found.`)
                error('TradeOffer.SetItemsInTrade', `Item with id '${asset_id}' not found.`)
            }
        }

        CTradeOfferStateManager['UpdateTradeStatus'] = prev_UpdateTradeStatus
        CTradeOfferStateManager['UpdateTradeStatus']()

        resolve(asset_ids)
    })
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

export function SearchItemsByName(user: string, item_name_to_search: string) {
    const is_user_you = user === 'UserYou'
    const is_user_them = user === 'UserThem'

    if (!is_user_you && !is_user_them) {
        throwError(`Unknown user '${user}'.`)
    }

    const inventory = getWindow()[user]['getInventory'](440, 2)['rgInventory']
    const asset_ids: any = []

    for (let asset_id in inventory) {
        const item = inventory[asset_id] // rgItem
        const item_name = item['market_name']

        const is_in_trade_slot = getWindow()['BIsInTradeSlot'](item)
        if (is_in_trade_slot) continue

        if (item_name === item_name_to_search) {
            asset_ids.push(asset_id)
        }
    }

    return asset_ids
}

export function removeItemFromTradeOffer(asset_id: string) {}

export function refreshTradeStatus() {
    getWindow()['RefreshTradeStatus'](getWindow()['g_rgCurrentTradeStatus'])
}