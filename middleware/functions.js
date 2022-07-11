export default {
	set: global.outputMsg = (type, data, found_documents = null, total_documents = null) => { 
		return !type ? {'success' : 0, 'message' : data} : {'success' : 1, 'found_documents' : found_documents, 'total_documents' : total_documents, 'data' : data}
	},
	set: global.clearField = (str) => { 
		return str === parseInt(str, 10) == false ? str.replace(/[^\w\s]/gi, '').replaceAll(' ', '') : str
	},
	set: global.isInt = (value) => {
		return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
	},
	set: global.convertMoney = (str) => {
		let str1 = str.replace('.', '')
		return str1.replace(',', '.')
		
	},
	set: global.moneyBr = (str) => {
		let value = parseFloat(str)
		return value.toLocaleString('pt-br', {minimumFractionDigits: 2})
	}
}
