import {error, getWindow, throwError} from "../Main";
import {resolve} from "uri-js";

export async function SetItemsInTrade(asset_ids: string[]) {
    return new Promise<string[]>(async (resolve) => {
        const CTradeOfferStateManager = getWindow()['CTradeOfferStateManager']

        for (let asset_id of asset_ids) {
            const $item = document.querySelector(`#item440_2_${asset_id}`)

            if ($item) {
                const item = $item['rgItem']
                const is_in_trade_slot = getWindow()['BIsInTradeSlot'](item)

                if (is_in_trade_slot) {
                    alert(`Item with id '${asset_id}' is already in a trade slot.`)
                    error('TradeOffer.SetItemsInTrade', `Item with id '${asset_id}' is already in a trade slot.`)
                } else {
                    await new Promise((resolve) => {
                        setTimeout(() => {
                            CTradeOfferStateManager['SetItemInTrade'](item, 0, 1)
                            resolve(true)
                        }, 1)
                    })
                }
            } else {
                alert(`Item with id '${asset_id}' not found.`)
                error('TradeOffer.SetItemsInTrade', `Item with id '${asset_id}' not found.`)
            }
        }

        resolve(asset_ids)
    })
}

export async function SetItemInTrade(asset_id: string) {
    return new Promise(async (resolve, reject) => {
        const $item = document.querySelector(`#item440_2_${asset_id}`)

        if ($item) {
            const item = $item['rgItem']
            const is_in_trade_slot = getWindow()['BIsInTradeSlot'](item)

            if (is_in_trade_slot) {
                reject(`Item with id '${asset_id}' is already in a trade slot.`)
            } else {
                getWindow()['CTradeOfferStateManager']['SetItemInTrade'](item, 0, 1)

                await new Promise((resolve) => {
                    setTimeout(() => {
                        getWindow()['CTradeOfferStateManager']['SetItemInTrade'](item, 0, 1)
                        resolve(true)
                    }, 1)
                })

                resolve(true)
            }
        } else {
            reject(`Item with id '${asset_id}' not found.`)
        }

        resolve(false)
    })
}

export function getRgItemsByName(user: string, item_name_to_search: string): any[] {
    const is_user_you = user === 'UserYou'
    const is_user_them = user === 'UserThem'

    if (!is_user_you && !is_user_them) {
        throwError(`Unknown user '${user}'.`)
    }

    const inventory = getWindow()[user]['getInventory'](440, 2)['rgInventory']
    const asset_ids: any[] = []

    for (let asset_id in inventory) {
        const item = inventory[asset_id] // rgItem
        const item_name = item['market_name']

        const is_in_trade_slot = getWindow()['BIsInTradeSlot'](item)
        if (is_in_trade_slot) continue

        if (item_name === item_name_to_search) {
            asset_ids.push(item)
        }
    }

    return asset_ids
}

export function getRgItemByAssetId(user: string, asset_id_to_search: string) {
    const is_user_you = user === 'UserYou'
    const is_user_them = user === 'UserThem'

    if (!is_user_you && !is_user_them) {
        throwError(`Unknown user '${user}'.`)
    }

    const inventory = getWindow()[user]['getInventory'](440, 2)['rgInventory']

    for (let asset_id in inventory) {
        const item = inventory[asset_id] // rgItem

        const is_in_trade_slot = getWindow()['BIsInTradeSlot'](item)
        if (is_in_trade_slot) continue

        if (asset_id === asset_id_to_search) {
            return item
        }
    }

    return undefined
}

export function removeItemFromTradeOffer(asset_id: string) {}

export function refreshTradeStatus() {
    getWindow()['RefreshTradeStatus'](getWindow()['g_rgCurrentTradeStatus'])
}