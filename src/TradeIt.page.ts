import {listenForDynamicallyAddedItems} from "./util/DocumentHelper"

const $site_element = document.querySelector('.site-inventory') as Element

export function isTradeItUrl(url: string) {
    return /^https:\/\/tradeit.gg.+$/.test(url)
}

export async function mainTradeIt() {
    // Listening for dynamically added items.
    listenForDynamicallyAddedItems('item-details', 'tradeit.gg')
}

window.addEventListener('item_added', (event) => {
    const $item: Element = event['detail']['item']
    const initiator: string = event['detail']['initiator']
    if (initiator !== 'tradeit.gg') return

    const is_site_item = $site_element.contains($item)

    if (is_site_item) {
        // Site item.
        const $price = $item.querySelector('.price')
        const $value = $price!.querySelector('.d-inline-block')

        const price = parseFloat($value!.textContent!.replace('$', ''))
        const fee = 11.5

        const approximate_sell_price = Math.floor((price - (price * (fee / 100))) * 100) / 100 // Also rounded.
        const approximate_price_html = `<div class="d-inline-block" style="display: flex; justify-content: space-between; width: 100%; text-align: right; color: gray">~$${approximate_sell_price}</div>`

        $value!.insertAdjacentHTML('afterend', approximate_price_html)
    } else {
        // Our item.
        const is_unavailable = $item.classList.contains('unavailable')

        // Removing, if the item is not available.
        if (is_unavailable) {
            const parentNode = $item!.parentNode!.parentNode!.parentNode as Element
            parentNode.remove()
        }
    }
})
