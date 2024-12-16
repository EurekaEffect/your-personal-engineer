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

        .hover-able:hover .popup-panel {
            display: block;
        }

        .popup-panel:hover {
            display:block;
        }
        
        output {
            color: white; 
            margin: -5px
        }
    </style>`
const TRADE_BUTTON =
    `<a class="btn btn-bottom btn-xs btn-success hover-able" style="background-color: rgb(185, 143, 200); border-color: rgb(185, 143, 200)" ype.asset_id="" ype.item_name="" ype.amount="1" ype.currencies="">
        <i class="fa fa-fire"></i>
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

    listings.forEach((listing) => {
        const $item = listing.querySelector('.item')
        const $buttons = listing.querySelector('.listing-buttons')

        const asset_id = $item!.getAttribute('data-id')
        const item_name = $item!.getAttribute('title')
        const price = $item!.getAttribute('data-listing_price')

        const trade_offer_url = getTradeOfferUrl()

        if (trade_offer_url) {
            $buttons!.insertAdjacentHTML('beforeend', TRADE_BUTTON)

            const trade_button = listing.querySelector('.btn.btn-bottom.btn-xs.btn-success.hover-able')

            trade_button!.addEventListener('click', () => {
                const ype = {
                    asset_id: asset_id,
                    item_name: item_name,
                    amount: trade_button!.getAttribute('ype.amount'),
                    currencies: parsePriceStr(price ? price : '0 key, 0 ref')
                }

                open(`${trade_offer_url}&ype=${JSON.stringify(ype)}`, '_blank')
            })
        }

        function getTradeOfferUrl() {
            const user_link = listing.querySelector('.user-link')
            const offer_params = user_link!.getAttribute('data-offers-params')

            if (offer_params) {
                return `https://steamcommunity.com/tradeoffer/new/${offer_params}`
            } else {
                return undefined
            }
        }

        function parsePriceStr(price_str: string) {
            const regex = /\b(\d+(\.\d+)?)\s(key|keys|ref|refs)\b/g

            function convertMatchesToJSON(match: any[]) {
                const result = {};

                const number = match[1]
                let term = match[3]

                if (term === "key" || term === "keys") {
                    term = "keys"
                }

                if (term === "ref" || term === "refs") {
                    term = "metal"
                }

                result[term] = parseFloat(number)
                return result
            }

            const results = {}
            let match: RegExpExecArray | null

            while ((match = regex.exec(price_str)) !== null) {
                const jsonObj = convertMatchesToJSON(match)

                Object.assign(results, jsonObj)
            }

            return results
        }
    })
}