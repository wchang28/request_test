import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as events from 'events';
import * as busboyPipe from 'busboy-pipe';
import * as fileUploadStreamFactory from './file_upload_stream_factory';
import * as s3UploadStreamFactory from './s3_upload_stream_factory';

let appApi = express();
let appProxy = express();

let requestLogger = (req: express.Request, res: express.Response, next: express.NextFunction) => {
	console.log('**********************************************************************');
	let req_address = req.connection.remoteAddress;
	console.log('incoming request from ' + req_address + ', path='+ req.path);
	console.log('headers: ' + JSON.stringify(req.headers));
	console.log('**********************************************************************');
	next();
};

appApi.use(requestLogger);

appProxy.use('/', express.static(path.join(__dirname, '../public')));

import * as httpProxy from 'http-proxy';

function ApiProxyMiddleware(req: express.Request, res: express.Response) {
    let proxy = httpProxy.createProxyServer();
    let options: httpProxy.ServerOptions = {
         target: 'http://127.0.0.1:8081/services'
         ,changeOrigin: true    // change the 'host' header field to target host
    };
    proxy.web(req, res, options);
    proxy.on('error', (err:any, req: express.Request, res:express.Response) => {
        console.log('proxy error: ' + JSON.stringify(err));
        res.status(500).jsonp({'error': 'internal server error'});
    });
    proxy.on('proxyReq', (proxyReq:http.ClientRequest, req: express.Request, res: express.Response, options: httpProxy.ServerOptions) => {
        //console.log('proxyReq()');
        //proxyReq.setHeader('authorization', 'Bearer ' + bearerToken);
    });
    proxy.on('proxyRes', (proxyRes:http.IncomingMessage, req: express.Request, res: express.Response) => {
        //console.log('proxyRes()');
    });
}

appProxy.use('/services', ApiProxyMiddleware);

/*
appApi.use('/services/upload', (req: express.Request, res: express.Response) => {
    req.on('data', (data) => {});
    req.on("end" ,() => {
        res.status(401).json({err: 'not authorized'});
    });
});
*/

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

appApi.post('/services/upload/file_upload', busboyPipe.get(fileUploadStreamFactory.get({filePathMaker}), {eventEmitter}), (req: express.Request, res: express.Response) => {
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

appApi.post('/services/upload/s3_upload', busboyPipe.get(s3UploadStreamFactory.get(s3Options), {eventEmitter}), (req: express.Request, res: express.Response) => {
    let result:busboyPipe.Body = req.body;
    for (let field in result) {
        let value = result[field];
        console.log(field + ' ===> ' + JSON.stringify(value));
    }
    res.json(result);
});

appApi.use((req: express.Request, res: express.Response) => {
    req.on('data', (data) => {});
    req.on("end" ,() => {
        res.status(400).json({err: 'bad request'});
    });
});

let secure_http:boolean = false;
let apiServer: http.Server = http.createServer(appApi);

apiServer.listen(8081, "127.0.0.1", () => {
	let host = apiServer.address().address; 
	let port = apiServer.address().port; 
	console.log('Api server listening at %s://%s:%s', (secure_http ? 'https' : 'http'), host, port);   

	let proxyServer: http.Server = http.createServer(appProxy);

	proxyServer.listen(8080, "127.0.0.1", () => {
		let host = proxyServer.address().address; 
		let port = proxyServer.address().port; 
		console.log('Proxy server listening at %s://%s:%s', (secure_http ? 'https' : 'http'), host, port);   
	});
});