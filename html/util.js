export const c = type => ({onChange, ...props} = {}) => children => {
	const newElement = document.createElement(type)
	Object.assign(newElement, props ?? {})
	for (const [k, v] of Object.entries(newElement)) newElement.setAttribute(k, v)
	if (onChange !== undefined) newElement.addEventListener('change', onChange)
	if (typeof (children) === 'string') {
		newElement.innerText = children
	} else {
		for (const child of children ?? []) newElement.appendChild(child)
	}
	return newElement
}
