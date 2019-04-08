const http = require('http');
const https = require('https');
const os = require('os');
const fs = require('fs');

const sleep = async (ms) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, ms);
	});
};


var Apollo = {
	basePath: '',
	appId: '',
	clusterName: '',
	namespaces: [],
	cachePath: '',

	data: new Map(),

	nextNotifications: [],
	
	setOptions: function(options) {
		//set options
		this.basePath = options.basePath || '';
		this.appId = options.appId || '';
		this.clusterName = options.clusterName || 'default';
		this.namespaces = options.namespaces || ['application'];
		this.cachePath = options.cachePath || os.tmpdir() + '/apollo_cache';
	},

	get: function(key, namespaceName = '') {
		if (!namespaceName) {
			namespaceName = 'application';
		}
		let dataJSON = this.data.get(namespaceName);
		return dataJSON ? dataJSON[key] : undefined;
	},

	getAll: function(namespaceName = '') {
		if (!namespaceName) {
			namespaceName = 'application';
		}
		return this.data.get(namespaceName);
	},

	init: async function(options) {
		this.setOptions(options);

		try {
			for (let namespaceName of this.namespaces) {
				let config = await this.getConfig(namespaceName, '');
				this.writeCacheFile(namespaceName, config);
				this.loadConfig(config);
			}
		} catch (err) {
			this.loadLastCache();
			console.log(err);
		}
	},

	watch: async function() {
		this.loadLastCache();

		while (true) {
			try {
				let result = await this.getNotifications(this.nextNotifications);
				if (result) {
					let notifications = JSON.parse(result);
					if (notifications) {
						let nextNotifications = [];
						for (let index in notifications) {
							let namespaceName = notifications[index].namespaceName;
							let notificationId = notifications[index].notificationId;
							nextNotifications.push({
								namespaceName: namespaceName,
								notificationId: notificationId,
							});
							let config = await this.getConfig(namespaceName, '');
							this.writeCacheFile(namespaceName, config);
							this.loadConfig(config);
							console.log(config);
						}
						this.nextNotifications = nextNotifications;
					}
				}
			} catch (err) {
				console.log(err);
				await sleep(10000);
			}
		}
	},

	loadLastCache: function() {
		//load last time cache file
		try {
			let filenames = [];
			const dirents = fs.readdirSync(this.cachePath, { withFileTypes: true });
			if (dirents.length) {
				for (let index in dirents) {
					let dirent = dirents[index];
					if (dirent.isFile()) {
						filenames.push(this.cachePath + '/' + dirent.name);
					}
				}
			}
			if (filenames.length) {
				for (let index in filenames) {
					let filename = filenames[index];
					try {
						let data = fs.readFileSync(filename);
						this.loadConfig(data);
					} catch (readFileError) {
						console.log(readFileError);
					}
				}
			}
		} catch (fsErr) {
			console.log(fsErr);
		}
	},

	writeCacheFile: function(namespaceName, config) {
		//write cache file
		let isDirectory = false;
		try {
			isDirectory = fs.statSync(this.cachePath).isDirectory();
		} catch (fsErr) {
			if (fsErr.code !== 'ENOENT') {
				throw fsErr;
			}
		}
		if (!isDirectory) {
			fs.mkdirSync(this.cachePath, { recursive: true });	
		}
		let configFilename = `${this.cachePath}/${namespaceName}`;
		fs.writeFileSync(configFilename, config);
	},

	loadLocalConfig: function(cachePath = '') {
		if (!cachePath) {
			cachePath = os.tmpdir() + '/apollo_cache';
		}
		this.cachePath = cachePath;
		this.loadLastCache();
	},

	loadConfig: function(config) {
		let configJSON;
		try {
			configJSON = JSON.parse(config);
		} catch (err) {
			console.log(err);
			return false;
		}
		if (configJSON.namespaceName === undefined || configJSON.configurations === undefined) {
			return false;
		}
		let key = configJSON.namespaceName;
		let dataJSON = configJSON.configurations;
		this.data.set(key, dataJSON)
		return true;
	},

	getConfig: async function(namespaceName, clientIp) {
		let basePath = this.basePath;
		let appId = this.appId;
		let clusterName = this.clusterName;
		let url = `${basePath}/configs/${appId}/${clusterName}/${namespaceName}?ip=${clientIp}`;
		let options = {
			timeout: 3000,
		};
		return this.httpGet(url, options);
	},

	getNotifications: async function(notifications = []) {
		let basePath = this.basePath;
		let appId = this.appId;
		let clusterName = this.clusterName;
		let namespaces = this.namespaces;
		if (!notifications || !notifications.length) {
			for (let i in namespaces) {
				notifications.push({
					namespaceName: namespaces[i],
					notificationId: -1,
				});
			}
		}
		let notificationStr = JSON.stringify(notifications);
		notificationStr = encodeURIComponent(notificationStr);
		let url = `${basePath}/notifications/v2?appId=${appId}&cluster=${clusterName}&notifications=${notificationStr}`;
		let options = {
			timeout: 61000,
		};
		return this.httpGet(url, options);
	},

	httpGet: async function(url, options) {
		return new Promise((resolve, reject) => {
			const client = url.substr(0, 5) === 'https' ? https: http;
			client.get(url, options, res => {
				const { statusCode } = res;
				let chunks = [];
				if (statusCode === 304) {
					resolve('');
				} else {
					res.on('data', chunk => {
						chunks.push(chunk);
					});
					res.on('end', () => {
						const data = Buffer.concat(chunks).toString();
						if (statusCode === 200) {
							resolve(data);	
						} else {
							reject(new Error(`code: ${statusCode}, message: ${data}`))
						}
					});
					res.on('error', err => {
						reject(err);
					});
				}
			}).on('error', err => {
				reject(err);
			});
		});
	},
};

module.exports = {
	get: Apollo.get.bind(Apollo),
	getAll: Apollo.getAll.bind(Apollo),
	setOptions: Apollo.setOptions.bind(Apollo),
	init: Apollo.init.bind(Apollo),
	watch: Apollo.watch.bind(Apollo),
	loadLocalConfig: Apollo.loadLocalConfig.bind(Apollo),
};
