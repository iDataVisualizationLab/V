function updateTable(tbl, rows) {
    tbl.innerHTML = '';
    let headers = Object.keys(rows[0]);

    let header = tbl.createTHead();
    let body = tbl.createTBody();
    let hRow = header.insertRow();
    headers.forEach(hd => {
        let hCell = hRow.insertCell();
        hCell.innerText = hd;
    });

    rows.forEach(rowDt => {
        let row = body.insertRow();
        headers.forEach(hd => {
            let cell = row.insertCell();
            if (hd === COL_DEVICE_ACTION) {
                cell.style.color = deviceActionColors[rowDt[hd]];
            }else if(hd===COL_SOURCE_ADDRESS || hd===COL_DESTINATION_ADDRESS){
                cell.style.color = nodeColor({id: rowDt[hd]});
            }
            cell.innerHTML = rowDt[hd];

        })
    });
}

function filterByColumnsAnd(theTbl, columns, values, data) {
    let filteredData = data.filter(row => {
        for (let i = 0; i < columns.length; i++) {
            let clm = columns[i];
            if (row[clm] !== values[i]) {
                return false;
            }
        }
        return true;
    });
    updateTable(theTbl, filteredData);
}

function filterByColumnsOr(theTbl, columns, value, data) {
    let filteredData = data.filter(row => {
        for (let i = 0; i < columns.length; i++) {
            let clm = columns[i];
            if (row[clm] === value) {
                return true;
            }
        }
    });
    updateTable(theTbl, filteredData);
}
