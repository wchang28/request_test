import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as events from 'events';
import * as busboyPipe from './busboy_pipe';
import * as fileUploadStreamFactory from './file_upload_stream_factory';
import * as s3UploadStreamFactory from './s3_upload_stream_factory';

let app = express();

app.use('/', express.static(path.join(__dirname, '../public')));

let eventEmitter = new events.EventEmitter();
eventEmitter.on('begin', (params: busboyPipe.EventParamsBase) => {
    console.log('Piping started');
}).on('end', (params: busboyPipe.EventParamsBase) => {
    console.log('All done :-)');
}).on('total-files-count', (params: busboyPipe.FilesCountParams) => {
    console.log('number of files to pipe: ' + params.count);
});

let filePathMaker = (params: busboyPipe.FilePipeParams) : string => {
    return 'c:/upload/' + params.fileInfo.filename;
}

app.post('/upload', busboyPipe.get(fileUploadStreamFactory.get({filePathMaker}), eventEmitter), (req: express.Request, res: express.Response) => {
    let result:busboyPipe.Body = req.body;
    for (let field in result) {
        let value = result[field];
        console.log(field + ' ===> ' + JSON.stringify(value));
    }
    res.json(result);
});

let s3Options: s3UploadStreamFactory.Options = {
    "Bucket": 's3-fkh-tst'
    ,"KeyMaker": (params: busboyPipe.FilePipeParams): string => {
        return 'busboy_upload/' + params.fileInfo.filename;
    }
    ,"additonalS3Options": {
        "ACL": "public-read"
        ,"ServerSideEncryption": "AES256"
    }
}

app.post('/s3_upload', busboyPipe.get(s3UploadStreamFactory.get(s3Options), eventEmitter), (req: express.Request, res: express.Response) => {
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