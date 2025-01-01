export function listenForDynamicallyAddedItems(class_name: string, initiator: string) {
    function checkForItemClass(node: globalThis.Node) {
        if (node.nodeType === 1) {
            const classes = class_name.split(' ')
            const contains_all_classes = classes.every((class_) => node['classList'].contains(class_))

            if (contains_all_classes) {
                const event = new CustomEvent('item_added', {
                    detail: {
                        item: node,
                        initiator: initiator
                    }
                })
                window.dispatchEvent(event)
            }
        }

        if (node.nodeType === 1 && node['children'].length > 0) {
            for (let child of node['children']) {
                checkForItemClass(child)
            }
        }
    }

    const observer = new MutationObserver((mutationsList, observer) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    checkForItemClass(node)
                })
            }
        }
    })

    observer.observe(document.body, {
        childList: true,
        subtree: true
    })
}