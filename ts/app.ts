import * as express from 'express';
import * as http from 'http';
import * as path from 'path';

let app = express();

app.use('/', express.static(path.join(__dirname, '../public')));

app.post('/upload', (req: express.Request, res: express.Response) => {
    console.log('headers:');
    console.log('===============================================');
    console.log(JSON.stringify(req.headers));
    console.log('===============================================');
    console.log('');
    //req.setEncoding('utf8');
    let bytes = 0;
    req.on('data', (data: Buffer) => {
        bytes += data.length;
        //process.stdout.write(data.toString());
        ////console.log("typeof data = " + data.constructor);
        //console.log("length = " + data.length.toString());
        //console.log(data);
    })
    req.on('end', () => {
        res.json({bytes});
    });
});

let secure_http:boolean = false;
let server: http.Server = http.createServer(app);

server.listen(8080, "127.0.0.1", () => {
	let host = server.address().address; 
	let port = server.address().port; 
	console.log('application listening at %s://%s:%s', (secure_http ? 'https' : 'http'), host, port);    
});