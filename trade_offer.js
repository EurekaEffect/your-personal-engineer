function addItemToTradeOffer(asset_id) {
    const your_side = window['g_rgCurrentTradeStatus']['me']['assets']
    const their_side = window['g_rgCurrentTradeStatus']['them']['assets']

    asset_id = String(asset_id) // asset_id's should be treated as string.

    const $item = document.querySelector(`#item440_2_${asset_id}`)

    if ($item) {
        const item = $item['rgItem']
        const is_their_item = item['is_their_item']
        const side = (is_their_item ? their_side : your_side)

        const is_in_trade = side.find((item) => item['assetid'] === asset_id)

        if (is_in_trade) {
            error(`Item with asset_id '${asset_id}' is already in a trade offer.`)
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
        error(`Item with asset_id '${asset_id}' was not found.`)
    }
}

function removeItemFromTradeOffer(asset_id) {
    const $item = document.querySelector(`#item440_2_${asset_id}`)

    if ($item) {
        const item = $item['rgItem']

        if (window['BIsInTradeSlot'](item)) {
            window['GTradeStateManager']['RemoveItemFromTrade'](item)
        } else {
            error(`Item with asset_id '${asset_id}' is not in a trade slot.`)
        }
    } else {
        error(`Item with asset_id '${asset_id}' was not found.`)
    }
}

function updateRenderingItems() {
    window['RefreshTradeStatus'](window['g_rgCurrentTradeStatus'])
}

async function getTheirInventory() {
    const them = window['UserThem']

    function preloadTheirInventoryElements() {
        const inventory = them['getInventory'](440, 2)
        const $inventory = inventory['elInventory']

        inventory['Initialize']()
        inventory['MakeActive']()

        $inventory.style.display = 'none' // Hiding their inventory to prevent overlapping.
    }

    return await new Promise(async (resolve, reject) => {
        const tf2_inventory_presents = them['rgContexts'][440]

        if (!tf2_inventory_presents) {
            error(`tf2_inventory_not_present`)
            resolve([])
            return
        }

        preloadTheirInventoryElements()

        const timeout = setTimeout(() => {
            error(`Can't load the inventory.`)
            resolve([])
        }, 15_000)

        while (true) {
            const inventory = them['getInventory'](440, 2)

            if (inventory['rgInventory']) {
                clearTimeout(timeout)
                resolve(inventory)
                break
            } else {
                await new Promise((resolve, reject) => setTimeout(resolve, 1))
            }
        }
    })
}