import {getCompletePercentage, getKillstreakItemAmount, getNeededInput} from "./util/RoboPartCalculator";
import {listenForDynamicallyAddedItems} from "./util/DocumentHelper";

export function isBackpackUrl(url: string) {
    return /^https:\/\/backpack\.tf.+$/.test(url)
}

export async function mainBackpack() {
    // Adding the info panel to the static elements.
    const fabricators = Array.from(document.querySelectorAll('.item.q-440-6.q-440-border-6'))
        .filter(($item) => {
            const data_name = $item.getAttribute('data-name')
            if (!data_name) return false

            return data_name === 'Fabricator'
        })

    fabricators.forEach(($item) => {
        const event = new CustomEvent('item_added', {
            detail: {
                item: $item
            }
        })
        window.dispatchEvent(event)
    })

    // Listening for dynamically added items.
    listenForDynamicallyAddedItems('item', 'backpack.tf')
}

window.addEventListener('item_added', (event) => {
    const $item: Element = event['detail']['item']
    const initiator: string = event['detail']['initiator']
    if (initiator !== 'backpack.tf') return

    const data_name = $item.getAttribute('data-name')
    if (!data_name) return false

    const is_fabricator = data_name === 'Fabricator'

    if (is_fabricator) {
        const complete_percentage = getCompletePercentage($item)

        const inputs = getNeededInput($item)
        const ks_needed_to_craft = getKillstreakItemAmount(inputs)

        applyInfoPanelToFabricator($item, complete_percentage, ks_needed_to_craft)
    }
})

function applyInfoPanelToFabricator($item: Element | globalThis.Node, complete_percentage: number, ks_needed_to_craft: number) {
    const color = getPercentageColor(complete_percentage)

    const $complete_percentage = document.createElement('div')
    $complete_percentage.className = `tag top-right`
    $complete_percentage.innerText = `${complete_percentage}%`
    $complete_percentage.style.color = color

    const $ks_needed_to_craft = document.createElement(`div`)
    $ks_needed_to_craft.className = `tag top-right`
    $ks_needed_to_craft.innerText = `${ks_needed_to_craft} ks`

    $item.appendChild($complete_percentage)

    Object.assign($ks_needed_to_craft.style, {
        top: `${$complete_percentage.clientHeight}px`,
    })

    $item.appendChild($ks_needed_to_craft)
}

function getPercentageColor(percentage: number) {
    percentage = Math.min(100, Math.max(0, percentage))

    let r: number
    let g: number
    let b: number

    if (percentage <= 50) {
        r = (percentage / 50) * 255
        g = 255
        b = 0
    } else {
        r = 255
        g = (1 - (percentage - 50) / 50) * 255
        b = 0
    }

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}




