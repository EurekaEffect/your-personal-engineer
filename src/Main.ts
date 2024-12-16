// I'm going to redo everything I did before using TypeScript to make the code more readable.
// TS will compile every .ts file into a JS bundle (ype.bundle.user.js).
// I will use it because I don't know how to divide a one single JS file into multiple files and make it work in TamperMonkey.
// BTW even if I knew I'd use TS since it's way cooler than JS :sunglasses:.

import {isTradeOfferUrl, mainTradeOffer} from "./TradeOffer.page";
import {isClassifiedsUrl, mainClassifieds} from "./Classifieds.page";

// Main code.
(async function () {
    const is_trade_offer_page = isTradeOfferUrl(location.href)
    const is_classifieds_page = isClassifiedsUrl(location.href)

    if (is_trade_offer_page) {
        await mainTradeOffer()
    } else if (is_classifieds_page) {
        await mainClassifieds()
    }
})()

// Yeah, it alertinating.
export function alert(message: string) {
    window.alert(`Script: Your Personal Engineer\n${message}`)
}

// Yeah, it logs.
export function log(method: string, message: string) {
    console.log(`[YPE, ${method}] ${message}`);
}

// Yeah, it errors.
export function error(method: string, message: string) {
    console.error(`[YPE, ${method}] ${message}`);
}

// Yeah, it throws an error.
export function throwError(message: string) {
    throw Error(message)
}

// Getting the access to the global variables.
export function getWindow(): object {
    // @ts-ignore
    return unsafeWindow
}