function doGet(e) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var vehicleSheet = ss.getSheetByName('DS xe');
    var configSheet = ss.getSheetByName('Cauhinh');

    // Read Config
    var configData = configSheet.getRange('A2:B2').getValues()[0];
    var config = {
        hotline: configData[0],
        notification: configData[1]
    };

    // Read Vehicles
    var lastRow = vehicleSheet.getLastRow();
    var vehicleData = [];

    if (lastRow > 1) {
        var data = vehicleSheet.getRange(2, 1, lastRow - 1, 10).getValues(); // A2:J

        vehicleData = data.map(function (row) {
            // Calculate remainLoad if empty
            var maxLoad = row[2];
            var currentLoad = row[3];
            var remainLoad = row[4];

            if (remainLoad === "" && remainLoad !== 0) {
                remainLoad = maxLoad - currentLoad;
            }

            // Format Date
            var formattedDate = "";
            if (row[7] instanceof Date) {
                var day = ("0" + row[7].getDate()).slice(-2);
                var month = ("0" + (row[7].getMonth() + 1)).slice(-2);
                var year = row[7].getFullYear();
                formattedDate = day + "/" + month + "/" + year;
            } else {
                formattedDate = row[7];
            }

            return {
                id: row[0],
                licensePlate: row[1],
                maxLoad: maxLoad,
                currentLoad: currentLoad,
                remainLoad: remainLoad,
                startPoint: row[5],
                endPoint: row[6],
                startDate: formattedDate,
                note: row[8]
                // password (row[9]) is NOT returned
            };
        });
    }

    var result = {
        config: config,
        vehicles: vehicleData
    };

    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    try {
        var postData = JSON.parse(e.postData.contents);
        var licensePlate = postData.licensePlate;
        var password = postData.password;
        var newLoad = Number(postData.newLoad);

        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getSheetByName('DS xe');
        var lastRow = sheet.getLastRow();

        if (lastRow > 1) {
            var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues(); // A2:J

            for (var i = 0; i < data.length; i++) {
                // Check License Plate (Col B - Index 1) and Password (Col J - Index 9)
                if (data[i][1] == licensePlate && data[i][9] == password) {
                    // Update Current Load (Col D) -> Row index is i + 2
                    sheet.getRange(i + 2, 4).setValue(newLoad);

                    // Calculate and Update Remain Load (Col E)
                    var maxLoad = data[i][2];
                    var remainLoad = maxLoad - newLoad;
                    sheet.getRange(i + 2, 5).setValue(remainLoad);

                    return ContentService.createTextOutput(JSON.stringify({
                        status: 'success',
                        message: 'Cập nhật thành công!'
                    })).setMimeType(ContentService.MimeType.JSON);
                }
            }
        }

        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Sai biển số hoặc mật khẩu!'
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}
