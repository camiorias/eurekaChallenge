const express = require('express');
const axios = require('axios').default;
const md5 = require('md5');
const app = express();

const port = 3000;
const offset = 10;
const API_KEY_PUBLIC = '82b616c9f97d70934446ccf23aaf378c';
const API_KEY_PRIVATE = '3f584c8d82873c9bdefb4247262a5add8a23275e';

let favorites = [];

app.get('/characters', async(req, res) => {
	console.log('Characters requested');
	let data = await getCharacters();
	let characters = parseCharacters(data);
	res.send(characters);
});

app.get('/search_characters', async(req, res) => {
    console.log('Characters Search requested');
	let name = req.query.name;
	let data = await getCharacters(name);
	let characters = parseCharacters(data);
	res.send(characters);
});

app.get('/characters_paginate', async(req, res) => {
	console.log('Characters Paginate requested');
	let page = req.query.page;
	let data = await getCharacters(undefined, page);
	let characters = parseCharacters(data);
	res.send(characters);
});

app.post('/add_favorite', async(req, res) => {
	console.log('Adding to favorites');
	let name = req.query.name;
	if(await validateName(name) != false) {
		favorites.push(name);
		result = {
			'status': 'success'
		};
	} else {
		result = {
			'status': 'error',
			'message': 'that character doesn\'t exist'
		};
	}
	res.send(result);
});

app.get('/list_favorite', async(req, res) => {
    console.log('List of favorites');
	res.send({
		favorites: favorites
	});
});

app.delete('/remove_favorite', async(req, res) => {
	console.log('Removing favorite');
	let name = req.query.name;
	const index = favorites.indexOf(name);
	if(index > -1) {
		favorites.splice(index, 1);
	}
	res.send({
		favorites: favorites
	});
});

app.listen(port, () => {
	console.log(`Superhero app listening at http://localhost:${port}`)
})

async function getCharacters(name, page) {
	console.log('Requesting Characters from Marvel...');
	try {
		let params = getAuthParams();
		if(name != undefined) {
			params['nameStartsWith'] = name;
		}
		if(page != undefined) {
			params['limit'] = offset;
			params['offset'] = offset * page;
		}
		let response = await axios.get('https://gateway.marvel.com/v1/public/characters', {
			params: params,
		});
		console.log('Success Requesting Characters');
		return response.data.data.results;
	} catch(error) {
		console.log('Error Requestig Characters');
		return error;
	}
}

function getAuthParams() {
	current_date = new Date()
	ms = current_date.getMilliseconds();
	return {
		ts: ms,
		apikey: API_KEY_PUBLIC,
		hash: md5(ms + API_KEY_PRIVATE + API_KEY_PUBLIC)
	}
}

function parseCharacters(data) {
    console.log('Parsing Characters Data...');
	let characters = [];
	for(let i = 0; i < data.length; i++) {
		let character = data[i];
		characters.push({
			name: character.name,
			description: character.description,
			image: character.thumbnail.path,
		})
	}
	return characters;
}

async function validateName(name) {
	console.log('Validating Character Name...');
	if(name) {
		let data = await getCharacters(name);
		for(let i = 0; i < data.length; i++) {
			let character = data[i];
			if(character.name === name) {
				console.log('Valid Character Name');
				return true;
			}
		}
	}
	console.log('Invalid Character Name');
	return false;
}