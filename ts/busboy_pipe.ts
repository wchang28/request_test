let Busboy = require('busboy');
import * as express from 'express';
import * as stream from 'stream';
import * as events from 'events';

export interface FileInfo {
	length: number;

	filename?: string;
	encoding?: string;
	mimetype?: string;

	err?: any;
	streamInfo?: any;
}

export interface WriteStreamInfo {
	stream: stream.Writable;
	streamInfo?: any;
}

export interface Body {
	[field:string]: string | FileInfo[]
}

export interface EventParamsBase {
	req: express.Request
}

export interface FilePipeParams extends EventParamsBase {
	fileInfo: FileInfo;
}

export interface FilesCountParams extends EventParamsBase {
	count: number;
}

export interface WriteStreamFactory {
	(params: FilePipeParams) : WriteStreamInfo
}

export interface BusboyPipeRequestHandler extends express.RequestHandler {
	eventEmitter: events.EventEmitter;
}

export function get(writeStreamFactory: WriteStreamFactory) : BusboyPipeRequestHandler {
	let eventEmitter = new events.EventEmitter();
	let handler = (req: express.Request, res:express.Response, next: express.NextFunction) => {
		let contentType = req.headers['content-type'];
		if (req.method.toLowerCase() === 'post' && contentType && contentType.match(/multipart\/form-data/)){
			eventEmitter.emit('begin-pipping', {req});
			let num_files_piped = 0;
			let num_files_total:number = null;
			let counter:number = 0;
			req.body = {};
			let busboy = new Busboy({ headers: req.headers });
			busboy.on('file', (fieldname:string, file:stream.Readable, filename?:string, encoding?:string, mimetype?:string) => {
				//console.log('File {' + fieldname + '}: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
				let fileInfo:FileInfo = {filename: filename, encoding: encoding, mimetype: mimetype, length:0};
				if (!req.body[fieldname]) req.body[fieldname] = [];
				req.body[fieldname].push(fileInfo);
				counter++;
				let ret = writeStreamFactory({req, fileInfo});
				let writeStream = ret.stream;
				if (ret.streamInfo) fileInfo.streamInfo = ret.streamInfo;
				let pipeDone = (err: any) => {
					if (err) fileInfo.err = err;
					eventEmitter.emit('file-piped', {req, fileInfo});
					num_files_piped++;
					if (typeof num_files_total === 'number' && num_files_total === num_files_piped) {
						eventEmitter.emit('end-pipping', {req});
						next();
					}					
				}
				file.on('data', (data: Buffer) => {
					fileInfo.length += data.length;
					eventEmitter.emit('file-data-rcvd', {req, fileInfo});
				});
				writeStream.on('close', () => {
					pipeDone(null);
				});
				file.on('error', pipeDone).pipe(writeStream).on('error', pipeDone);
			});
			busboy.on('field', (fieldname:string, val:string, fieldnameTruncated, valTruncated, encoding, mimetype) => {
				req.body[fieldname] = val;
			});
			busboy.on('finish', () => {
				num_files_total = counter;
				eventEmitter.emit('total-files-count', {req, count: num_files_total});
			});
			req.pipe(busboy);
		} else
			next();
	};
	let ret:BusboyPipeRequestHandler = <BusboyPipeRequestHandler>handler;
	ret.eventEmitter = eventEmitter;
	return ret;
}