// Dependencies
const { logger } = require('../utils'),
	chalk = require('chalk'),
	fetch = require('node-fetch'),
	Discord = require('discord.js');

module.exports.run = async (config) => {
	// This will check if the config is correct
	logger.log('=-=-=-=-=-=-=- Config file Verification -=-=-=-=-=-=-=');
	logger.log('Verifying config..');

	// Make sure Node.js V12 or higher is being ran.
	if (process.version.slice(1).split('.')[0] < 16) {
		logger.error('Node 16 or higher is required.');
		return true;
	}

	// check owner ID array
	if (config.ownerID) {
		// validate owner ID's
		for (const owner of config.ownerID) {
			if (isNaN(owner)) {
				logger.error(`${chalk.red('✗')} ownerID: ${owner} is invalid.`);
				return true;
			}
		}
	} else {
		logger.error(`${chalk.red('✗')} Bot ownerID array is missing.`);
		return true;
	}

	// check token
	if (!config.token) {
		logger.error(`${chalk.red('✗')} Bot token is missing.`);
		return true;
	} else {
		const client = new Discord.Client({ intents: ['GUILD_MEMBERS'] });
		await client.login(config.token).catch(e => {
			if (e.message == 'An invalid token was provided.') {
				logger.error(`${chalk.red('✗')} Bot token is incorrect.`);
				return true;
			} else if (e.message == 'Privileged intent provided is not enabled or whitelisted.') {
				logger.error(`${chalk.red('✗')} You need to enable privileged intents on the discord developer page.`);
				return true;
			}
		});
	}


	// Check Amethyste API
	if (!config.api_keys.amethyste) {
		logger.log(`${chalk.red('✗')} Amethyste API key is missing.`);
	} else {
		const res = await fetch('https://v1.api.amethyste.moe/generate/blurple', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${config.api_keys.amethyste}`,
			},
		});
		const result = await res.json();
		if (result.status === 401) {
			logger.log(`${chalk.red('✗')} Invalid Amethyste API key.`);
			return true;
		}
	}

	// Check support server set up
	if (!config.SupportServer) {
		logger.error(`${chalk.red('✗')} Support server setup is missing.`);
	}

	// Check mongodb connection
	if (!config.MongoDBURl) {
		logger.error(`${chalk.red('✗')} MongoDB URl is missing.`);
		return true;
	} else {
		const mongoose = require('mongoose');
		await mongoose.connect(config.MongoDBURl, { useUnifiedTopology: true, useNewUrlParser: true }).catch((err) => {
			console.log(err);
			logger.error(`${chalk.red('✗')} Unable to connect to database.`);
			return true;
		});
	}

	// check spotify credentials
	if (config.api_keys.spotify.iD && config.api_keys.spotify.secret) {
		const { data: { access_token } } = await require('axios').post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
			headers: {
				Authorization: `Basic ${Buffer.from(`${config.api_keys.spotify.iD}:${config.api_keys.spotify.secret}`).toString('base64')}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});
		if (!access_token) {
			logger.error(`${chalk.red('✗')} Incorrect spotify credentials.`);
			return true;
		}
	} else {
		logger.error(`${chalk.red('✗')} Spotify credentials are missing.`);
	}
};
