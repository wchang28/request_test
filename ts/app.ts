import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as busboyPipe from './busboy_pipe';
import * as fs from 'fs';

let app = express();

let fileUploadHomePath = 'c:/upload';

function getFileUploadBusboyPipeOptions(fileUploadHomePath:string) : busboyPipe.Options {
    let options: busboyPipe.Options = {
        createWriteStream: (fileInfo: busboyPipe.FileInfo) : busboyPipe.WriteStreamInfo => {
            let filePath = fileUploadHomePath + '/' + fileInfo.filename;
            let ws = fs.createWriteStream(filePath);
            return {stream: ws, info: {filePath: filePath}};
        }
    };
    return options;
}

app.use('/', express.static(path.join(__dirname, '../public')));

/*
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
*/

app.post('/upload', busboyPipe.get(getFileUploadBusboyPipeOptions(fileUploadHomePath)), (req: express.Request, res: express.Response) => {
    let result:busboyPipe.Body = req.body;
    for (let field in result) {
        let value = result[field];
        console.log(field + ' ===> ' + JSON.stringify(value));
    }
    res.json(result);
});

let secure_http:boolean = false;
let server: http.Server = http.createServer(app);

server.listen(8080, "127.0.0.1", () => {
	let host = server.address().address; 
	let port = server.address().port; 
	console.log('application listening at %s://%s:%s', (secure_http ? 'https' : 'http'), host, port);    
});