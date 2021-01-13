importScripts('../../lib/d3.js', '../dataProcessing.js');

onmessage = function (e) {
    let day = 'Apr 01, 2014 ';
    let interval = 5 * 1000;
    let fileName = '../../data/honeypot/20110401.txt';
    let duration = 60 * 60 * 1000;
    let step = 60;
    d3.text(fileName).then(rawData => {

        let cols = ["duration", "service", "source_bytes", "destination_bytes", "count", "same_srv_rate", "serror_rate", "srv_serror_rate", "dst_host_count",
            "dst_host_srv_count", "dst_host_same_src_port_rate", "dst_host_serror_rate", "dst_host_srv_serror_rate", "flag", "ids_detection", "malware_detection",
            "ashula_detection", "label", "source_ip_address", "source_port_number", "destination_ip_address", "destination_port_number", "start_time", "protocol"];
        rawData = d3.tsvParseRows(rawData);
        rawData = rawData.map(d => {
            let item = {};
            cols.forEach((col, i) => {
                item[col] = d[i];
                if (col === "start_time") item[col] = new Date(day + item[col]);
            });
            return item;
        });
        const COL_TIME = 'start_time',
            COL_LINK_TYPE = 'label',
            COL_SOURCE_ADDRESS = "source_ip_address",
            COL_DESTINATION_ADDRESS = "destination_ip_address";
        let prevTime = new Date(day);

        function readData() {
            let time = new Date(prevTime.getTime() + interval * step);
            let minTime = time.getTime() - duration;
            let data = rawData.filter(d => d[COL_TIME] <= time && d[COL_TIME] >= minTime);
            if (data.length > 0) {
                //TODO: Need to make use of the prev nodes, links information to avoid resetting everything
                let {nodes, links, timedNodes, timedLinks} = getLinksGroupedByFanInOut(data, COL_SOURCE_ADDRESS, COL_DESTINATION_ADDRESS, [COL_LINK_TYPE], COL_TIME);
                postMessage({nodes: nodes, links: links, timedNodes: timedNodes, timedLinks: timedLinks});
            }
            prevTime = time;


            setTimeout(readData, interval);

        }

        readData();
    });
};