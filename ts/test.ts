import * as FormDataConstructor from 'form-data';
import * as request from 'request';
import {IncomingMessage} from 'http';
import * as _ from 'lodash';
import * as fs from 'fs';

let url = 'http://127.0.0.1:8080/upload';

//let formData = new FormDataConstructor();
//formData.append('FirstName', 'Wen');
//formData.append('LastName', 'Chang');
//formData.append("Myfile", fs.createReadStream('C:/Users/wchang/Desktop/node-grid-4.zip'), 'node-grid-4.zip');
//form.append("Myfile", fs.createReadStream('C:/Users/wchang/Desktop/signedcorrected 4506-T.pdf'), 'signedcorrected 4506-T.pdf');
//form.append("Myfile", fs.createReadStream('C:/Users/wchang/Desktop/polaris.txt'), 'polaris.txt');

/*
let options:any = {
    url: url
    ,headers: _.assignIn({}, {'User-Agent': 'request'}, formData.getHeaders())
    ,rejectUnauthorized: false
};
*/

//console.log(JSON.stringify(options));
/*
formData.pipe(request.post(options, (error: any, response: IncomingMessage, body: any) => {
    if (error)
        console.error('!!! Error: ' + JSON.stringify(error));
    else {
        if (!body) {
            response.on('data', (data:any) => {
                console.log('data()');
            });
            response.on("end", () => {
                console.log('All Done');
            });
        } else
            console.log(body);
    }
}));
*/

/*
let options = {
    host: '127.0.0.1'
    ,port: 49754
    ,path: '/upload'
    ,headers: {
        'User-Agent': 'request'
    }
    ,rejectUnauthorized:false
}

form.submit(options, (err:Error, response:any) =>{

})
*/

let options:any = {
    url: url
    ,headers: {'x-my-header': '<<**********wen chang************>>'}
    ,rejectUnauthorized: false
};

let r = request.post(options, (err, httpResponse, body) => {
    console.log(body);
})
let form = r.form();
form.append('FirstName', 'Wen');
form.append('LastName', 'Chang');
form.append("Myfile[]", fs.createReadStream('C:/Users/wchang/Desktop/node-grid-4.zip'), 'node-grid-4.zip');
form.append("Myfile[]", fs.createReadStream('C:/Users/wchang/Desktop/signedcorrected 4506-T.pdf'), 'signedcorrected 4506-T.pdf');
form.append("Myfile[]", fs.createReadStream('C:/Users/wchang/Desktop/polaris.txt'), 'polaris.txt');