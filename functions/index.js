const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const firestore = admin.firestore();
const position = firestore.collection("position");
const user = firestore.collection("User");

var tabPos = []; //Le tableau contenant toutes les Positions Contaminées

async function getIds(userId){
	var ids = [];
	await position.where("userId", "==", userId).get().then((values) => {
		if (values.size>0){
			values.forEach(value => {
				ids.push(value.id);
			});
		}
		return true;
	});
	return ids;
}
async function updatePos(idsPos, auto){
	idsPos.forEach(async id => {
		await position.doc(id).update({
			"autorisation": (auto === "true")? true : false
		})
		.then(() =>{
			return console.log("Document successfully updated!");
		});
		
	});
}
async function getValues (currentLat, currentLong, inter) {
	var latituesId = [];

	await position
		.where("lat","<", currentLat+inter)
		.where("lat", ">", currentLat-inter)
		.where("autorisation", "==", true)
		.get().then((values)=>{
			values.forEach(doc =>{
				console.log("L'ID est : : : : : ", doc.id);
				latituesId.push(doc.id);
			})
			return latituesId;
		});
	await position
		.where("long", "<", currentLong+inter)
		.where("long", ">", currentLong-inter)
		.where("autorisation", "==", true)
		.get().then(values =>{
		values.forEach(doc => {
			if (latituesId.indexOf(doc.id) !== -1) {
				console.log("L'ID est : : : : : ", doc.id);
				tabPos.push(doc.data());
			}
		});
		return tabPos;
	});
	return tabPos;
		
}
async function deleteOldData(){

}
//Envoyer les positions contaminees
exports.sendPos = functions.https.onCall(async (data, context) => {
	await getValues(data.lat, data.long, data.interval);

    return tabPos;
});

exports.sendPosReq = functions.https.onRequest(async (request, response) => {
	await getValues(14, -16, 3);

    return response.send(JSON.stringify(tabPos));
});

exports.changeState = functions.https.onCall(async (data, context) =>{
	var idsPos = [];
	var id_du_user;
	await user.where("tel", "==", data.tel).get().then(values =>{
		values.forEach(value => {
			console.log("L'ID est  ::::: ", value.id);
			id_du_user = value.id;
		});
		return id_du_user;
	})

	console.log("Id successfully got! :: ", id_du_user);
	
	idsPos = await getIds(id_du_user);
	await updatePos(idsPos, data.etat);
	return idsPos;
});

exports.sendRealDate = functions.https.onCall((data, context) =>{
	var date = new Date(data.millisec);
	return date.toString;
});