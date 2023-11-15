const findParentByTagName = (element, tagName) => {
    if (!element) {
        return null
    }
    if (element.tagName === tagName) {
        return element
    }
    return findParentByTagName(element.parentElement, tagName)
}

const findParentByClassName = (element, className) => {
    if (!element) {
        return null
    }
    if (element.classList.contains(className)) {
        return element
    }
    return findParentByClassName(element.parentElement, className)
}

// Example usage: select elements with IDs starting with 'element'
// const regexPattern = /^element/
// const matchedElements = selectElementsByRegex(regexPattern)
function selectElementsByRegex(pattern) {
    const allElements = document.querySelectorAll('*')
    const matchingElements = []

    // Iterate through all elements and filter based on the regex pattern
    allElements.forEach(element => {
        if (element.id && element.id.match(pattern)) {
            matchingElements.push(element)
        }
    });

    return matchingElements
}

