function updateTable(tbl, rows) {
    tbl.innerHTML = '';
    //Creating the header.
    let headers = Object.keys(rows[0]);
    if(!rows[0]){
        debugger
    }
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
