const apollo = require('../lib/apollo');


(async ()=> {
	await apollo.init({
		basePath: 'https://apollo-config-dev.example.com',
		appId: 'app-id-xxx',
		clusterName: 'default',
		namespaces: ['application'],
	});
	apollo.watch();

	setInterval(() => {
		console.log(apollo.getAll());
	}, 3000);
})();

