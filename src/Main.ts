// I'm going to redo everything I did before using TypeScript to make the code more readable.
// TS will compile every .ts file into a JS bundle (ype.bundle.user.js).
// I will use it because I don't know how to divide a one single JS file into multiple files and make it work in TamperMonkey.
// BTW even if I knew I'd use TS since it's way cooler than JS :sunglasses:.

(async function () {
    await awaitDocumentReady()

    // @ts-ignore
    console.log(`window.UserThem: ${UserThem}`) // WHAT THE FUCK WHY window.UserThem DOESNT WORK BUT THIS DOES OH MY GOD I'VE SPENT 3 HOURS FOR DEBUGGING
})()

/* Logger */
export function throwError(message: string) {
    alert(`Script: Your Personal Engineer\nMessage: ${message}`)
    throw Error(message)
}

/* Thanks Brom127 for the method! */
function awaitDocumentReady(): Promise<void> {
    return new Promise<void>((res) => {
        if (document.readyState !== 'loading') {
            res()
        } else {
            document.addEventListener('DOMContentLoaded', () => res())
        }
    })
}
