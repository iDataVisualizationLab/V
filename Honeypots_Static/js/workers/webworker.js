class WorkerPool{
    constructor(fileName, onResult, maxWorkers){
        this.fileName = fileName;
        this.onResult = onResult;
        this.maxWorkers = maxWorkers;
        this.workers = new Array(this.maxWorkers);
    };
    startWorker(data, index){
        if(typeof (Worker) !== 'undefined'){
            const workerIndex = index%this.maxWorkers;
            let w = this.workers[workerIndex];
            if(w===undefined){
                w = this.workers[workerIndex] = new Worker(this.fileName);
                w.onmessage = this.onResult;
            }
            w.postMessage(data);
        }else{
            throw 'The browser does not support web worker';
        }
    }
    postMessage(data, index){
        const workerIndex = index%this.maxWorkers;
        let w = this.workers[workerIndex];
        w.postMessage(data);
    }
    resetWorkers(){
        this.workers.forEach(w=>{
            if(w!==undefined){
                w.terminate();
            }
        });
        this.workers = new Array(this.maxWorkers);
    }
}