const esi = require('eve-swagger')
const mysql = require('mysql')
const combijson = require('combijson')

//whitelist group
whitelistGroup = ['1','2','4']
//whitelist alliance
whitelistAlliance = ['99003581','99006828','99007498']

const connection = mysql.createPool({
	connectionLimit : 1000,
	host : 'localhost',
	user : '',
	password : '',
	database : ''
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

// 'SELECT * FROM users'
// 'SELECT * FROM group_user'
function Query(condition){	
	return new Promise(
		function(resolve,reject){
			connection.query(condition,function(err,result){
				if(err){
					reject(err)
				}
				resolve(result)
			})
		}
	)
}

// 'UPDATE group_user SET group_id = ? WHERE user_id = ?'
function Assign(condition,user_id,role){
	return new Promise(
		function(resolve,reject){
			let modSqlParams = [role,user_id]
			connection.query(condition,modSqlParams,function(err,result){
				if(err){
					reject(err)
				}
				resolve('sync successfully')
			})
		}
	)
}

// 'UPDATE users SET bio = ? WHERE id = ?'
function EveEsi(condition,id,bio){
	return new Promise(
		function(resolve,reject){
			let modSqlParams = [bio,id]
			connection.query(condition,modSqlParams,function(err,result){
				if(err){
					reject(err)
				}
				resolve('sync Esi successfully')
			})
		}
	)
}

//alliance_name
async function SyncBio(id,alliance_id,corporation_id){
	let alliance_info_obj = await esi2.alliances(alliance_id).info()
	let alliance_info_json = JSON.stringify(alliance_info_obj)
	let corporation_info_obj = await esi2.corporations(corporation_id).info()
	let corporation_info_json = JSON.stringify(corporation_info_obj)
	let alliance_info = JSON.parse(alliance_info_json)
	let corporation_info = JSON.parse(corporation_info_json)
	let alliance_name = alliance_info.alliance_name
	let corporation_name = corporation_info.corporation_name
	let bio_json = {
		'alliance_name':alliance_name,
		'corporation_name':corporation_name,
		'alliance_id':alliance_id,
		'corporation_id':corporation_id
	}
	let bio = JSON.stringify(bio_json)
	console.log(bio)
	EveEsi('UPDATE users SET bio = ? WHERE id = ?',id,bio).then(result => {
		console.log(result)
	}).catch(error => {
		console.log(error)
	})
}

async function Sync(){
	
	let users = await Query('SELECT * FROM users')
	let group_user = await Query('SELECT * FROM group_user')

	let userInfoCombi = combijson([users,group_user])
	let userInfojson = JSON.stringify(eval(userInfoCombi))
	let userInfo = JSON.parse(userInfojson)

	for(i=0;i<users.length;i++){
		let charjson = JSON.stringify(eval(userInfo[i]))
		let char = JSON.parse(charjson)
		let character_id = char.character_id
		let id = char.id
		let group_id = char.group_id
		let user_id = char.user_id
		if(character_id === null){
			console.log('this is admin')
		}else{
			esi2.characters(character_id).info().then(info =>{
				let charInfoJson = JSON.stringify(eval(info))
				let charInfo = JSON.parse(charInfoJson)
				let alliance_id = charInfo.alliance_id
				let corporation_id = charInfo.corporation_id
				SyncBio(id,alliance_id,corporation_id)
				int1 = whitelistAlliance.indexOf(alliance_id.toString())
				int2 = whitelistGroup.indexOf(group_id.toString())
				if(int2 >= 0){
					console.log('this role assign manually')
				}else if(int1 >= 0){
					Assign('UPDATE group_user SET group_id = ? WHERE user_id = ?',user_id,5).then(result => {
						console.log(result)
					}).catch(error =>{
						console.log(error)
					})
				}else{
					Assign('UPDATE group_user SET user_id = ? WHERE user_id = ?' ,user_id,3).then(result => {
						console.log(result)
					}).catch(error =>{
						console.log(error)
					})
				}
			}).catch(error =>{
				console.log(error)
			})
		}
	}
	
}



setInterval(function(){
	Sync()
},600000)

//ignore error
process.on("uncatchException", function(e) {
    console.log(e);
    process.exit(1);
})


