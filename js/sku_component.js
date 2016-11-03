
// es7 取对象属性值集合
Object.values = obj => {
	return Object.keys(obj).map(key => obj[key])
}

// 属性symbol分割符
const SKU_SEP = ','

// 组合选择的属性symbol路径
function getPath(selIds) {
	return selIds.sort().join(SKU_SEP)
}

let Sku = Vue.extend({
	data() {
		let active = {}
		Object.keys(this.keys).forEach(key => active[key] = null)
		return {
			active,
		}
	},
	computed: {
		// 选择的属性symbol集合
		selIds() {
			let sel = []
			for(let optionName in this.active) this.active[optionName] && sel.push(this.keys[optionName][this.active[optionName]])
			return sel
		},
		// 选择的属性symbol路径
		selPath() {
			return getPath(this.selIds)
		},
		// 选择的属性值集合
		selOptionsName() {
			let sel = []
			for(let a in this.active) if(this.active[a]) sel.push(this.active[a])
			return sel
		},
		// 价格范围
		price() {
			let obj = this.skus[this.selPath]
			let prices = obj && obj.prices
			if(prices) {
				let maxPrice = Math.max.apply(Math, prices)
	            let minPrice = Math.min.apply(Math, prices)
	            return maxPrice > minPrice ? minPrice + "-" + maxPrice : maxPrice
			} else {
				return '-'
			}
		},
		// 库存（有可能是总库存）
		stock() {
			let obj = this.skus[this.selPath]
			return obj && obj.stock || '-'
		},
		// 核心算法(来源: http://www.cnblogs.com/purediy/archive/2012/12/02/2798454.html)
		skus() {
			console.log('sku_computed')
			let res = {}, addRes = (k, s) => {
					if(res[k]) res[k].stock += s.stock, res[k].prices.push(s.price)
					else res[k] = {stock: s.stock, prices: [s.price], }
				}, combine = (skas, n, s) => {
					let len = skas.length
					skas.forEach((key, i) => {
						for(let j = i + 1; j < len; ++j) if(j + n <= len) {
							let tmp = skas.slice(j, j + n), gk = getPath(tmp.concat(key))
							addRes(gk, s)
						}
					})
				}, keys = Object.keys(this.values)
				for(let key of keys) {
					let s = this.values[key]
					let skas = key.split(SKU_SEP).sort()
					let len = skas.length
					for(let j = 0; j < len; ++j) {
						addRes(skas[j], s)
						j > 0 && j < len-1 && combine(skas, j, s); 
					}
					res[getPath(key.split(SKU_SEP))] = {
						stock:s.stock,
						prices:[s.price],
					}
				}
			return res
		},
	},
	// 组件接收配置参数
	props: ['keys', 'values', ],
	methods: {
		// 点击事件
		select(symbol, name, title) {
			if(this.active[title] === name) this.active[title] = null
			else this.active[title] = name
		},
		// 判断是否可点击
		canClick(symbol, name, title) {
			// 如果元素本身已选中， 则可以点击（让用户取消选择）
			if(this.selIds.indexOf(symbol) !== -1)
				return true
			let self = this
			// 过滤已选中的当前选项层的所有属性值的symbol的集合
			let notSiblingsSelIds = this.selIds.filter(v => v !== symbol).filter(v => Object.values(self.keys[title]).indexOf(v) === -1)
			let sku = this.skus[getPath(notSiblingsSelIds.concat(symbol))]
			return sku && sku.stock > 0
		},
	},
	watch: {
		"keys"() {
			let active = {}
			Object.keys(this.keys).forEach(key => active[key] = null)
			this.active = active
		},
	},
	template: `
		<div>
			<p>选择配置：{{ selOptionsName.join(' + ') || '-' }}</p>
			<p>选择路径：{{ selPath || '-' }}</p>
			<p>价格：{{ price }}</p>
			<p>库存：{{ stock }}</p>
			<div v-for="(options, title) in keys">
				<span>{{ title }}</span>:
				<span>
					<button :class="{selected: active[title] === name}" @click="select(symbol, name, title)" :disabled="!canClick(symbol, name, title)" v-for="(symbol, name) in options">
						{{ name }} ({{ symbol }})
					</button>
				</span>
			</div>
		</div>
	`,
})