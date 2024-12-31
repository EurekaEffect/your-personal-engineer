import {alert, error, getWindow, log, throwError} from "./Main";
import {getRgItemByAssetId, getRgItems, getRgItemsByName, SetItemInTrade, SetItemsInTrade} from "./util/TradeOffer";

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
            intent,
            asset_id,
            item_name,
            item_data,
            amount,
            currencies
        } = json

        // Just a normal trade.
        if (!ype) return

        // Checking if the 'intent' parameter is missing.
        if (!intent || !item_data || !currencies) {
            const error = `Missing parameters: 'intent', 'item_data' or 'currencies'.`

            alert(error)
            throwError(error)
        }



        const rg_items_to_give: any = []
        const rg_items_to_receive: any = []

        if (intent === 'sell') {
            // Checking if the specified parameters are missing.
            if (!asset_id || !amount) {
                const error = `Missing parameters: 'asset_id' or 'amount'.`

                alert(error)
                throwError(error)
            }

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
                // Checking for craftable parameter.
                if ('craftable' in item_data) {
                    const craftable = item_data['craftable']

                    rg_items = rg_items.filter((rg_item: any) => {
                        if ('descriptions' in rg_item) {
                            const is_item_non_craftable = Object.values(rg_item['descriptions']).find((description: any) => {
                                return description['value'] === '( Not Usable in Crafting )'
                            })

                            if (craftable && !is_item_non_craftable) return true
                            if (!craftable && is_item_non_craftable) return true
                        }

                        return false
                    })
                }

                // Limiting to the necessary amount, including the item with asset_id in rg_items_to_receive.
                rg_items = rg_items.slice(0, (amount - rg_items_to_receive.length))

                // Adding to the items to receive array.
                rg_items_to_receive.push(...rg_items)

                if (rg_items_to_receive.length === 0) {
                    const error = `Item('s) has already been sold.`

                    alert(error)
                    throwError(error)
                }
            }

            // Handling your inventory.
            if (rg_items_to_give) {
                let half_scrap = Math.round(currencies['metal'] / 0.05555555555555555) // Converting metal to half-scrap for easier management.

                const items_found = rg_items_to_receive.length

                // Trying to pick item amount for our available currency.
                while (rg_items_to_receive.length > 0) {
                    // Adjusting the price to the item amount.
                    let precise_amount = rg_items_to_receive.length
                    let keys = currencies['keys'] * precise_amount
                    let metal = (half_scrap * precise_amount) / 18

                    const trade_result = getCurrenciesForTrade(intent, keys, metal)

                    if (trade_result['error_message'] === '') {
                        // Checking for the item amount.
                        const items_missing = amount - items_found
                        const items_adjusted = rg_items_to_receive.length

                        // Notifying the user if the items are missing.
                        if (items_missing > 0 && items_adjusted < items_found) {
                            alert(`${items_found} out of ${amount} items were found,\nand only ${items_adjusted} out of ${items_found} are adjusted to your available currency.\nAdding ${items_adjusted} items to the trade offer...`)
                        } else if (items_missing > 0) {
                            alert(`${items_found} out of ${amount} items were found,\nAdding ${items_adjusted} items to the trade offer...`)
                        } else if (items_adjusted < items_found) {
                            alert(`${items_adjusted} out of ${items_found} are adjusted to your available currency.\nAdding ${items_adjusted} items to the trade offer...`)
                        }

                        rg_items_to_give.push(...trade_result['rg_items_to_give'])
                        rg_items_to_receive.push(...trade_result['rg_items_to_receive'])

                        break
                    } else {
                        rg_items_to_receive.pop() // Removing the last element.

                        if (rg_items_to_receive.length === 0) {
                            alert(trade_result['error_message'])
                            throwError(trade_result['error_message'])
                        }
                    }
                }
            }
        } else {
            // Checking if the specified parameters are missing.
            if (!amount || !currencies) {
                const error = `Missing parameters: 'amount' or 'currencies'.`

                alert(error)
                throwError(error)
            }

            // Handling your inventory.
            if (rg_items_to_give) {
                // Checking if the 'item_name' parameter is missing.
                if (!item_name) {
                    const error = `Missing parameters: 'item_name'.`

                    alert(error)
                    throwError(error)
                }

                // Searching by item_name.
                let rg_items = getRgItemsByName('UserYou', item_name)

                // Checking for craftable parameter.
                if ('craftable' in item_data) {
                    const craftable = item_data['craftable']

                    rg_items = rg_items.filter((rg_item: any) => {
                        if ('descriptions' in rg_item) {
                            const is_item_non_craftable = Object.values(rg_item['descriptions']).find((description: any) => {
                                return description['value'] === '( Not Usable in Crafting )'
                            })

                            if (craftable && !is_item_non_craftable) return true
                            if (!craftable && is_item_non_craftable) return true
                        }

                        return false
                    })
                }

                // Limiting to the necessary amount, including the item with asset_id in rg_items_to_receive.
                rg_items = rg_items.slice(0, (amount - rg_items_to_give.length))

                // Adding to the items to give array.
                rg_items_to_give.push(...rg_items)

                if (rg_items_to_give.length === 0) {
                    const error = `Item('s) were not found.`

                    alert(error)
                    throwError(error)
                }
            }

            // Handling their inventory.
            if (rg_items_to_receive) {
                let half_scrap = Math.round(currencies['metal'] / 0.05555555555555555) // Converting metal to half-scrap for easier management.

                const items_found = rg_items_to_give.length

                // Trying to pick item amount for their available currency.
                while (rg_items_to_give.length > 0) {
                    // Adjusting the price to the item amount.
                    let precise_amount = rg_items_to_give.length
                    let keys = currencies['keys'] * precise_amount
                    let metal = (half_scrap * precise_amount) / 18

                    const trade_result = getCurrenciesForTrade(intent, keys, metal)

                    if (trade_result['error_message'] === '') {
                        // Checking for the item amount.
                        const items_missing = amount - items_found
                        const items_adjusted = rg_items_to_give.length

                        // Notifying the user if the items are missing.
                        if (items_missing > 0 && items_adjusted < items_found) {
                            alert(`${items_found} out of ${amount} items were found,\nand only ${items_adjusted} out of ${items_found} are adjusted to their available currency.\nAdding ${items_adjusted} items to the trade offer...`)
                        } else if (items_missing > 0) {
                            alert(`${items_found} out of ${amount} items were found,\nAdding ${items_adjusted} items to the trade offer...`)
                        } else if (items_adjusted < items_found) {
                            alert(`${items_adjusted} out of ${items_found} are adjusted to their available currency.\nAdding ${items_adjusted} items to the trade offer...`)
                        }

                        rg_items_to_give.push(...trade_result['rg_items_to_receive'])
                        rg_items_to_receive.push(...trade_result['rg_items_to_give'])

                        break
                    } else {
                        rg_items_to_give.pop() // Removing the last element.

                        if (rg_items_to_give.length === 0) {
                            alert(trade_result['error_message'])
                            throwError(trade_result['error_message'])
                        }
                    }
                }
            }
        }

        // Mapping to the asset ids.
        const your_asset_ids = rg_items_to_give.map((rg_item: any) => rg_item['id'])
        const their_asset_ids = rg_items_to_receive.map((rg_item: any) => rg_item['id'])

        // Adding items to the trade offer.
        // Ignoring 'await' to make it asynchronous.
        SetItemsInTrade(your_asset_ids)
        SetItemsInTrade(their_asset_ids)
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

function getCurrenciesForTrade(intent: string, keys: number, metal: number) {
    type TradeResult = {
        rg_items_to_give: any[],
        rg_items_to_receive: any[],
        error_message: string
    }

    const trade_result: TradeResult = {
        rg_items_to_give: [],
        rg_items_to_receive: [],
        error_message: ''
    }

    // Getting the currency types.
    const currency_types = getCurrencyTypes(keys, metal)

    if (intent === 'sell') {
        // @ts-ignore
        const [our_currency, change_1, error] = pickCurrency('UserYou', currency_types)

        if (Object.values(change_1).find((currency) => currency !== 0) || error) {
            // @ts-ignore
            const [their_currency, change_2, error] = pickCurrency('UserThem', change_1);

            if (Object.values(change_2).find((currency) => currency !== 0) || error) {
                trade_result['error_message'] = 'Could not balance currencies.'
                return trade_result
            }

            // Adding the items to receive.
            // @ts-ignore
            for (let currency of their_currency) {
                trade_result['rg_items_to_receive'].push(currency)
            }
        }

        // Adding the items to give.
        // @ts-ignore
        for (let currency of our_currency) {
            trade_result['rg_items_to_give'].push(currency)
        }
    } else {
        // @ts-ignore
        const [their_currency, change_1] = pickCurrency('UserThem', currency_types);

        if (Object.values(change_1).find((currency) => currency !== 0)) {
            // @ts-ignore
            const [our_currency, change_2] = pickCurrency('UserYou', change_1);

            if (Object.values(change_2).find((currency) => currency !== 0)) {
                trade_result['error_message'] = 'Could not balance currencies.'
                return trade_result
            }

            // Adding the items to give.
            for (let currency of our_currency) {
                trade_result['rg_items_to_give'].push(currency)
            }
        }

        // Adding the items to receive.
        for (let currency of their_currency) {
            trade_result['rg_items_to_receive'].push(currency)
        }
    }

    return trade_result
}

function getCurrencyTypes(keys: number, metal: number): CurrencyTypes {
    let half_scrap = Math.round(metal / 0.05555555555555555) // Converting metal to half-scrap for easier management.

    // TODO: round to .11.

    // Calculating the refined amount.
    let ref_amount = Math.floor(half_scrap / 18)
    half_scrap = half_scrap - (ref_amount * 18)

    // Calculating the reclaimed amount.
    let rec_amount = Math.floor(half_scrap / 6)
    half_scrap = half_scrap - (rec_amount * 6)

    // Calculating the scrap amount.
    let scrap_amount = Math.floor(half_scrap / 2)
    half_scrap = half_scrap - (scrap_amount * 2)

    // Calculating the missing half-scrap.
    // const total_half_scrap = Math.round(metal / 0.05555555555555555) // Converting metal to half-scrap for easier management.
    // half_scrap = 0
    // half_scrap = half_scrap + (ref_amount * 18)
    // half_scrap = half_scrap + (rec_amount * 6)
    // half_scrap = half_scrap + (scrap_amount * 2)
    // half_scrap = total_half_scrap - half_scrap // Getting the difference.

    return {
        key_amount: keys,
        refined_amount: ref_amount,
        reclaimed_amount: rec_amount,
        scrap_amount: scrap_amount
    }
}

type CurrencyTypes = {
    key_amount: number,
    refined_amount: number,
    reclaimed_amount: number,
    scrap_amount: number
}

// Thanks Brom127 for the function!
function pickCurrency(user: string, currency_types: CurrencyTypes) {
    const inventory = getRgItems(user)
    let {
        key_amount,
        refined_amount,
        reclaimed_amount,
        scrap_amount
    } = currency_types

    const rg_keys = inventory.filter((item: any) => item['name'] === 'Mann Co. Supply Crate Key')
    const rg_refined = inventory.filter((item: any) => item['name'] === 'Refined Metal')
    const rg_reclaimed = inventory.filter((item: any) => item['name'] === 'Reclaimed Metal')
    const rg_scrap = inventory.filter((item: any) => item['name'] === 'Scrap Metal')

    if (rg_keys.length < key_amount) return [[], [], 'Insufficient keys.']
    if (rg_refined.length + rg_reclaimed.length / 3 + rg_scrap.length / 9 < refined_amount + reclaimed_amount / 3 + scrap_amount / 9) return [[], [], 'Insufficient metal.']

    let leftover_ref = rg_refined.length - refined_amount;
    let leftover_rec = rg_reclaimed.length - reclaimed_amount;
    let leftover_scrap = rg_scrap.length - scrap_amount;
    let change: CurrencyTypes = {
        key_amount: 0,
        refined_amount: 0,
        reclaimed_amount: 0,
        scrap_amount: 0
    }

    // use rec if not enough scrap
    if (leftover_scrap < 0) {
        leftover_scrap = -leftover_scrap;
        reclaimed_amount += Math.ceil(leftover_scrap / 3);
        leftover_rec -= Math.ceil(leftover_scrap / 3);
        change['scrap_amount'] += 3 - (leftover_scrap % 3);
        change['scrap_amount'] %= 3;
        scrap_amount -= leftover_scrap;
        leftover_scrap = 0;
    }

    //use ref if not enough rec
    if (leftover_rec < 0) {
        leftover_rec = -leftover_rec;
        refined_amount += Math.ceil(leftover_rec / 3);
        leftover_ref -= Math.ceil(leftover_rec / 3);
        change['reclaimed_amount'] += 3 - (leftover_rec % 3);
        change['reclaimed_amount'] %= 3;
        reclaimed_amount -= leftover_rec;
        leftover_rec = 0;
    }

    //use rec if not enough ref
    while (leftover_ref < 0) {
        if (leftover_rec >= -leftover_ref * 3) {
            refined_amount -= -leftover_ref;
            reclaimed_amount += -leftover_ref * 3;
            leftover_rec -= -leftover_ref * 3;
            leftover_ref = 0;
        } else {
            return [[], [], 'Could not balance currencies.'];
        }
    }

    //calculate change needed from other inventory
    if (refined_amount != 0 && change['refined_amount'] != 0) {
        let reduce = Math.min(refined_amount, change['refined_amount']);
        refined_amount -= reduce;
        change['refined_amount'] -= reduce;
    }
    if (reclaimed_amount != 0 && change['reclaimed_amount'] != 0) {
        let reduce = Math.min(reclaimed_amount, change['reclaimed_amount']);
        reclaimed_amount -= reduce;
        change['reclaimed_amount'] -= reduce;
    }
    if (scrap_amount != 0 && change['scrap_amount'] != 0) {
        let reduce = Math.min(scrap_amount, change['scrap_amount']);
        scrap_amount -= reduce;
        change['scrap_amount'] -= reduce;
    }

    //start taking items from random position; possible ranges are between 0 and length-amount
    const key_start = Math.floor(Math.random() * (rg_keys.length - key_amount + 1));
    const ref_start = Math.floor(Math.random() * (rg_refined.length - refined_amount + 1));
    const rec_start = Math.floor(Math.random() * (rg_reclaimed.length - reclaimed_amount + 1));
    const scrap_start = Math.floor(Math.random() * (rg_scrap.length - scrap_amount + 1));

    //actually take the items
    const take_keys = rg_keys.slice(key_start, key_start + key_amount);
    const take_ref = rg_refined.slice(ref_start, ref_start + refined_amount);
    const take_rec = rg_reclaimed.slice(rec_start, rec_start + reclaimed_amount);
    const take_scrap = rg_scrap.slice(scrap_start, scrap_start + scrap_amount);
    let items = take_keys;
    items = items.concat(take_ref);
    items = items.concat(take_rec);
    items = items.concat(take_scrap);

    //checks if anything went wrong. This should never happen but lets check anyways.
    if (
        key_amount < 0 ||
        refined_amount < 0 ||
        reclaimed_amount < 0 ||
        scrap_amount < 0 ||
        change.refined_amount < 0 ||
        change.reclaimed_amount < 0 ||
        change.scrap_amount < 0 ||
        key_start < 0 ||
        ref_start < 0 ||
        rec_start < 0 ||
        scrap_start < 0 ||
        key_amount == undefined ||
        refined_amount == undefined ||
        reclaimed_amount == undefined ||
        scrap_amount == undefined ||
        key_amount > rg_keys.length ||
        refined_amount > rg_refined.length ||
        reclaimed_amount > rg_reclaimed.length ||
        scrap_amount > rg_scrap.length ||
        items.length < key_amount ||
        take_keys.length != key_amount ||
        take_ref.length != refined_amount ||
        take_rec.length != reclaimed_amount ||
        take_scrap.length != scrap_amount
    ) {
        console.log("Something went wrong balancing currencies:");
        console.log(
            [
                rg_keys.length,
                rg_refined.length,
                rg_reclaimed.length,
                rg_scrap.length,
                key_amount,
                refined_amount,
                reclaimed_amount,
                scrap_amount,
                key_start,
                ref_start,
                rec_start,
                scrap_start,
                take_keys,
                take_ref,
                take_rec,
                take_scrap,
                JSON.stringify(items, undefined, 4),
            ].join("\n")
        );

        return [[], [], 'Could not balance currencies.']
    }

    return [items, change];
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
            ?.addEventListener('click', async () => {
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

                    const button = this.get()?.querySelector('#add-currency')

                    button?.classList.add('disabled')
                    await SetItemsInTrade(asset_ids_to_add) // Adding items to the trade offer.
                    button?.classList.remove('disabled')

                    this.updateCurrencies(current_user) // Have to update it manually.
                }
            })
    }

    get() {
        return document.querySelector('#currency-panel')
    }

    setKeys(keys: number) {
        this.get()!.querySelector('#keys')!['value'] = keys
    }

    setMetal(metal: number) {
        this.get()!.querySelector('#metal')!['value'] = metal
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