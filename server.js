const csv = require('csv-parser');
let fs = require('fs');
const axios = require('axios');
const csv1=require('csvtojson');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const key = "";
const target = "";
const retrieved = "";
const csvWriter = createCsvWriter({
    path: target,
    header: [
        {id: 'order', title: 'Order#'},
        {id: 'city1', title: 'Shipper City'},
        {id: 'prov1', title: 'Shipper Province/State'},
        {id: 'org', title: 'Shipper Postal'},
        {id: 'city2', title: 'Consignee City'},
        {id: 'prov2', title: 'Consignee Province/State'},
        {id: 'des', title: 'Consignee Postal'},
        {id: 'mileage', title: 'Mileage'},
    ]
});
// Invoking csv returns a promise
const converter=csv1()
    .fromFile(retrieved)
    .then((json)=>{
        let newTable = [];
        for (let i = 0; i < json.length; i++) {
            let origin = json[i]['SHIPPERPostal'];
            if (!origin) {
                origin = json[i]['SHIPPER City'];
            }
            else if (origin.length === 6){
                origin = origin.substring(0, 3) + '+' + origin.substring(3, 6);
            }
            let destination = json[i]['CONSIGNEEPostal'];
            if (!destination) {
                destination = json[i]['CONSIGNEE City']
            }
            else if (destination.length=== 6){
                destination = destination.substring(0, 3) + '+' + destination.substring(3, 6);
            }
            async function getMileage() {
                let mileage = await axios.get("https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + origin + "&destinations=" + destination + "&key=" + key)
                    .then(
                        (response) => {
                            if(response['data']['rows'][0]['elements'][0]['distance']['value'] || response['data']['rows'][0]['elements'][0]['distance']['value'] === 0) {
                                return {
                                    order: json[i]['Order#'],
                                    city1: json[i]['SHIPPER City'],
                                    prov1: json[i]['SHIPPER Prov/State'],
                                    org: json[i]['SHIPPERPostal'],
                                    city2: json[i]['CONSIGNEE City'],
                                    prov2: json[i]['CONSIGNEE Prov/State'],
                                    des: json[i]['CONSIGNEEPostal'],
                                    mileage: Math.round(response['data']['rows'][0]['elements'][0]['distance']['value'] * 0.621371 / 1000)
                                };
                            }
                            else {
                                return {
                                    order: json[i]['Order#'],
                                    city1: json[i]['SHIPPER City'],
                                    prov1: json[i]['SHIPPER Prov/State'],
                                    org: json[i]['SHIPPERPostal'],
                                    city2: json[i]['CONSIGNEE City'],
                                    prov2: json[i]['CONSIGNEE Prov/State'],
                                    des: json[i]['CONSIGNEEPostal'],
                                    mileage: 'N/A'
                                };
                            }
                        })
                    .catch(() => {
                        return {
                            order: json[i]['Order#'],
                            city1: json[i]['SHIPPER City'],
                            prov1: json[i]['SHIPPER Prov/State'],
                            org: json[i]['SHIPPERPostal'],
                            city2: json[i]['CONSIGNEE City'],
                            prov2: json[i]['CONSIGNEE Prov/State'],
                            des: json[i]['CONSIGNEEPostal'],
                            mileage: 'N/A'
                        };
                    });
                newTable.push(mileage);
            }
            getMileage();
    }
        setTimeout(function(){
            csvWriter
                .writeRecords(newTable)
                .then(()=> console.log('The CSV file was written successfully'));
            }, 5000);
});