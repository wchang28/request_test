import * as busboyPipe from 'busboy-pipe';
import * as express from 'express';
import {S3} from 'aws-sdk';
import * as _ from 'lodash';
import * as stream from 'stream';

let s3Stream = require('s3-upload-stream')(new S3());

export interface KeyMaker {
    (params: busboyPipe.FilePipeParams) : string
}

export interface Options {
    Bucket: string;
    KeyMaker: KeyMaker;
    additonalS3Options?: any
}

export function get(options: Options) : busboyPipe.WriteStreamFactory {
    return ((params: busboyPipe.FilePipeParams) : busboyPipe.WriteStreamInfo => {
        let s3Params: any = {
            "Bucket": options.Bucket,
            "Key": options.KeyMaker(params)
        };
        if (options.additonalS3Options) s3Params = _.assignIn(s3Params, options.additonalS3Options);
        let upload: stream.Writable = s3Stream.upload(s3Params);
        upload.on('uploaded', (details:any) => {
            upload.emit('close');
        });
        return {stream: upload, streamInfo: s3Params};
    });
}