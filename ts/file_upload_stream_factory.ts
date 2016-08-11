import * as busboyPipe from './busboy_pipe';
import * as express from 'express';
import * as fs from 'fs';

export interface FilePathMaker {
    (params: busboyPipe.FilePipeParams): string
}

export interface Options {
    filePathMaker: FilePathMaker;
}

export function get(options: Options) : busboyPipe.WriteStreamFactory {
    return ((params: busboyPipe.FilePipeParams) : busboyPipe.WriteStreamInfo => {
        let filePath = options.filePathMaker(params);
        let ws = fs.createWriteStream(filePath);
        return {stream: ws, streamInfo: {filePath: filePath}};
    });
}
