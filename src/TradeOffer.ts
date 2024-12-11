import {window, throwError} from "./Main";

export function SetItemsInTrade(asset_ids: string[]) {
    const CTradeOfferStateManager = window()['CTradeOfferStateManager']

    const prev_UpdateTradeStatus = CTradeOfferStateManager['UpdateTradeStatus']
    // This function slow-downs adding an item to the trade offer,
    // so we overriding it and setting it back later.
    CTradeOfferStateManager['UpdateTradeStatus'] = function () {}

    for (let asset_id of asset_ids) {
        const $item = document.querySelector(`#item440_2_${asset_id}`)

        if ($item) {
            const item = $item['rgItem']
            const is_in_trade_slot = window()['BIsInTradeSlot'](item)

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
        const is_in_trade_slot = window()['BIsInTradeSlot'](item)

        if (is_in_trade_slot) {
            throwError(`Item with id '${asset_id}' is already in a trade slot.`)
        } else {
            window()['CTradeOfferStateManager']['SetItemInTrade'](item, 0, 1)
        }
    } else {
        throwError(`Item with id '${asset_id}' not found.`)
    }

    /*const your_side = getWindow()['g_rgCurrentTradeStatus']['me']['assets']
    const their_side = getWindow()['g_rgCurrentTradeStatus']['them']['assets']

    const $item = document.querySelector(`#item440_2_${asset_id}`)

    if ($item) {
        const item = $item['rgItem']
        const is_their_item = item['is_their_item']
        const side = (is_their_item ? their_side : your_side)

        const is_in_trade = side.find((item) => item['assetid'] === asset_id)

        if (is_in_trade) {
            throwError(`Item with asset_id '${asset_id}' is already in a trade offer.`)
        } else {
            side.push({
                appid: 440,
                contextid: '2',
                amount: 1,
                assetid: asset_id
            })

            getWindow()['GTradeStateManager']['m_bChangesMade'] = true
            getWindow()['g_rgCurrentTradeStatus']['version']++
        }
    } else {
        throwError(`Item with asset_id '${asset_id}' was not found.`)
    }*/
}

export function removeItemFromTradeOffer(asset_id: string) {}

export function refreshTradeStatus() {
    window()['RefreshTradeStatus'](window()['g_rgCurrentTradeStatus'])
}

export function isTradeOfferUrl(url: string) {
    return /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=.+$/.test(url)
}