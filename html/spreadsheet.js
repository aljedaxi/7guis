import {c} from './util.js'
const range = n => new Array(n).fill(undefined)
const groupBy = f => xs => {
	const map = new Map()
	for (const x of xs) {
		const k = f (x)
		const ary = map.get(k) ?? []
		ary.push(x)
		map.set(k, ary)
	}
	return map
}

class SubmittableInput extends HTMLElement {
	constructor() {
		super()
	}
	connectedCallback() {
		const shadow = this.attachShadow({mode: 'open'})
		this.shadowRoot.innerHTML = `
			<form class="hidden">
				<input type="text">
				<button type="submit">submit</button>
			</form>
		`
		this.shadowRoot.querySelector('form').addEventListener('submit', e => {
			e.preventDefault()
			this.dispatchEvent(new SubmitEvent('submit', {}))
		})
	}
}

// just pass in the input lol
class InputCell extends HTMLElement {
	constructor() {
		super()
	}
	connectedCallback() {
		const shadow = this.attachShadow({mode: 'open'})
		const td = c ('td') ({innerText: 'x'}) ([])
		this.style = 'display: contents'
		this.addEventListener('dblclick', e => {
			this.shadowRoot.querySelector('slot:not([name])').classList.add('hidden')
			this.shadowRoot.querySelector('form').classList.remove('hidden')
		})
		this.shadowRoot.innerHTML = `
			<slot class="active"></slot>
			<form class="hidden">
				<slot name="secondary"></slot>
				<button type="submit">submit</button>
			</form>
			<style>
				.hidden {display: none;}
				form {display: contents;}
				button {visibility: hidden;}
			</style>
		`
		this.shadowRoot.querySelector('form').addEventListener('submit', console.log)
		this.addEventListener('submit', console.log)
	}
}

customElements.define('sub-input', SubmittableInput)
customElements.define('sheet-cell', InputCell)

const sExpFunctions = {
	'*': (x, y) => x * y,
	'+': (x, y) => x + y,
}
const isSExp = s => s.at(0) === '(' && s.at(-1) === ')'
const parseSExp = s => isSExp ? s.slice(1, -1).split(/\s+/)
                              : []

const parseIntSafe = n => {
	const v = parseInt(n, 10)
	return isNaN(v) ? undefined : v
}
const evalSExpression = lookupVal => ([fName, ...args]) => {
	const f = sExpFunctions[fName]
	return f?.(...args.map(s => parseIntSafe(s, 10) ?? lookupVal(s)))
}

const trace = s => (console.log(s), s)
class Spreadsheet extends HTMLTableElement {
	constructor() {
		super();
	}
	col = n => String.fromCharCode(65 + n);
	resetState = () => {
		this.shadowRoot.querySelectorAll('input').forEach(e => e.classList.add('hidden'))
		this.shadowRoot.querySelectorAll('.primary').forEach(e => e.classList.remove('hidden'))
	}
	colVals = new Map()
	dependents = new Map()
	hasDependents = id => (this.dependents.get(id)?.size ?? 0) > 0
	lookupVal = me => id => {
		const set = this.dependents.get(id) ?? new Set()
		set.add(me)
		this.dependents.set(id, set)
		console.log(id, this.colVals.get(id) ?? 0)
		return this.colVals.get(id) ?? 0
	}
	get formData() {
		return new FormData(this.shadowRoot.querySelector('form'))
	}
	writeEvalledVal = id => val => {
		const td = this.shadowRoot.querySelector(`td#${id}`)
		td.querySelector('span').innerText = val
	}
	onsubmit = e => {
		e.preventDefault()
		const {target, submitter} = e
		const {lookupVal} = this
		const id = submitter.value
		const value = new FormData(target).get(id)
		const evalledVal = isSExp(value)
			? evalSExpression (lookupVal (id)) (parseSExp (value))
			: value
		this.colVals.set(id, parseIntSafe(evalledVal))
		if (this.hasDependents(id)) {
			for (const dependent of this.dependents.get(id)) {
				const dependentVal = this.formData.get(dependent)
				const dependentEvalledVal = evalSExpression (lookupVal (dependent)) (parseSExp (dependentVal))
				this.writeEvalledVal (dependent) (dependentEvalledVal)
			}
		}
		this.writeEvalledVal (id) (evalledVal)
		this.resetState()
	}
	ondblclick = e => {
		const td = e.target.closest('td')
		const {id} = td
		this.resetState()
		this.shadowRoot.querySelector('button').value = id
		td.querySelector('input').classList.remove('hidden')
		td.querySelector('input').focus()
		td.querySelector('.primary').classList.add('hidden')
	}
	connectedCallback() {
		const {ondblclick, onsubmit} = this
		const shadow = this.attachShadow({mode: 'open'})
		const rows = this.getAttribute('rows')
		const cols = this.getAttribute('cols')
		this.style = 'display: contents'
		shadow.appendChild(
			c ('style') ({}) (`
				td {width: 90px}
				.hidden {display: none;}
				.secondary {display: none;}
			`)
		)
		shadow.appendChild(
			c ('form') ({onsubmit}) ([
				c ('button') ({style: 'visibility: hidden'}) (),
				c ('table') ({}) ([
					c ('thead') ({}) ([
						c ('tr') ({}) ([
							...range (parseInt(cols, 10)).map (
								(_, j) => c ('td') ({}) (this.col(j))
							)
						]),
					]),
					...range (parseInt(rows, 10)).map (
						(_, i) => c ('tr') ({}) (
							range (parseInt(cols, 10)).map (
								(_, j) => {
									const id = `${this.col(j)}${i}`
									return c ('td') ({id, ondblclick}) ([
										c ('input') ({name: id, className: 'hidden', autofocus: ''}) (),
										c ('span') ({className: 'primary'}) (id)
									])
								}
							)
						)
					)
				])
			])
		)
	}
}

customElements.define('c-spreadsheet', Spreadsheet, {extends: 'table'})
