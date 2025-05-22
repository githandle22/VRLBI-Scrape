
var Db_if = require('./VRLBI_Db_if');
var db_if = new Db_if();
var Availability = require('./availability');
var availability = new Availability();
var Test = require('./testArray');
var test = new Test();
var Scraper = require('./VRLBI_SCRAPER');
var scraper = new Scraper();
var App1 = require('./APP1');
var app1 = new App1();

var operation_type = process.argv[2];
var propID = process.argv[3];
var propStatic = {
  "sampleNum": 2,
  "propID": 23,
  "propName": "",
  "ofInterest": true,
  "firstFound": 1,
  "activeProp": true,
  "beds": 5,
  "baths": 5,
  "sleeps": 12,
  "propType": "house",
  "locType": "oceanfront",
  "locAddr": "",
  "locTown": "BHC",
  "locLat": "",
  "locLong": "",
  "ownName": "Knell",
  "ownPhone": "856"
}
asyncWrapper();

async function asyncWrapper(){
	switch (operation_type) {
  	case "1":
    	scanStatus = await db_if.connectToDB();
      console.log("result = ", scanStatus);
      scanStatus = await db_if.writeNewScan();
      console.log("newScan._id = ", scanStatus);
      scanStatus = await db_if.close();
      console.log("result = ", scanStatus);
    	break;
  	case "2":
      scanStatus = await db_if.connectToDB();
      console.log("result = ", scanStatus);
      scanStatus = await db_if.readScanStatus();
      console.log("readScanStatus result = ", scanStatus);
      scanStatus = await db_if.close();
      console.log("result = ", scanStatus);
      break;
  	case "3":
      result = await availability.sample_availability_array();
      console.log("result = ", result);
    	break;
  	case "4":
      console.log("running testArray");
    	test.test_array();
    	break;
  	case "5":
  		property.name = "23";   // Super-Sass-And-Science-Class, Science-Lessons-That-Rock, Captivate-Science
		console.log("property.name = ", property.name);		//Teaching-With-A-Mountain-View
		ret_val = await property.get_summary();
		console.log("returned value = ", ret_val);
		console.log("property.name is now = ", property.name);
    	break; 
  	case "6":       // This is the index to use for the simple scrape from Dec 2020
		scanStatus = await scan.startScan();
		console.log("stores_scanned = ", scanStatus.storeCount);		
    	break;  
    case "7":
    	await db_if.test_time();		// use this to create a new scanStatus collection
    	break; 
    case "8":
    	await db_if.connectToDB();
    	await db_if.updateStoreInvalid(3);		// use this to create a new scanStatus collection
    	await db_if.close();
    	break; 
    case "9":
      scanStatus = await db_if.connectToDB();
      console.log("result = ", scanStatus);
      scanStatus = await db_if.writePropStaticData(propStatic);
      console.log("readPropertyList result = ", scanStatus);
      scanStatus = await db_if.close();
      console.log("result = ", scanStatus);
      break;
    case "10":
      scanStatus = await scraper.initialize({sampleNum: 1, dbName: 'VRBLI'});
      console.log("result = ", scanStatus);
      break;
    case "11":
      scanStatus = await scraper.open_browser();
      pageStatus = await scraper.open_page(20);
      scanStatus = await scraper.close_browser();
      console.log("scraper.open_page result = ", pageStatus);
      console.log("scraper.open_browser result = ", scanStatus);
      break;
    case "12":    // use this to initially find properties 
      scanStatus = await scraper.connectToDB();
      console.log("result = ", scanStatus);
      scanStatus = await scraper.test_properties_status({propIDmin: 2501, propIDmax: 3410}, 20); //3410
      console.log("scraper.test_properties_status = ", scanStatus);
      scanStatus = await scraper.closeDB();
      console.log("result = ", scanStatus);
      break;
    case "13":
      shuffled = await scraper.shuffle_prop_list([1,2,3,4,5,6,7,8,9,10]);
      console.log("scraper.open_browser result = ", shuffled);
      break;
    case "14":
      scanStatus = await db_if.connectToDB();
      console.log("result = ", scanStatus);      
      result = await db_if.readSingleProperty(23);
      console.log("readSingleProperty result = ", result[0]);
      scanStatus = await db_if.close();
      console.log("result = ", scanStatus);
      break;
     case "15":     //  use this to start a scan to scrape properties. 
                    //  propID in first parameter limits scrape to just that one property
                    // propsToScrapeLimit can be used to scrape a limited number of (random) properties
      scanControlObject = {targetProperty: parseInt(process.argv[3]), propsToScrapeLimit: false} // false
      scanStatus = await scraper.connectToDB();
      console.log("result = ", scanStatus);
      scanStatus = await scraper.scan(scanControlObject);
      console.log("scraper.scan returned = ", scanStatus);
      scanStatus = await scraper.closeDB();
      console.log("result = ", scanStatus);
      break;
     case "16":
      string = '5 full, 0 half';
      start = string.indexOf(",");
      end = string.indexOf(" half");
      console.log('string = ', string, ' substring = ', string.substring(start+1,end));
      bathsHalf = Number(string.substring(start+1,end).trim());
      console.log('string = ', string, ' bathsHalf = ', bathsHalf);
      string = ' Calendar Updated                                : 01/26/2023 11:54'
      start = string.indexOf(": ");
      end = start+10;
      console.log('string = ', string, ' substring = ', string.substring(start+1,end).trim());
      console.log('date = ', Date.parse(string.substring(start+1,end).trim()));
      break;
     case "17":
      monthObject = {};
//      monthBookedDates = ['2','3','4','7','8'];
      monthBookedDates =  [
  '2',  '3',  '4',  '5',  '6',
  '7',  '9',  '10', '11', '12',
  '13', '14', '15', '16', '17',
  '18', '19', '20', '21', '23',
  '24', '25', '26', '27', '28',
  '29', '30', '31'
]
//      rates = [10,20,30,40,50];
      rates =  [
  5200, 5201, 5202, 5203, 5204,
  5205, 5206, 5207, 5208, 5209,
  5210, 5211, 5212, 5200, 5200,
  5200, 5200, 5200, 5200, 5200,
  5200, 5200, 5200, 5200, 5200,
  5200, 5200, 5200
];
      numBookedDates = monthBookedDates.length;
      for (i=0; i<numBookedDates; i++){
        monthObject[monthBookedDates[i]] = rates[i];
      }
      
//      monthObject =  monthBookedDates.reduce((monthBookedDates,curr)=> (monthBookedDates[curr]='',monthBookedDates),{});
//      monthObject.4 = rates[2];
      lookUpDate = '4';
      console.log("monthObject = ", monthObject);
      console.log("monthObject[lookUpDate] = ", monthObject[lookUpDate]);
      break;
     case "18":
      scanStatus = await app1.test_handles();
      console.log("result = ", scanStatus);
      break;
     case "19":
      scanStatus = await availability.scrape_availability_calendar(propID); //sample_availability_array, scrape_availability_calendar
      console.log("result = ", scanStatus);
      break;
     case "20":
      yearArray = [];
      db_result = await await db_if.connectToDB();
      console.log("connect result = ", db_result);
      weekLookupArray = await db_if.readWeekLookup();
      console.table(weekLookupArray);      
      sampleNum = 1;
      propID = 23;
      scanStatus = await availability.scrape_availability_data(sampleNum, propID, weekLookupArray);
      console.table(scanStatus);
      db_result = await await db_if.close();
      break;
     case "21":
      db_result = await await db_if.connectToDB();
      console.log("connect result = ", db_result);
      const lookupTable = [
        { year: '2025', month: 'June', date: '11', weekID: 0, saturdayDate: '6/7/2025' },
        { year: '2025', month: 'June', date: '18', weekID: 1, saturdayDate: '6/14/2025' },
        { year: '2025', month: 'June', date: '25', weekID: 2, saturdayDate: '6/21/2025' },
        { year: '2025', month: 'July', date: '2', weekID: 3, saturdayDate: '6/28/2025' },
        { year: '2025', month: 'July', date: '9', weekID: 4, saturdayDate: '7/5/2025' },
        { year: '2025', month: 'July', date: '16', weekID: 5, saturdayDate: '7/12/2025' },
        { year: '2025', month: 'July', date: '23', weekID: 6, saturdayDate: '7/19/2025' },
        { year: '2025', month: 'July', date: '30', weekID: 7, saturdayDate: '7/26/2025' },
        { year: '2025', month: 'August', date: '6', weekID: 8, saturdayDate: '8/2/2025' },
        { year: '2025', month: 'August', date: '13', weekID: 9, saturdayDate: '8/9/2025' },
        { year: '2025', month: 'August', date: '20', weekID: 10, saturdayDate: '8/16/2025' },
        { year: '2025', month: 'August', date: '27', weekID: 11, saturdayDate: '8/23/2025' },
        { year: '2025', month: 'September', date: '3', weekID: 12, saturdayDate: '8/30/2025' },
        { year: '2025', month: 'September', date: '10', weekID: 13, saturdayDate: '9/6/2025' },
        { year: '2025', month: 'September', date: '17', weekID: 14, saturdayDate: '9/13/2025' },
        { year: '2025', month: 'September', date: '24', weekID: 15, saturdayDate: '9/20/2025' } 
      ];
        result_db = await await db_if.writeWeekLookup(lookupTable);
        console.log("result from writing weekLookup = ", result_db);
//      scanStatus = await scraper.build_week_lookup(); //write the new dates from the table in VRLBI_SCRAPER.js
//      console.log("result from writing weekLookup = ", scanStatus);
      db_result = await await db_if.close();
      break;
  	default:
    	console.log("undefined operation_type");
    	console.log(process.argv);
	}
//console.log("this is the end of index.js");
}

function display_result(state){
	console.log("this is the control state returned: ", state);
}
