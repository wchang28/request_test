import * as busboyPipe from './busboy_pipe';
import * as express from 'express';
import * as fs from 'fs';

export interface FilePathMaker {
    (fileInfo: busboyPipe.FileInfo, req: express.Request): string
}

export interface Options {
    filePathMaker: FilePathMaker;
}

export function get(options: Options) : busboyPipe.Options {
    let opt: busboyPipe.Options = {
        createWriteStream: (fileInfo: busboyPipe.FileInfo, req: express.Request) : busboyPipe.WriteStreamInfo => {
            let filePath = options.filePathMaker(fileInfo, req);
            let ws = fs.createWriteStream(filePath);
            return {stream: ws, info: {filePath: filePath}};
        }
    };
    return opt;
}
