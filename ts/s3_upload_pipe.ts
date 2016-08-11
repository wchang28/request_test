import * as busboyPipe from './busboy_pipe';
import * as express from 'express';
import {S3} from 'aws-sdk';
import * as _ from 'lodash';
import * as stream from 'stream';

let s3Stream = require('s3-upload-stream')(new S3());

export interface KeyMaker {
    (fileInfo: busboyPipe.FileInfo, req: express.Request) : string
}

export interface Options {
    Bucket: string;
    KeyMaker: KeyMaker;
    additonalS3Options?: any
}

export function get(options: Options) : busboyPipe.Options {
    let opt: busboyPipe.Options = {
        createWriteStream: (fileInfo: busboyPipe.FileInfo, req: express.Request) : busboyPipe.WriteStreamInfo => {
            let params: any = {
                "Bucket": options.Bucket,
                "Key": options.KeyMaker(fileInfo, req)
            };
            if (options.additonalS3Options) params = _.assignIn(params, options.additonalS3Options);
            let upload: stream.Writable = s3Stream.upload(params);
            upload.on('uploaded', (details:any) => {
                upload.emit('close');
            });
            return {stream: upload, info: params};
        }
    };
    return opt;
}