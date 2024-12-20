import {alert, error, getWindow, log, throwError} from "./Main";
import {getRgItemByAssetId, getRgItemsByName, SetItemInTrade, SetItemsInTrade} from "./util/TradeOffer";

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

const CURRENCY_CLASS_IDS = {
    MANN_CO_SUPPLY_CRATE_KEY: '101785959',
    REFINED_METAL: '2674',
    RECLAIMED_METAL: '5564',
    SCRAP_METAL: '2675'
}

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

        // Just a normal trade.
        if (!ype) return

        // Checking if the 'intent' parameter is missing.
        if (!intent) {
            const error = `Missing parameters: 'intent'.`

            alert(error)
            throwError(error)
        }

        if (intent === 'sell') {
            // Checking if the specified parameters are missing.
            if (!asset_id || !amount || !currencies) {
                const error = `Missing parameters: 'asset_id', 'amount' or 'currencies'.`

                alert(error)
                throwError(error)
            }

            // Searching by asset_id.
            const rg_items_to_give: any = []
            const rg_items_to_receive: any = []

            // Handling their inventory.
            if (rg_items_to_receive) {
                const rg_item = getRgItemByAssetId('UserThem', asset_id)

                if (rg_item) {
                    rg_items_to_receive.push(rg_item) // Adding the item if presents.
                }

                // Checking if the 'item_name' parameter is missing.
                if (!item_name) {
                    const error = `Missing parameters: 'item_name'.`

                    alert(error)
                    throwError(error)
                }

                // Searching by item_name.
                let rg_items = getRgItemsByName('UserThem', item_name)
                // Removing the item with asset_id if presents.
                if (rg_item) rg_items = rg_items.filter((rg_item: any) => rg_item['id'] != asset_id)
                // Limiting to the necessary amount, including the item with asset_id in rg_items_to_receive.
                rg_items = rg_items.slice(0, (amount - rg_items_to_receive.length))

                // Adding to the items to receive array.
                rg_items_to_receive.push(...rg_items)
            }

            // Handling your inventory.
            if (rg_items_to_give) {
                const your_currencies = currency_panel.items.getCurrenciesInInventory('UserYou')
                const their_currencies = currency_panel.items.getCurrenciesInInventory('UserThem')

                const balance = balanceCurrencies(your_currencies, their_currencies, currencies['keys'] * amount, (Math.round(currencies['metal'] / 0.05555555555555555) * amount) / 18)

                if (balance['balanced']) {
                    // FIXME crying emoji
                    const your = balance['your_currency_types']
                    const their = balance['their_currency_types']

                    let keys = your_currencies['key'].slice(0, your['key_amount'])
                    let ref = your_currencies['ref'].slice(0, your['refined_amount'])
                    let rec = your_currencies['rec'].slice(0, your['reclaimed_amount'])
                    let scrap = your_currencies['scrap'].slice(0, your['scrap_amount'])
                    rg_items_to_give.push(...[...keys, ...ref, ...rec, ...scrap])

                    keys = their_currencies['key'].slice(0, their['key_amount'])
                    ref = their_currencies['ref'].slice(0, their['refined_amount'])
                    rec = their_currencies['rec'].slice(0, their['reclaimed_amount'])
                    scrap = their_currencies['scrap'].slice(0, their['scrap_amount'])
                    const their_items_to_add = their['key_amount'] + their['refined_amount'] + their['reclaimed_amount'] + their['scrap_amount']

                    if (their_items_to_add > 0) {
                        rg_items_to_receive.push(...[...keys, ...ref, ...rec, ...scrap])
                    }
                } else {
                    alert('bruh not balanced')
                }
            }

            // Mapping to the asset ids.
            const your_asset_ids = rg_items_to_give.map((rg_item: any) => rg_item['id'])
            const their_asset_ids = rg_items_to_receive.map((rg_item: any) => rg_item['id'])

            // Adding items to the trade offer.
            await SetItemsInTrade(your_asset_ids)
            await SetItemsInTrade(their_asset_ids)
        } else {
            alert('buy, not implemented.')
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

function balanceCurrencies(your_currencies: Currencies, their_currencies: Currencies, keys_to_pay: number, metal_to_pay: number) {
    type CurrencyTypeReport = {
        key_amount: number,
        refined_amount: number,
        reclaimed_amount: number,
        scrap_amount: number,
        missing_half_scrap: number // If > 0, then missing metal.
    }

    function getCurrencyTypes(currencies: Currencies, keys_to_pay: number, metal_to_pay: number): CurrencyTypeReport {
        let half_scrap = Math.round(metal_to_pay / 0.05555555555555555) // Converting metal to half-scrap for easier management.

        // TODO: round to .11.

        // Calculating the refined amount.
        let ref_amount = Math.floor(half_scrap / 18)
        ref_amount = Math.min(currencies['ref'].length, ref_amount)
        half_scrap = half_scrap - (ref_amount * 18)

        // Calculating the reclaimed amount.
        let rec_amount = Math.floor(half_scrap / 6)
        rec_amount = Math.min(currencies['rec'].length, rec_amount)
        half_scrap = half_scrap - (rec_amount * 6)

        // Calculating the scrap amount.
        let scrap_amount = Math.floor(half_scrap / 2)
        scrap_amount = Math.min(currencies['scrap'].length, scrap_amount)
        half_scrap = half_scrap - (scrap_amount * 2)

        return {
            key_amount: keys_to_pay,
            refined_amount: ref_amount,
            reclaimed_amount: rec_amount,
            scrap_amount: scrap_amount,
            missing_half_scrap: half_scrap
        }
    }

    const your_currency_types = getCurrencyTypes(your_currencies, keys_to_pay, metal_to_pay)
    const their_currency_types = getCurrencyTypes(their_currencies, 0, 0)

    if (your_currency_types['missing_half_scrap'] > 0) {
        const your_missing_half_scrap = your_currency_types['missing_half_scrap']

        if (your_missing_half_scrap < 18) {
            let missing_half_scrap = (18 - your_missing_half_scrap)
            console.log('missing hs ' + missing_half_scrap)

            const their_currencies_to_check = [{
                currencies: their_currencies['rec'],
                name: 'reclaimed_amount',
                metal: 0.33
            }, {
                currencies: their_currencies['scrap'],
                name: 'scrap_amount',
                metal: 0.11
            }]

            for (let currency_to_check of their_currencies_to_check) {
                for (const unused of currency_to_check['currencies']) {
                    let currency_half_scrap = Math.round(currency_to_check['metal'] / 0.05555555555555555) // Converting metal to half-scrap for easier management.
                    const future_missing_half_scrap = missing_half_scrap - currency_half_scrap

                    if (future_missing_half_scrap >= 0) {
                        missing_half_scrap = future_missing_half_scrap;
                        their_currency_types[currency_to_check['name']]++

                        if (missing_half_scrap === 0) break
                    }
                }
            }

            if (missing_half_scrap === 0) {
                const unused_refined_metal_amount = your_currencies['ref'].length - your_currency_types['refined_amount']

                if (unused_refined_metal_amount > 0) {
                    your_currency_types['refined_amount']++

                    return {
                        your_currency_types: your_currency_types,
                        their_currency_types: their_currency_types,
                        balanced: true
                    }
                } else {
                    // Can't balance.
                    return {
                        your_currency_types: [],
                        their_currency_types: [],
                        balanced: false
                    }
                }
            } else {
                // Can't balance.
                return {
                    your_currency_types: [],
                    their_currency_types: [],
                    balanced: false
                }
            }
        } else {
            // Can't balance.
            return {
                your_currency_types: [],
                their_currency_types: [],
                balanced: false
            }
        }
    } else {
        return {
            your_currency_types: your_currency_types,
            their_currency_types: [], // Currency to add, if your_currency_types['missing_half_scrap'] is 0 then there's no need to add their currency.
            balanced: true
        }
    }
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

    getItems() {
        return this.items
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