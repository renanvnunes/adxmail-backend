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
	set: global.moneyBr = (value) => {

		// Remove todos os pontos e vírgulas 
		value = value.replace('BRL', '')
		value = value.replace('R$', '')
		value = value.replace('.', '')
		value = value.replace(',', '')
		value = value.replace(' ', '')
		
		// Pega os últimos dois caracteres (centavos)
		let centavos = value.slice(-2)

		// Remove os últimos dois caracteres
		let sem_centavos = value.substr(0, value.length - 2);

		// Junta tudo
		value = Number(`${sem_centavos}.${centavos}`)
		
		// Formata para real
		value = value.toLocaleString('pt-br', {minimumFractionDigits: 2});
		
		return value
	}
}
