//
// for (const e of document.querySelectorAll('form')) {
// 	e.addEventListener('submit', e => {
// 		e.preventDefault()
// 	})
// }
//
import {c} from './util.js'
document.querySelector('#counter').addEventListener('submit', e => {
	e.preventDefault()
	const {target} = e
	const [input] = target.elements
	const {value} = input
	input.value = parseInt(value, 10) + 1
})

const getByName = name => document.querySelector(`[name="${name}"]`)
const celsius = getByName('celsius')
const fahrenheit = getByName('fahrenheit')
const c2f = c => (c * (9/5)) + 32
const f2c = f => (f - 32) * (5/9)
const converter = f => target => e => {
	const {value} = e.target
	const maybeValue = parseInt(value, 10)
	if (maybeValue === undefined) return
	target.value = f(maybeValue)
}
celsius.addEventListener('input', converter(c2f)(fahrenheit))
fahrenheit.addEventListener('input', converter(f2c)(celsius))

const returnTime = getByName('return')
const outward = getByName('outward')
const directions = getByName('directions')
directions.addEventListener('change', e => {
	const {value} = e.target
	if (value === 'one-way') {
		returnTime.disabled = true
	}
	if (value === 'return') {
		returnTime.disabled = false
	}
})

const setCustomValidity = msg => e => {
	e.setCustomValidity(msg)
	e.reportValidity()
}
returnTime.addEventListener('change', e => {
	const {target} = e
	const {valueAsNumber} = target
	const isLaterThanDeparture = new Date(outward.valueAsNumber) < new Date(returnTime.valueAsNumber)
	setCustomValidity(!isLaterThanDeparture ? 'you must return later than you left' : '')(target)
})

document.querySelector('#flight').addEventListener('submit', e => {
	e.preventDefault()
	const {target} = e
	const data = new FormData(target)
	const toDisplay = `you have booked a ${data.get('directions')} flight on ${data.get('outward')}.`
	console.log(toDisplay)
})
const duration = getByName('duration')
const reset = document.querySelector('#reset')
const elapsed = document.querySelector('#elapsed')
const elapsedText = document.querySelector('#elapsed-text')

let timer = 0
const everyTenthSecond = () => {
	const max = duration.value
	if (timer > max) {
		elapsed.value = 100
		return
	}
	timer += 0.1
	const percent = (timer / max) * 100
	elapsed.value = percent
	elapsedText.innerText = timer.toFixed(1)
}
const timing = setInterval(everyTenthSecond, 1e2)
reset.addEventListener('click', e => {
	timer = 0
})

const database = document.querySelector('#database')
const databaseRadio = document.querySelector('#database-radio')
const crudForm = document.querySelector('#CRUD')
const create = document.querySelector('#create')
const update = document.querySelector('#update')
const deleteButton = document.querySelector('#delete')
const prefix = getByName('prefix')
const name = getByName('name')
const surname = getByName('surname')
const radioName = 'databaserr'
const radioChanged = e => {
	// const {[radioName]: selected} = Object.fromEntries(new FormData(crudForm).entries())
	// const [firstName, lastName] = selected
	console.log(e.target)
	deleteButton.removeAttribute('disabled')
	update.removeAttribute('disabled')
}
const populateRadio = (filter = '') => {
	databaseRadio.innerHTML = ''
	for (const {value} of database.options) {
		const [firstName, lastName] = value.split(' ')
		if (filter.length > 0 && !new RegExp(filter, 'i').test(value)) {
			continue
		}
		const id = value.replace(/ /g, '-')
		const newElement = c ('div') () ([
			c ('input') ({id, name: radioName, value, type: 'radio', onChange: radioChanged}) (),
			c ('label') ({htmlFor: id, innerText: value}) (),
		])
		databaseRadio.appendChild(newElement)
	}
}
populateRadio()
prefix.addEventListener('input', e => {
	const {value} = e.target
	populateRadio(value)
})
deleteButton.addEventListener('click', e => {
	const {[radioName]: selected} = Object.fromEntries(new FormData(crudForm).entries())
	document.querySelector(`option[value="${selected}"]`).remove()
	populateRadio(prefix.value)
})
update.addEventListener('click', e => {
	const withoutValue = [name, surname].filter(e => e.value === '')
	if (withoutValue.length > 0) {
		withoutValue.forEach(setCustomValidity('required for update'))
		setCustomValidity('please enter a name')(e.target)
	} else {
		[...withoutValue, e.target].forEach(setCustomValidity(''))
	}
	const {[radioName]: selected} = Object.fromEntries(new FormData(crudForm).entries())
	if (selected === undefined) {
		setCustomValidity('please select a user to update')(e.target)
	} else {
		setCustomValidity('')(e.target)
	}
	const newValue = `${name.value} ${surname.value}`
	document.querySelector(`option[value="${selected}"]`).value = newValue
	populateRadio(prefix.value)
	document.querySelector(`input[value="${newValue}"]`).checked = true
})
create.addEventListener('click', e => {
	const withoutValue = [name, surname].filter(e => e.value === '')
	if (withoutValue.length > 0) {
		withoutValue.forEach(setCustomValidity('required for update'))
		setCustomValidity('please enter a name')(e.target)
	} else {
		[...withoutValue, e.target].forEach(setCustomValidity(''))
	}
	const value = `${name.value} ${surname.value}`
	database.appendChild(c ('option') ({value}) ())
	populateRadio(prefix.value)
})

const svg = document.querySelector('svg')
const undo = document.querySelector('button#undo')
const redo = document.querySelector('button#redo')
const dialog = document.querySelector('#circleDialog')
const cancel = dialog.querySelector('#cancel')
const save = dialog.querySelector('#save')
document.querySelector('#circles').addEventListener('submit', e => e.preventDefault())
const radius = getByName('radius')
class Stack {
	ary = []
	listeners = []
	pop = (...xs) => {
		const val = this.ary.pop(...xs)
		for (const f of this.listeners) f(this.ary)
		return val
	}
	push = (...xs) => {
		const val = this.ary.push(...xs)
		for (const f of this.listeners) f(this.ary)
		return val
	}
	flush = () => {
		this.ary = []
		for (const f of this.listeners) f (this.ary)
	}
	registerListener = f => this.listeners.push(f)
}
const undoStack = new Stack()
undoStack.registerListener(xs => {
	if (xs.length > 0) {
		undo.removeAttribute('disabled')
	} else {
		undo.disabled = true
	}
})
undoStack.registerListener(() => redoStack.flush())
undo.addEventListener('click', (...e) => {
	const x = undoStack.pop()
	x.undo(...e)
	redoStack.push(x)
})
const redoStack = new Stack()
redoStack.registerListener(xs => {
	if (xs.length > 0) {
		redo.removeAttribute('disabled')
	} else {
		redo.disabled = true
	}
})
redo.addEventListener('click', (...e) => {
	const x = redoStack.pop()
	x.do(...e)
	undoStack.push(x)
})
const svgns = "http://www.w3.org/2000/svg"
const cwNS = ns => tag => ({onClick, ...props}) => {
	const e = document.createElementNS(ns, tag)
	for (const [k, v] of Object.entries(props)) e.setAttributeNS(null, k, v)
	return e
}
const circle = cwNS(svgns) ('circle')
svg.addEventListener('click', e => {
	const {x, y, target} = e
	const cx = x
	const cy = y - 230
	const newCircle = circle({cx: x, cy: y - 230, r: 50, 'pointer-events': 'visible'})
	newCircle.addEventListener('click', e => {
		e.stopPropagation()
		document.querySelector('circle.selected')?.classList.remove('selected')
		e.target.classList.add('selected')
	})
	newCircle.addEventListener('contextmenu', e => {
		if (e.target.classList.contains('selected')) {
			e.preventDefault()
			const r = e.target.r.baseVal.value
			console.log(r)
			radius.value = r
			cancel.value = r
			dialog.showModal()
		}
	})
	const thing = {
		undo: () => newCircle.remove(),
		do: () => svg.appendChild(newCircle),
	}
	thing.do()
	undoStack.push(thing)
})
dialog.addEventListener('close', e => {
	const circle = document.querySelector('circle.selected')
	if (!circle) throw new Error()
	const oldRadius = parseInt(cancel.value, 10)
	const incomingVal = parseInt(e.target.returnValue, 10)
	if (oldRadius === incomingVal) {
		return
	}
	const thing = {
		undo: () => circle.setAttributeNS(null, 'r', oldRadius),
		do: () => circle.setAttributeNS(null, 'r', incomingVal),
	}
	thing.do()
	undoStack.push(thing)
})
radius.addEventListener('input', e => {
	const {value} = e.target
	document.querySelector('circle.selected').setAttributeNS(null, 'r', parseInt(value, 10))
	save.value = value
})
