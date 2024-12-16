import {alert, error, getWindow, log, throwError} from "./Main";
import {SearchItemsByName, SetItemInTrade, SetItemsInTrade} from "./util/TradeOffer";

const CURRENCY_PANEL = `<div id="currency-panel" class="your_items">
    <div class="trade_box_bgheader active"></div>
    <div class="trade_box_contents" style="background: #1D1D1D">
        <div id="warning-text" class="tutorial_arrow_ctn" style="text-align: center; color: #d83636"></div>
        <div class="tutorial_arrow_ctn" style="display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: space-around; align-items: stretch; align-content: stretch;">
            <div style="position: relative; text-align: center; color: white"><img src="https://community.cloudflare.steamstatic.com/economy/image/fWFc82js0fmoRAP-qOIPu5THSWqfSmTELLqcUywGkijVjZULUrsm1j-9xgEAaR4uURrwvz0N252yVaDVWrRTno9m4ccG2GNqxlQoZrC2aG9hcVGUWflbX_drrVu5UGki5sAij6tOtQ/96fx96f"><div id="key-count" style="position: absolute; bottom: 10px; right: 10px">0x</div></div>
            <div style="position: relative; text-align: center; color: white"><img src="https://community.cloudflare.steamstatic.com/economy/image/fWFc82js0fmoRAP-qOIPu5THSWqfSmTELLqcUywGkijVjZULUrsm1j-9xgEbZQsUYhTkhzJWhsO1Mv6NGucF1Ygzt8ZQijJukFMiMrbhYDEwI1yRVKNfD6xorQ3qW3Jr6546DNPuou9IOVK4p4kWJaA/96fx96f"><div id="ref-count" style="position: absolute; bottom: 10px; right: 10px">0x</div></div>
            <div style="position: relative; text-align: center; color: white"><img src="https://community.cloudflare.steamstatic.com/economy/image/fWFc82js0fmoRAP-qOIPu5THSWqfSmTELLqcUywGkijVjZULUrsm1j-9xgEbZQsUYhTkhzJWhsO0Mv6NGucF1YJlscMEgDdvxVYsMLPkMmFjI1OSUvMHDPBp9lu0CnVluZQxA9Gwp-hIOVK4sMMNWF4/96fx96f"><div id="rec-count" style="position: absolute; bottom: 10px; right: 10px">0x</div></div>
            <div style="position: relative; text-align: center; color: white"><img src="https://community.cloudflare.steamstatic.com/economy/image/fWFc82js0fmoRAP-qOIPu5THSWqfSmTELLqcUywGkijVjZULUrsm1j-9xgEbZQsUYhTkhzJWhsPZAfOeD-VOn4phtsdQ32ZtxFYoN7PkYmVmIgeaUKNaX_Rjpwy8UHMz6pcxAIfnovUWJ1t9nYFqYw/96fx96f"><div id="scrap-count" style="position: absolute; bottom: 10px; right: 10px">0x</div></div>
        </div>
        <div style="display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: space-around; align-items: stretch; align-content: stretch;" class="tutorial_arrow_ctn">
            <input id="keys" placeholder="Keys" class="filter_search_box" type="number">
            <input id="metal" placeholder="Metal" class="filter_search_box" type="number">
            <a id="add-currency" class="pagecontrol_element pagebtn">Add</a>
        </div>
    </div>
</div>`

let is_your_inventory_loaded = false
let is_their_inventory_loaded = false

export function isTradeOfferUrl(url: string) {
    return /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=.+$/.test(url)
}

export async function mainTradeOffer() {
    const currency_panel = new CurrencyPanel()

    // Listening for the item interactions.
    listenForInteractions()

    // Loading inventories.
    loadInventory('UserYou')
    loadInventory('UserThem')

    // Events.
    window.addEventListener('inventory_load_complete', async (event) => {
        const user = event['detail']['user']
        const is_user_you = user === 'UserYou'
        const is_user_them = user === 'UserThem'

        log('Main.inventory_load_complete', `${user} inventory was loaded.`)

        // Handling 'UserYou' inventory.
        if (is_user_you) {
            is_your_inventory_loaded = true // Marking as loaded.
            currency_panel.updateCurrencies(user) // Updating the currency count.
        }

        // Handling 'UserThem' inventory.
        if (is_user_them) {
            is_their_inventory_loaded = true // Marking as loaded.
        }

        if (is_your_inventory_loaded && is_their_inventory_loaded) {
            // Dispatching the 'both_inventories_loaded' event.
            const event = new CustomEvent('both_inventories_loaded')
            window.dispatchEvent(event)
        }
    })

    window.addEventListener('both_inventories_loaded', async () => {
        const params = new URLSearchParams(location.search)
        const ype = params.get('ype')
        const json = ype ? JSON.parse(ype) : {}

        let {
            asset_id,
            item_name,
            intent,
            amount,
            currencies
        } = json

        // TODO: redo, make a plan how to make it better.

        let asset_id_item_found: boolean

        if (!asset_id) {
            log('Main.inventory_load_complete', `'asset_id' parameter not present.`)
            asset_id_item_found = false
        } else {
            log('Main.inventory_load_complete', `Searching for the item(${asset_id}).`)

            try {
                await SetItemInTrade(asset_id) // If item with asset_id cannot be found, then SetItemInTrade will throw an error.

                log('Main.inventory_load_complete', `Item(${asset_id}) was found and added.`)
                asset_id_item_found = true
            } catch (fail) {
                log('Main.inventory_load_complete', `Item(${asset_id}) not found.`)
                asset_id_item_found = false
            }
        }

        // Decreasing by one if the item with 'asset_id' was already added.
        let amount_to_add = asset_id_item_found ? (amount - 1) : amount

        // If the 'item_name' is present and 'amount_to_add' is higher than 0,
        // then searching for the items with exact name and adding the needed amount to the trade.

        if (!item_name) {
            log('Main.inventory_load_complete', `'item_name' parameter not present.`)
        } else {
            if (amount_to_add <= 0) {
                log('Main.inventory_load_complete', `The amount_to_add is 0.`)
            } else {
                log('Main.inventory_load_complete', `Searching for '${amount_to_add}' items with name '${item_name}'.`)

                let exact_items_by_name = SearchItemsByName('UserThem', item_name)
                exact_items_by_name = exact_items_by_name.slice(0, amount_to_add)

                await SetItemsInTrade(exact_items_by_name)
            }
        }

        if (!currencies) {
            return error('Main.inventory_load_complete', `'currency' parameter not present.`)
        }

        // Getting the amount of their items that was added by the script,
        // then multiplying the currencies by the item amount to get the final price.
        const amount_of_their_items = getWindow()['g_rgCurrentTradeStatus']['them']['assets'].length

        // Checking if the item amount is higher than 0, otherwice tell the user about it.
        if (amount_of_their_items > 0) {
            let keys = currencies['keys']
            let metal = currencies['metal']

            let half_scrap = Math.round(metal / 0.05555555555555555) // Converting metal to half scrap for easier management.
            half_scrap = (half_scrap * amount_of_their_items)

            keys = keys * amount_of_their_items
            metal = Math.floor((half_scrap / 18) * 100) / 100 // Converting half scrap to metal and rounding from 0.33333333333 to 0.33.

            // Updating the panel and clicking on the #add-currency button to add currency.
            currency_panel.updateCurrencyPanelInfoAndClick(keys, metal)

            // Checking if the amount of their items equals the needed amount,
            // and letting the user know if its not equal.
            if (String(amount_of_their_items) !== String(amount)) {
                alert(`I found only '${amount_of_their_items}' items in your partner's inventory instead of the expected '${amount}'.`)
            }
        } else {
            alert(`Your partner's side doesn't have any items.`)
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

        // Setting up the .onclick event.
        this.get()
            ?.querySelector('#add-currency')
            ?.addEventListener('click', () => {
                const $keys = document.querySelector('#keys')
                const $metal = document.querySelector('#metal')

                if (!$keys || !$metal) {
                    return throwError(`Cannot find 'keys' or 'metal' element.`)
                }

                const keys = $keys['value'] ? parseInt($keys['value']) : 0
                let metal = $metal['value'] ? parseFloat($metal['value']) : 0

                if (isNaN(keys) || isNaN(metal)) {
                    alert(`Only numbers are allowed in 'keys' and 'metal' textboxes.`)
                    return throwError(`Only numbers are allowed in 'keys' and 'metal' textboxes.`)
                }

                if (keys < 0 || metal < 0) {
                    alert(`Only non-negative numbers are allowed in 'keys' and 'metal' textboxes.`)
                    return throwError(`Only non-negative numbers are allowed in 'keys' and 'metal' textboxes.`)
                }

                const is_user_them = getWindow()['g_ActiveUser'] === getWindow()['UserThem']
                const current_user = is_user_them ? 'UserThem' : 'UserYou'

                const currencies = this.items.getCurrenciesInInventory(current_user)
                let half_scrap = Math.round(metal / 0.05555555555555555) // Converting metal to half scrap for easier management.

                // Calculatung the refined amount.
                let ref_amount = Math.floor(half_scrap / 18)
                ref_amount = Math.min(currencies['ref'].length, ref_amount)
                half_scrap = half_scrap - (ref_amount * 18)

                // Calculatung the reclaimed amount.
                let rec_amount = Math.floor(half_scrap / 6)
                rec_amount = Math.min(currencies['rec'].length, rec_amount)
                half_scrap = half_scrap - (rec_amount * 6)

                // Calculatung the scrap amount.
                let scrap_amount = Math.floor(half_scrap / 2)
                scrap_amount = Math.min(currencies['scrap'].length, scrap_amount)
                half_scrap = half_scrap - (scrap_amount * 2)

                const missing_keys = keys > currencies['key'].length
                const missing_metal = half_scrap > 0

                if (missing_keys || missing_metal) {
                    const missing_keys = keys === 0 ? 0 : keys - currencies['key'].length
                    const missing_metal = Math.floor((half_scrap / 18) * 100) / 100

                    // Showing a warning.
                    if (missing_keys && missing_metal) {
                        this.showWarning(`You are missing ${missing_keys} keys ${missing_metal} metal.`)
                    } else if (missing_keys) {
                        this.showWarning(`You are missing ${missing_keys} keys.`)
                    } else {
                        this.showWarning(`You are missing ${missing_metal} metal.`)
                    }
                } else {
                    this.hideWarning()

                    const asset_ids_to_add = [
                        ...currencies['key'].slice(0, keys),
                        ...currencies['ref'].slice(0, ref_amount),
                        ...currencies['rec'].slice(0, rec_amount),
                        ...currencies['scrap'].slice(0, scrap_amount)
                    ].map((item) => item['id'])

                    SetItemsInTrade(asset_ids_to_add) // Adding items to the trade offer.
                    this.updateCurrencies(current_user) // Have to update it manually.
                }
            })
    }

    get() {
        return document.querySelector('#currency-panel')
    }

    showWarning(message: string) {
        const $warning_text = document.querySelector('#warning-text')
        $warning_text!.textContent = message
    }

    hideWarning() {
        const $warning_text = document.querySelector('#warning-text')
        $warning_text!.textContent = ''
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
            const parent_node = item_count.parentNode
            parent_node!['style']['opacity'] = (count > 0) ? '100%' : '40%'

            item_count.textContent = `${count}x`
        } else {
            throwError(`Element '${item_id}' was not found.`)
        }
    }

    updateCurrencyPanelInfoAndClick(keys: number, metal: number) {
        const $keys = document.querySelector('#keys')
        const $metal = document.querySelector('#metal')
        const $add_currency = document.querySelector('#add-currency')

        $keys!['value'] = keys
        $metal!['value'] = metal
        $add_currency!['click']()
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