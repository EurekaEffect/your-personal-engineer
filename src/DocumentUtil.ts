export async function executeConsoleScript(script: () => Promise<void>) {
    return await new Promise((resolve) => {

        let $button = document.createElement('button')
        $button.addEventListener('click', async () => {
            await script()

            if (document.body.contains($button)) {
                $button.remove()
            }

            resolve(true)
        })

        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    if (document.body.contains($button)) {
                        $button.click()

                        observer.disconnect()
                    }
                }
            }
        })

        observer.observe(document.body, {childList: true})

        document.body.append($button)
    })
}

export async function waitForElementToBeAdded(id: string) {
    return await new Promise((resolve) => {
        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    const element = document.querySelector(`${id}`)

                    if (element) {
                        observer.disconnect()
                        resolve(element)
                    }
                }
            }
        })

        observer.observe(document, { childList: true, subtree: true })

        const already_present = document.querySelector(`${id}`)
        if (already_present) {
            resolve(already_present)
        }
    })
}

export async function waitForChanges(id: string) {
    return new Promise((resolve, reject) => {
        const $element = document.querySelector(id)

        if (!$element) {
            reject(new Error(`Element with id ${id} not found`))
            return
        }

        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    observer.disconnect()
                    resolve($element)
                }
            }
        })

        observer.observe($element, { childList: true, subtree: true })
    })
}

/* Thanks Brom127 for the method! */
export function awaitDocumentReady(): Promise<void> {
    return new Promise<void>((res) => {
        if (document.readyState !== 'loading') {
            res()
        } else {
            document.addEventListener('DOMContentLoaded', () => res())
        }
    })
}