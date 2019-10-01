const child_process = require('child_process');
const fs = require('fs');
const directoryPath = '../honeypot';

fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    const numchild = files.length;
    let done = 0;
    files.forEach(file => {
        let child = child_process.fork('./child');
        child.send(file);
        child.on("message", function (message) {
            console.log('[parent] Done: ', message);
            done++;
            if (done === numchild) {
                console.log('Received all results');
            }
        });
    });
});

