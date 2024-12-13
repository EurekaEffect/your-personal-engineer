import {getWindow, throwError} from "./Main";

export const KEY_CLASS_ID = '101785959'
export const REC_CLASS_ID = '2674'
export const REF_CLASS_ID = '5564'
export const SCRAP_CLASS_ID = '2675'

export type Currencies = {
    key: any[],
    ref: any[],
    rec: any[],
    scrap: any[]
}

export function getCurrencies(user: string): Currencies {
    return {
        key: getItemsByClassId(user, KEY_CLASS_ID),
        ref: getItemsByClassId(user, REC_CLASS_ID),
        rec: getItemsByClassId(user, REF_CLASS_ID),
        scrap: getItemsByClassId(user, SCRAP_CLASS_ID),
    }
}

export function getItemsByClassId(user: string, class_id_to_search: string) {
    const is_user_you = user === 'UserYou'
    const is_user_them = user === 'UserThem'

    if (!is_user_you && !is_user_them) {
        throwError(`Unknown user '${user}'.`)
    }

    const inventory = getWindow()[user]['getInventory'](440, 2)['rgInventory']
    const filtered_items: any = []

    for (let asset_id in inventory) {
        const item = inventory[asset_id]
        const $item = item['element']
        const class_id = item['classid']

        const is_in_trade_slot = getWindow()['BIsInTradeSlot']($item)
        if (is_in_trade_slot) continue

        if (class_id === class_id_to_search) {
            filtered_items.push(item)
        }
    }

    return filtered_items
}