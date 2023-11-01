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
