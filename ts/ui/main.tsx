import * as React from 'react';
import * as ReactDOM from 'react-dom';

let url = '/upload';

interface FilesUploadTestProps {
    message: string;
}

class FilesUploadTestApp extends React.Component<FilesUploadTestProps, any> {
    constructor(props:FilesUploadTestProps) {
        super(props);
    }
    /*
    uploadFiles(e:any) {
        let x: any = this.refs["file"];
        //console.log('x = ' + x.toString());
        let files = x.files;
        let file = files[0];
        
        let options:any = {
            url:url
            ,headers: {'x-my-header': 'wen chang'}
        };

        let r = request.post(options, (err, httpResponse, body) => {
            console.log(body);
        })
        console.log("typeof r.form=" + typeof r.form);
        let form = r.form();
        console.log("typeof form=" + typeof form);
        form.append('FirstName', 'Wen');
        form.append('LastName', 'Chang');
        form.append("Myfile", file, file.name);
        console.log("typeof form.pipe=" + typeof form.pipe);

        e.preventDefault();
    }
    */
    uploadFiles(e:any) {
        let x: any = this.refs["file"];
        //console.log('x = ' + x.toString());
        let files = x.files;
                
        let options:any = {
            url:url
            ,headers: {'x-my-header': '<<**********wen chang************>>'}
        };

        let formData = new FormData();
        formData.append('FirstName', 'Wen');
        formData.append('LastName', 'Chang');
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            formData.append("Myfile[]", file, file.name);
        }

        ////////////////////////////////////////////////////////////////////////////////////
        let xhr = new XMLHttpRequest();
        xhr.open('POST', options.url, true);
        for (let f in options.headers)
            xhr.setRequestHeader(f, options.headers[f]);
        // Set up a handler for when the request finishes.
        xhr.onload =  () => {
            if (xhr.status === 200) {
                let ret = JSON.parse(xhr.responseText);
                console.log(JSON.stringify(ret));
            } else {
                alert('An error occurred!');
            }
        };
        xhr.send(formData);
        ////////////////////////////////////////////////////////////////////////////////////
        
        e.preventDefault();
    } 
    render() {
        return (
            <div>                
               <form ref="uploadForm" encType="multipart/form-data "method="POST" >
                   <input ref="file" type="file" name="file" multiple={true}/>
                   <input type="button" ref="button" value="Upload" onClick={this.uploadFiles.bind(this)} />
               </form>                
            </div>
        );
    }
}

ReactDOM.render(<FilesUploadTestApp message={'Hello World :-)'}/>, document.getElementById('test'));
