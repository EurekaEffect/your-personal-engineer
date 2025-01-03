const STYLE = `<style>
        .hover-able {
            cursor: pointer;
            position: relative;
            display: inline-block;
            z-index: 1;
        }

        .popup-panel {
            position:absolute;
            top: -43px;
            left: 50%;
            width: 125px;
            transform: translateX(-50%);
            display:none;
            z-index:1070;
            background-color: black;
            color: white;
            font-family:"Helvetica Neue",Roboto,Arial,sans-serif;
            font-size:12px;
            font-weight:400;
            line-height:1.4;
            opacity: 0.9;
            margin-top:-3px;
            padding:5px 5px;
            border-radius: 5px;
        }
        
        output {
            color: white; 
            margin: -5px
        }
    </style>`

const TRADE_BUTTON =
    `<a class="btn btn-bottom btn-xs btn-success hover-able" style="background-color: rgb(185, 143, 200); border-color: rgb(185, 143, 200)" ype.amount="1">
        <div class="popup-panel" onclick="event.stopPropagation()">
            <input type="range" value="1" min="1" max="50" oninput="this.nextElementSibling.value = this.value; this.parentNode.parentNode.setAttribute('ype.amount', parseInt(this.value))" draggable="false">
            <output>1</output>
        </div>
    </a>`

export function isClassifiedsUrl(url: string) {
    return /^https:\/\/backpack\.tf\/classifieds\?.+$|^https:\/\/backpack\.tf\/stats\/.+$/.test(url)
}

export async function mainClassifieds() {
    // Inserting the style.
    const head = document.querySelector('head')
    head!.insertAdjacentHTML('afterend', STYLE)

    const listings = document.querySelectorAll('.listing')

    // @ts-ignore, I hate this.
    for (const $listing of listings) {
        const $item = $listing.querySelector('.item')
        const $body = $listing.querySelector('.listing-body')
        const $buttons = $listing.querySelector('.listing-buttons')

        let price = $item!.getAttribute('data-listing_price')
        if (!price) continue // Marketplace.tf listings.

        const trade_offer_url = getTradeOfferUrl($listing)

        if (trade_offer_url) {
            // Adding the trade button to the listing.
            $buttons!.insertAdjacentHTML('beforeend', TRADE_BUTTON)

            // Searching the previously added trade button to set up 'onclick' event in it.
            const $trade_button = $listing.querySelector('.btn.btn-bottom.btn-xs.btn-success.hover-able')
            const $popup_panel = $trade_button.querySelector('.popup-panel')

            // Handling the popup.
            $trade_button!.addEventListener('mouseenter', () => {
                $popup_panel!.style.display = 'block'
            })
            $popup_panel!.addEventListener('mouseleave', () => {
                $popup_panel!.style.display = 'none'
            })

            // Searching for the icon.
            let $icon = $listing.querySelector('.fa.fa-sw.fa-flash')
            if (!$icon) {
                // Creating our own icon.
                $icon = document.createElement('i')
                $icon.classList.add('fa', 'fa-sw', 'fa-exchange')
            } else {
                $icon = $icon.cloneNode(true) // Cloning to make a different node.
            }

            $trade_button!.prepend($icon) // Adding the icon to the trade button.

            $trade_button!.addEventListener('click', () => {
                let intent = $item!.getAttribute('data-listing_intent')
                let asset_id = $item!.getAttribute('data-id')
                let item = handleAndGetItemData($item, $body)
                let amount = $trade_button!.getAttribute('ype.amount')
                let price = $item!.getAttribute('data-listing_price')

                const currencies = convertPriceToCurrencies(price)

                // Creating a config based on listing's attributes.
                const ype = {
                    intent: intent,
                    asset_id: (!asset_id || asset_id.length === 0) ? undefined : asset_id,
                    item_name: item['item_name'],
                    item_data: item['item_data'],
                    amount: amount,
                    currencies: currencies
                }

                // Opening a new window with trade offer page.
                const trade_offer_url_with_ype = `${trade_offer_url}&ype=${JSON.stringify(ype)}`
                open(trade_offer_url_with_ype, '_blank')
            })
        }
    }
}

function handleAndGetItemData($item: Element, $body: Element) {
    let item_name = $body?.querySelector('h5')?.firstChild?.textContent?.trim()
    let item_data = {}

    const craftable = $item.getAttribute('data-craftable')

    if (craftable === '0') {
        // Removing 'Non-Craftable' from the name.
        item_name = item_name?.substring(14)
        item_data['craftable'] = false
    }

    return {
        item_name: item_name,
        item_data: item_data
    }
}

function getTradeOfferUrl($listing: Element) {
    const user_link = $listing.querySelector('.user-link')
    const offer_params = user_link!.getAttribute('data-offers-params')

    if (offer_params) {
        return `https://steamcommunity.com/tradeoffer/new/${offer_params}`
    } else {
        return undefined
    }
}

function convertPriceToCurrencies(price_str: string) {
    const regex = /\b(\d+(\.\d+)?)\s(key|keys|ref|refs)\b/g

    function convertMatchesToJSON(match: any[]) {
        const result = {}

        const number = match[1]
        let term = match[3]

        if (term === "key" || term === "keys") term = "keys"
        if (term === "ref" || term === "refs") term = "metal"

        result[term] = parseFloat(number)
        return result
    }

    const results = {}
    let match: RegExpExecArray | null

    while ((match = regex.exec(price_str)) !== null) {
        const json = convertMatchesToJSON(match)

        Object.assign(results, json)
    }

    if (!results['keys']) results['keys'] = 0
    if (!results['metal']) results['metal'] = 0
    return results
}
