const { app } = require('@azure/functions');
const { json } = require('@sveltejs/kit');

app.http('user', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'user',
    handler: async (request, context) => {

        const header = request.headers.get('x-ms-client-principal');
        const encoded = Buffer.from(header, 'base64');
        const decoded = encoded.toString('ascii');
        const json_decoded = JSON.parse(decoded);

        context.log(json_decoded);

        return { 
            body: JSON.stringify(json_decoded)
        };
    }
});
