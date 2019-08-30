importScripts('../../lib/d3.js', '../dataProcessing.js');

onmessage = function (e) {
    let fileInfo = extractInfoFromImgFile(e.data.fileName),
    dataFile = fileInfo.dayFile, day = fileInfo.dayStr, hour = fileInfo.hour;
    let fileName = '../../data/honeypot/' + dataFile;
    d3.text(fileName).then(rawData => {
        let cols = ["duration", "service", "source_bytes", "destination_bytes", "count", "same_srv_rate", "serror_rate", "srv_serror_rate", "dst_host_count",
            "dst_host_srv_count", "dst_host_same_src_port_rate", "dst_host_serror_rate", "dst_host_srv_serror_rate", "flag", "ids_detection", "malware_detection",
            "ashula_detection", "label", "source_ip_address", "source_port_number", "destination_ip_address", "destination_port_number", "start_time", "protocol"];
        rawData = d3.tsvParseRows(rawData);
        //TODO: May filter data from here to make things faster.
        rawData = rawData.map(d => {
            let item = {};
            cols.forEach((col, i) => {
                item[col] = d[i];
                if (col === "start_time") item[col] = new Date(day + ' ' + item[col]);
            });
            return item;
        });
        const COL_TIME = 'start_time',
            COL_LINK_TYPE = 'label',
            COL_SOURCE_ADDRESS = "source_ip_address",
            COL_DESTINATION_ADDRESS = "destination_ip_address";

        function readData() {
            let minTime = new Date(`${day} ${hour}:00:00`);
            let maxTime = new Date(minTime.getTime() + 1000 * 60 * 60);
            let data = rawData.filter(d => d[COL_TIME] <= maxTime && d[COL_TIME] >= minTime);
            if (data.length > 0) {
                let {nodes, links, timedNodes, timedLinks} = getLinksGroupedByFanInOut(data, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, [COL_LINK_TYPE], COL_TIME);
                debugger;
                postMessage({nodes: nodes, links: links, timedNodes: timedNodes, timedLinks: timedLinks});
            }
        }

        readData();
    });
};

function extractInfoFromImgFile(fileName) {
    fileName = fileName.split('.')[0];
    let year = fileName.slice(0, 4);
    let month = fileName.slice(4, 6);
    let day = fileName.slice(6, 8);
    let dayStr = `${year}-${month}-${day}`;
    let hour = fileName.slice(8, fileName.length);
    let dayFile = fileName.slice(0, 8) + ".txt";
    return {dayFile: dayFile, dayStr: dayStr, hour: hour};
}