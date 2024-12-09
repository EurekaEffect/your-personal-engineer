// I'm going to redo everything I did before using TypeScript to make the code more readable.
// TS will compile every .ts file into a JS bundle (ype.bundle.user.js).
// I will use it because I don't know how to divide a one single JS file into multiple files and make it work in TamperMonkey.
// BTW even if I knew I'd use TS since it's way cooler than JS :sunglasses:.

import {addItemToTradeOffer, isTradeOfferUrl, refreshTradeStatus} from "./TradeOffer";
import {awaitDocumentReady, executeConsoleScript, waitForChanges, waitForElementToBeAdded} from "./DocumentUtil";

(async function () {
    await awaitDocumentReady()

    if (isTradeOfferUrl(location.href)) {
        const params = new URLSearchParams(location.search)

        const asset_id = params.get('ype.asset_id')
        if (!asset_id) return

        setTimeout(async () => {
            async function yourScript() {
                // @ts-ignore
                const inventory = UserYou.getInventory(440, 2)

                inventory.Initialize()
                inventory.MakeActive()
            }
            async function theirScript() {
                // @ts-ignore
                const inventory = UserThem.getInventory(440, 2)
                const $inventory = inventory.elInventory

                inventory.Initialize()
                inventory.MakeActive()

                $inventory.style.display = 'none'
            }

            // First execution adds the partner's inventory.
            executeConsoleScript(theirScript).then(async () => {
                const user_id_64 = getWindow()['UserThem']['GetSteamId']()
                const id = `#inventory_${user_id_64}_440_2`

                await waitForElementToBeAdded(id)

                waitForChanges(id).then(() => {
                    addItemToTradeOffer(asset_id)
                    refreshTradeStatus()
                })

                // Second execution fills their inventory with items.
                await executeConsoleScript(theirScript)
                console.log('their')
            })

            // First execution adds the partner's inventory.
            executeConsoleScript(yourScript).then(async () => {
                const user_id_64 = getWindow()['UserYou']['GetSteamId']()
                const id = `#inventory_${user_id_64}_440_2`

                await waitForElementToBeAdded(id)

                // Second execution fills their inventory with items.
                await executeConsoleScript(yourScript)
                console.log('your')
            })
        }, 1)
    }
})()

/* Logger */
export function throwError(message: string) {
    alert(`Script: Your Personal Engineer\nMessage: ${message}`)
    throw Error(message)
}

export function getWindow(): object {
    // @ts-ignore
    return unsafeWindow
}