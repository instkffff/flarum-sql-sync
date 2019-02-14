const esi = require('eve-swagger')
const mysql = require('mysql')

const connection = mysql.createConnection({
	host : '199.247.16.189',
	user : 'admin',
	password : '123456',
	database : 'flarum'
})

const esi2 = esi({
	service : 'https://esi.evetech.net',
	source : 'tranquility',
	agent : 'eve-swagger | https://github.com/lhkbob/eve-swagger-js',
	language : 'en-us',
	timeout : 6000,
	minTime : 0,
	maxConcurrent : 0

})

function users(){
	//sql connect
	connection.connect()
	let userList = 'SELECT * FROM users'

	return new Promise(
		function(resolve,reject){
			connection.query(userList,function(err,result){
				if(err){
					reject(err)
				}
				resolve(result)
			})
		}
	)
	connection.end()
}

let roleSync = users().then(result =>{
	for ( i=0; i<result.length; i++){
		let charJson = JSON.stringify(eval(result[i]))
		let char = JSON.parse(charJson)
		let charID = char.character_id
		let ID = char.id
		if( charID === null){
			console.log('this is admin')
		}else{
			esi2.characters(charID).info().then(info =>{
				let charInfoJson = JSON.stringify(eval(info))
				let charInfo = JSON.parse(charInfoJson)
				let alliance_id = charInfo.alliance_id
				let corporation_id = charInfo.corporation_id
				console.log(corporation_id)
			}).catch(error => {
				console.log(error)
			})
		}
	}
}).catch(error => {
	console.log(error)
})
