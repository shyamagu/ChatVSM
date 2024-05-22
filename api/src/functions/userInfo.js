const { app } = require('@azure/functions');

app.http('userInfo', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'userInfo',
    handler: async (request, context) => {

        let json_decoded = {test:"test"}
        const header = request.headers.get('x-ms-client-principal');
        if(header){
            const encoded = Buffer.from(header, 'base64');
            const decoded = encoded.toString('ascii');
            json_decoded = JSON.parse(decoded);
    
            context.log(json_decoded);
        }

        return { 
            body: JSON.stringify(json_decoded)
        };
    }
});
