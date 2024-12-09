import { throwError } from "./Main";

export function addItemToTradeOffer(asset_id: string) {
    const your_side = window['g_rgCurrentTradeStatus']['me']['assets']
    const their_side = window['g_rgCurrentTradeStatus']['them']['assets']

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

            window['GTradeStateManager']['m_bChangesMade'] = true
            window['g_rgCurrentTradeStatus']['version']++
        }
    } else {
        throwError(`Item with asset_id '${asset_id}' was not found.`)
    }
}

export function addItemFromTradeOffer(asset_id: string) {}

export function updateRenderingItems() {}

export function getTheirInventory() {}