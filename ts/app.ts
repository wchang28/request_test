import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as events from 'events';
import * as busboyPipe from 'busboy-pipe';
import * as fileUploadStreamFactory from './file_upload_stream_factory';
import * as s3UploadStreamFactory from './s3_upload_stream_factory';

let appApi = express();
let appProxy = express();

appProxy.use('/', express.static(path.join(__dirname, '../public')));

import * as url from 'url';
import * as _ from 'lodash';
let apiyUrl:url.Url = url.parse('http://127.0.0.1:8081');
function ProxyRestApiMiddleware2(req: express.Request, res: express.Response) {
	let options:http.RequestOptions = {
		protocol: apiyUrl.protocol
		,hostname: apiyUrl.hostname
		,port: parseInt(apiyUrl.port)
		,method: req.method
		,path: '/services' + req.path
	};
	options.headers = _.assignIn(req.headers);
	delete options.headers['host'];
	/*
	if (req.headers['cache-control']) options.headers['cache-control']=req.headers['cache-control'];
	if (req.headers['accept']) options.headers['accept']=req.headers['accept'];
	if (req.headers['content-type']) options.headers['content-type']=req.headers['content-type'];
	if (req.headers['content-length']) options.headers['content-length']=req.headers['content-length'];
	options.headers['authorization'] = 'Bearer ' + bearerToken
	*/
	let connector = http.request(options, (resp: http.IncomingMessage) => {
        //console.log('resp.statusCode=' + resp.statusCode);
		res.writeHead(resp.statusCode, resp.statusMessage, resp.headers);
		resp.on('error', (err) => {}).pipe(res).on('error', (err) => {});
	});
    req.on('error', (err) => {}).pipe(connector).on('error', (err) => {});
    req.socket.on('close' ,() => {
        connector.abort();
    });
}

//appProxy.use('/services', ProxyRestApiMiddleware2);

import * as httpProxy from 'http-proxy';

function ProxyRestApiMiddleware3(req: express.Request, res: express.Response) {
    let proxy = httpProxy.createProxyServer();
    proxy.web(req, res, { target: 'http://127.0.0.1:8081/services' });
    proxy.on('error', (err:any) => {
        console.log('proxy error: ' + JSON.stringify(err));
        res.status(500).jsonp({'error': 'server internal error'});
    });
    proxy.on('proxyReq', (proxyReq:http.ClientRequest, req: express.Request, res: express.Response, options: httpProxy.ServerOptions) => {
        console.log('proxyReq()');
        //proxyReq.setHeader('authorization', 'Bearer ' + bearerToken);
        proxyReq.removeHeader('host');
    });
    proxy.on('proxyRes', (proxyRes:http.IncomingMessage, req: express.Request, res: express.Response) => {
        console.log('proxyRes()');
    });
}

appProxy.use('/services', ProxyRestApiMiddleware3);

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

appApi.use('*', (req: express.Request, res: express.Response) => {
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