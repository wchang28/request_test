let Busboy = require('busboy');
import * as express from 'express';
import * as stream from 'stream';

export interface FileInfo {
	length: number;

	filename?: string;
	encoding?: string;
	mimetype?: string;

	err?: any;
	info?: any;
}

export interface WriteStreamInfo {
	stream: stream.Writable;
	info?: any;
}

export interface Options {
	createWriteStream: (fileInfo: FileInfo) => WriteStreamInfo;
}

export interface Body {
	[field:string]: string | FileInfo[]
}

export function get(options: Options) {
	return ((req: express.Request, res:express.Response, next: express.NextFunction) => {
		let contentType = req.headers['content-type'];
		if (req.method.toLowerCase() === 'post' && contentType && contentType.match(/multipart\/form-data/)){
			let num_files_piped = 0;
			let num_files_total:number = null;
			let counter:number = 0;
			req.body = {};
			let busboy = new Busboy({ headers: req.headers });
			busboy.on('file', (fieldname:string, file:stream.Readable, filename?:string, encoding?:string, mimetype?:string) => {
				// file is a readable stream
				//console.log('File {' + fieldname + '}: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
				let fileInfo:FileInfo = {filename: filename, encoding: encoding, mimetype: mimetype, length:0};
				if (!req.body[fieldname]) req.body[fieldname]=[];
				req.body[fieldname].push(fileInfo);
				counter++;
				let ret = options.createWriteStream(fileInfo);
				let writeStream = ret.stream;
				if (ret.info) fileInfo.info = ret.info;
				function pipeDone(err) {
					if (err) fileInfo.err = err;
					num_files_piped++;
					if (typeof num_files_total === 'number' && num_files_total === num_files_piped) {
						//console.log('All files piped');
						next();
					}					
				}
				file.on('data', (data: Buffer) => {
					fileInfo.length += data.length;
				});
				writeStream.on('close', () => {pipeDone(null);});
				file.on('error', pipeDone).pipe(writeStream).on('error', pipeDone);
			});
			busboy.on('field', (fieldname:string, val:string, fieldnameTruncated, valTruncated, encoding, mimetype) => {
				req.body[fieldname] = val;
			});
			busboy.on('finish', () => {
				//console.log('finish(): ' + counter);
				num_files_total = counter;
			});
			req.pipe(busboy);
		} else
			next();
	});
}