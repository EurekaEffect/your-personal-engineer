import {alert, error, getWindow, log, throwError} from "./Main";
import {SearchItemByName, SetItemInTrade, SetItemsInTrade} from "./util/TradeOffer";

const CURRENCY_PANEL = `<div id="currency-panel" class="your_items">
    <div class="trade_box_bgheader active"></div>
    <div class="trade_box_contents" style="background: #1D1D1D">
        <div class="tutorial_arrow_ctn" style="display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: space-around; align-items: stretch; align-content: stretch;">
            <div style="position: relative; text-align: center; color: white"><img src="https://community.cloudflare.steamstatic.com/economy/image/fWFc82js0fmoRAP-qOIPu5THSWqfSmTELLqcUywGkijVjZULUrsm1j-9xgEAaR4uURrwvz0N252yVaDVWrRTno9m4ccG2GNqxlQoZrC2aG9hcVGUWflbX_drrVu5UGki5sAij6tOtQ/96fx96f"><div id="key-count" style="position: absolute; bottom: 10px; right: 10px">0x</div></div>
            <div style="position: relative; text-align: center; color: white"><img src="https://community.cloudflare.steamstatic.com/economy/image/fWFc82js0fmoRAP-qOIPu5THSWqfSmTELLqcUywGkijVjZULUrsm1j-9xgEbZQsUYhTkhzJWhsO1Mv6NGucF1Ygzt8ZQijJukFMiMrbhYDEwI1yRVKNfD6xorQ3qW3Jr6546DNPuou9IOVK4p4kWJaA/96fx96f"><div id="ref-count" style="position: absolute; bottom: 10px; right: 10px">0x</div></div>
            <div style="position: relative; text-align: center; color: white"><img src="https://community.cloudflare.steamstatic.com/economy/image/fWFc82js0fmoRAP-qOIPu5THSWqfSmTELLqcUywGkijVjZULUrsm1j-9xgEbZQsUYhTkhzJWhsO0Mv6NGucF1YJlscMEgDdvxVYsMLPkMmFjI1OSUvMHDPBp9lu0CnVluZQxA9Gwp-hIOVK4sMMNWF4/96fx96f"><div id="rec-count" style="position: absolute; bottom: 10px; right: 10px">0x</div></div>
            <div style="position: relative; text-align: center; color: white"><img src="https://community.cloudflare.steamstatic.com/economy/image/fWFc82js0fmoRAP-qOIPu5THSWqfSmTELLqcUywGkijVjZULUrsm1j-9xgEbZQsUYhTkhzJWhsPZAfOeD-VOn4phtsdQ32ZtxFYoN7PkYmVmIgeaUKNaX_Rjpwy8UHMz6pcxAIfnovUWJ1t9nYFqYw/96fx96f"><div id="scrap-count" style="position: absolute; bottom: 10px; right: 10px">0x</div></div>
        </div>
        <div style="display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: space-around; align-items: stretch; align-content: stretch;" class="tutorial_arrow_ctn">
            <input id="keys" placeholder="Keys" class="filter_search_box">
            <input id="metal" placeholder="Metal" class="filter_search_box">
            <a id="add-currency" class="pagecontrol_element pagebtn">Add</a>
        </div>
    </div>
</div>`

export function isTradeOfferUrl(url: string) {
    return /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=.+$/.test(url)
}

export async function main() {
    const currency_panel = new CurrencyPanel()

    // Listening for the item interactions.
    listenForInteractions()

    // Loading inventories.
    loadInventory('UserYou')
    loadInventory('UserThem')

    // Events.
    window.addEventListener('inventory_load_complete', (event) => {
        const user = event['detail']['user']
        const is_user_you = user === 'UserYou'
        const is_user_them = user === 'UserThem'
        const inventory = event['detail']['inventory']['rgInventory']

        const params = new URLSearchParams(location.search)
        const asset_id = params.get('ype.asset_id') // ID of the item.
        const item_name = params.get('ype.item_name') // In case when the item is sold but the item is liquid like a key.

        log('Main.inventory_load_complete', `${user} inventory was loaded.`)

        if (is_user_you) {
            // Initial load.
            currency_panel.updateCurrencies(user)
        }

        if (is_user_them) {
            if (asset_id) {
                try {
                    log('Main.inventory_load_complete', `Adding an item with id '${asset_id}' to the trade offer.`)
                    SetItemInTrade(asset_id)
                } catch (error) {
                    // Item is not found, searching another one by name.
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
                        const error_message = `Cannot find an item with id '${asset_id}', 'ype.item_name' is not presents.`

                        alert(error_message)
                        throwError(error_message)
                    }
                }
            }
        }
    })

    window.addEventListener('item_interaction', (event) => {
        const user = event['detail']['user']
        const item = event['detail']['item']

        currency_panel.updateCurrencies(user)
    })

    window.addEventListener('inventory_selected', (event) => {
        const user = event['detail']['user']

        currency_panel.updateCurrencies(user)
    })
}

function listenForInteractions() {
    function modifyItemInteractionFunction(function_name: string, item_interaction_type: string) {
        let prev_function = getWindow()['CTradeOfferStateManager'][function_name]

        function modifiedFunction(item: any, appid: number, contextid: number) {
            getWindow()['CTradeOfferStateManager'][function_name] = prev_function
            getWindow()['CTradeOfferStateManager'][function_name](item, appid, contextid)
            prev_function = getWindow()['CTradeOfferStateManager'][function_name]
            getWindow()['CTradeOfferStateManager'][function_name] = modifiedFunction

            const event = new CustomEvent('item_interaction', {
                detail: {
                    user: item['is_their_item'] ? 'UserThem' : 'UserYou',
                    item: item,
                    type: item_interaction_type
                }
            })
            window.dispatchEvent(event)
        }

        getWindow()['CTradeOfferStateManager'][function_name] = modifiedFunction
    }

    function modifySelectButton(button_id: string, user: string) {
        const $inventory = document.querySelector(`#${button_id}`)

        $inventory?.addEventListener('click', () => {
            getWindow()['SelectInventoryFromUser'](getWindow()[user], 440, 2, false)

            const is_user_them = getWindow()[user] === getWindow()['UserThem']

            const event = new CustomEvent('inventory_selected', {
                detail: {
                    user: is_user_them ? 'UserThem' : 'UserYou',
                }
            })
            window.dispatchEvent(event)
        })
    }

    // Item added event.
    modifyItemInteractionFunction('SetItemInTrade', 'added')
    modifyItemInteractionFunction('RemoveItemFromTrade', 'removed')

    // Modifying onclick function to track when the user is switching inventories.
    modifySelectButton('inventory_select_your_inventory', 'UserYou')
    modifySelectButton('inventory_select_their_inventory', 'UserThem')
}

function loadInventory(user: string) {
    const is_user_you = user === 'UserYou'
    const is_user_them = user === 'UserThem'

    if (!is_user_you && !is_user_them) {
        return error('[YPE, Main.loadInventory]', `Unknown user '${user}'.`)
    }

    if (is_user_them) {
        getWindow()[user]['loadInventory'](440, 2) // Loading their inventory element.
    }

    const prev_OnLoadInventoryComplete = getWindow()[user]['OnLoadInventoryComplete']
    getWindow()[user]['OnLoadInventoryComplete'] = function (transport: any, appid: any, contextid: any) {
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

class CurrencyPanel {
    items = new Items()

    constructor() {
        // Searching for the trade_right element and adding the currency panel.
        const $trade_right = document.querySelector('.trade_right.selectableNone')
        $trade_right?.insertAdjacentHTML('afterbegin', CURRENCY_PANEL)

        this.get()
            ?.querySelector('#add-currency')
            ?.addEventListener('click', () => {
                const $keys = document.querySelector('#keys')
                const $metal = document.querySelector('#metal')

                if (!$keys || !$metal) {
                    return throwError(`Cannot find 'keys' or 'metal' element.`)
                }

                const keys = $keys['value'] ? parseInt($keys['value']) : 0;
                const metal = $metal['value'] ? parseInt($metal['value']) : 0; // TODO: make it float.

                if (isNaN(keys) || isNaN(metal)) {
                    alert(`Only numbers are allowed in 'keys' and 'metal' textboxes.`);
                    return throwError(`Only numbers are allowed in 'keys' and 'metal' textboxes.`);
                }

                if (keys < 0 || metal < 0) {
                    alert(`Only non-negative numbers are allowed in 'keys' and 'metal' textboxes.`);
                    return throwError(`Only non-negative numbers are allowed in 'keys' and 'metal' textboxes.`);
                }

                const is_user_them = getWindow()['g_ActiveUser'] === getWindow()['UserThem']
                const current_user = is_user_them ? 'UserThem' : 'UserYou'

                const currencies = this.items.getCurrenciesInInventory(current_user)

                const keys_to_add = currencies['key'].slice(0, keys)
                const metal_to_add = currencies['ref'].slice(0, metal)

                const asset_ids_to_add = [
                    ...keys_to_add.map((item) => item['id']),
                    ...metal_to_add.map((item) => item['id'])
                ]

                SetItemsInTrade(asset_ids_to_add)

                // This shouldn't be here, but I need this.
                this.updateCurrencies(current_user)
            })
    }

    get() {
        return document.querySelector('#currency-panel')
    }

    updateCurrencies(user: string) {
        const currencies = this.items.getCurrenciesInInventory(user)

        this.updateCurrency('key-count', currencies['key'].length)
        this.updateCurrency('ref-count', currencies['ref'].length)
        this.updateCurrency('rec-count', currencies['rec'].length)
        this.updateCurrency('scrap-count', currencies['scrap'].length)
    }

    updateCurrency(item_id: string, count: number) {
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
}

type Currencies = {
    key: any[],
    ref: any[],
    rec: any[],
    scrap: any[]
}

class Items {
    class_ids = {
        key: '101785959',
        ref: '2674',
        rec: '5564',
        scrap: '2675'
    }

    getCurrenciesInInventory(user: string): Currencies {
        return {
            key: this.getItemsByClassId(user, this.class_ids['key']),
            ref: this.getItemsByClassId(user, this.class_ids['ref']),
            rec: this.getItemsByClassId(user, this.class_ids['rec']),
            scrap: this.getItemsByClassId(user, this.class_ids['scrap']),
        }
    }

    getItemsByClassId(user: string, class_id_to_search: string) {
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

            const is_in_trade_slot = getWindow()['BIsInTradeSlot']($item)
            if (is_in_trade_slot) continue

            const class_id = item['classid']

            if (class_id === class_id_to_search) {
                filtered_items.push(item)
            }
        }

        return filtered_items
    }
}