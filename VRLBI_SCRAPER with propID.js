const puppeteer = require('puppeteer');
var Db_if = require('./VRLBI_Db_if');
var db_if = new Db_if();

function VRLBI_scraper(){
	// HIGH LEVEL methods called from outside of VRLBI_scraper
			// put all initialization stuff here, pass parameters via initObject
			// test database connection
			// return success or failure
		this.initialize = async function(initObject){
//			const browser = await puppeteer.launch();
//			this.page = await browser.newPage();
			this.urlBase = 'https://www.vacationrentalslbi.com/listing.';
			this.sampleNumber = initObject.sampleNum;
			this.dbName = initObject.dbName;
      		console.log("VRLBI_scraper.initialize: this.sampleNumber = ", this.sampleNumber);
      		return('Initialization completed');
		}
		this.connectToDB = async function(){
      		scanStatus = await db_if.connectToDB();
      		console.log("VRLBI_scraper.connectToDB: result = ", scanStatus);
      		return(scanStatus);			
		}
		this.closeDB = async function(){
      		scanStatus = await db_if.close();
      		console.log("VRLBI_scraper.closeDB: result = ", scanStatus);	
      		return(scanStatus);			
		}
		this.test_properties_status = async function(propertyRangeObject, sampleNum){
			// within the range of propertyRange, see if any new properties have become active or inactive
			// update the list of properties accordingly in the VRLBI database
			// return array of new properties and newly inactive properties
			// sampleNum is used if a newly active property is discovered. It should be the number of the NEXT sample
			// Possibilities:
				// Database		propActive 	Page 		Action				TYPE
				//	present 	set 		valid 		do nothing			1
				//	present 	clear 		valid 		set propActive		2
				//  present     set			error 		clear propActive 	3
				//  present     clear		error 		clear propActive 	4
				// 	missing 	N/A			valid 		add prop 			5
				//	missing 	N/A			error 		do nothing 			6
			propCollectionPrototype = {
  				"sampleNum": 0,
  				  "propID": 0,		// *** _id  ***
  				  "propName": "",
  				  "ofInterest": true,
  				  "firstFound": 1,
  				  "activeProp": false,
  				  "beds": "",
  				  "baths": "",
  				  "sleeps": "",
  				  "propType": "",
  				  "locType": "",
  				  "locAddr": "",
   				 "locTown": "",
   				 "locLat": "",
  				  "locLong": "",
  				  "ownName": "",
  				  "ownPhone": ""
			}
			propDynamicPrototype = {
  				"sampleNum": 0,
  			  "propID": 0,			// *** _id  ***
  			  "weeksBooked": 0,
			  "dollarsBooked": 0,
			  "reviews": 0,
			  "views": 0,
			  "lastUpdate": 'Feb 27, 2023'
			}

			propIDmin = propertyRangeObject.propIDmin;
			propIDmax = propertyRangeObject.propIDmax;
			propIDArray = [];
			result = await this.open_browser();
			propCount = propIDmax - propIDmin + 1;
			propID = propIDmin;		// *** _id  ***
			typeCount = [0,0,0,0,0,0,0];
			for(j=0; j<propCount; j++){	// create an indexed array of the property IDs
				propIDArray[j] = propID++;
			}
			propIDArray = await this.shuffle_prop_list(propIDArray);	// shuffle the array to make it scrape-friendly
			for(i=0; i<propCount; i++){
				dbResult = await db_if.readSingleProperty(propIDArray[i]); // if in database, dbResult will be defined
				valid_page_test = await this.open_page(propIDArray[i]);	// creates this.page object or returns false if propID is invalid
				console.log('VRLBI_scraper.test_properties_status: valid_page_test = ', valid_page_test);
				if(dbResult[0]){				// property is already in the database
					if(valid_page_test){	// check to see if property page is valid, if so, make sure activeProp is set
						if(dbResult[0].activeProp){
							typeCount[1]++;
							console.log('VRLBI_scraper.test_properties_status: TYPE 1');
							}	// TYPE 1: property is already in database and is active
						else{						// TYPE 2: property is in database but needs to be made active
							console.log('VRLBI_scraper.test_properties_status: TYPE 2');
							dbResult[0].activeProp = true;	
							await db_if.writePropStaticData(dbResult[0]);
							typeCount[2]++;
						}
					}
					else{							// TYPEs 3,4: prop is in database, make sure inactive
							console.log('VRLBI_scraper.test_properties_status: TYPE 3');
							dbResult[0].activeProp = false;	
							await db_if.writePropStaticData(dbResult[0]);
							typeCount[3]++;
					}
				}
				else{	// Property is not in the database
					dbResult[0] = propCollectionPrototype;
					delete dbResult[0]._id;		// *** _id  ***  was originally _id ... keep that way
					if(valid_page_test){	// TYPE 5: if property page is valid, add to database
						console.log('VRLBI_scraper.test_properties_status: TYPE 5');
						dbResult[0].propID = propIDArray[i];	// *** _id  ***
						dbResult[0].firstFound = sampleNum;						
						dbResult[0].activeProp = true;
						propDynamicPrototype.propID = propIDArray[i];	// *** _id  ***
						delete propDynamicPrototype._id;				// *** _id  ***  was originally _id ... keep that way
//						console.log('VRLBI_scraper.test_properties_status: dbResult[0] = ', dbResult[0]);
						await db_if.addSingleProperty(dbResult[0], propDynamicPrototype);
						typeCount[5]++;
					}
					else{typeCount[6]++;	// TYPE 6: prop is not valid, don't add to database
							console.log('VRLBI_scraper.test_properties_status: TYPE 6');
					}										
				}
				await delay_random(5000,30000);
			}
			result = await this.close_browser();
	console.log('scraper.test_properties_status: still active = ', typeCount[1]);
	console.log('scraper.test_properties_status: reactivate = ', typeCount[2]);
	console.log('scraper.test_properties_status: newly inactive = ', typeCount[3]);
	console.log('scraper.test_properties_status: new property = ', typeCount[5]);
	console.log('scraper.test_properties_status: still inactive = ', typeCount[6]);
			return(typeCount);
		}
		this.scan = async function(scanControlObject){	// this is used during debug. If a limit is passed use it. Else scrape all
			// scanControlObject = {targetProperty: propID, propsToScrapeLimit: 1}  // *** _id  ***
			// Manage the process of a "scan" (one or more scans make up samples which are done every two weeks or so), 
			//		scrape all known active properties stored in the database propCollection
			// If for some reason a particular scan does not complete an entire sample the sample may require multiple scans
			//		(an entire sample is when all properties are scraped)
			// Read from VRLBI database to determine this sample number and scan number  and 
			//  	get a list of properties to scrape
			// go through the list randomly, not in numerical order
			// for each property to be scraped
			//		initiate the scrape of the property
			//		test to confirm that the property is still valid
			//		write the returned objects to the VRLBI database
			// 		update the scan status in the database after completing each property
			// return success or failure ... status can be viewed by looking at the database
			var k=0;
			var propIDArray = [];
			let propsToScrape;
			let sampleNum = await db_if.determine_sampNum();
			let scanNum = await db_if.determine_scanNum();
//			scanNum = await db_if.writeNewScan(); // prepare a new scan document in the collection scanStutus
			propIDArray = await db_if.get_propList(sampleNum);	// get all of the unscraped properties for this sample
			propIDArray = await this.shuffle_prop_list(propIDArray);	// randomize the order of the propIDs
			if(scanControlObject.targetProperty){	// if a single property has been selected
				propsToScrape = 1;
				propIDArray[0] = scanControlObject.targetProperty;
				scanType = 'oneProperty';
			} else if(scanControlObject.propsToScrapeLimit){	// if a limit has been imposed, only scrape this # of props
				propsToScrape = scanControlObject.propsToScrapeLimit;
				scanType = 'rangeLimit';}
			else{propsToScrape = propIDArray.length;
				scanType = 'fullScan'} // if there is no limit, scrape them all		
			var badPropCount = 0;
			var d = new Date();
			const scanStatusObject = {_id: scanNum, sampleNum: sampleNum,  
								sampleType: scanType,	// either oneProperty, rangeLimit, fullScan
								startTime: d.toLocaleString(), scanTime: null,
								toCrawl: propsToScrape, lastProp: null,
								propCount: 0, badPropCount: badPropCount}
			await db_if.writeNewScan(scanStatusObject);		// write a new scan document to the collection scanStutus
			console.log('scraper.scan: scraping ', propsToScrape, ' properties');
			result = await this.open_browser();
			propScrapedCount = 0;
			for (k=0; k < propsToScrape; k++){
//				dbResult = await db_if.readSingleProperty(propIDArray[k]); // if in database, dbResult will be defined
				valid_page_test = await this.open_page(propIDArray[k]);	// this.page now contains the scraped page
				console.log('scraper.scan: scraping property number', propIDArray[k]);
//				valid_page_test = false;
				if (valid_page_test) {	// looks like a valid property page; scrape it
					// this next function call scrapes everything of interest
					weekLookupArray = await db_if.readWeekLookup();
					scrapeDataArray = await this.scrape_property(sampleNum, propIDArray[k], weekLookupArray); 
					staticDataObject = scrapeDataArray[0];			// all of the static data for the property
		console.log('scraper.scan: staticDataObject = ', staticDataObject);
					await db_if.writePropStaticData(staticDataObject);
					bookedWeeksArray = scrapeDataArray[1];		// all of the availability data for the property
		console.log('scraper.scan: bookedWeeksArray = ');
		console.table(bookedWeeksArray);
					await db_if.writePropBookedData(bookedWeeksArray);
					dynamicDataObject = scrapeDataArray[2];			// most of the dynamic data for the property
					weeksBooked = bookedWeeksArray.length;		// calculate weeksBooked and dollarsBooked
					dynamicDataObject.weeksBooked = weeksBooked;	// add additional elements to the dynamic data
					var dollarsBooked = 0;
					var weeksWithNoRate = 0;
					for (j=0; j < weeksBooked; j++){
						oneRate = bookedWeeksArray[j].rate;
						if(typeof(oneRate) == "number"){	// not every week has a rate available within the calendar
							dollarsBooked = dollarsBooked + oneRate;
						}	// else, rate must be "no rate", do don't add it 
						else{weeksWithNoRate++;}
					}
					dynamicDataObject.dollarsBooked = dollarsBooked;
					dynamicDataObject.noRateCount = weeksWithNoRate;
		console.log('scraper.scan: dynamicDataObject', dynamicDataObject);
					await db_if.writePropDynamicData(dynamicDataObject);
					propScrapedCount++;
					scanStatusObject.propCount = propScrapedCount;		// count properties that have been successfully scraped
				}
				else {	// property page is invalid; mark property as not-active in propCollection
		console.log('scraper.scan: valid_page_test (false?)', valid_page_test);
					await db_if.updatePropInactive(propIDArray[k]);	// this clears the activeProp flag (makes it false)
					badPropCount = badPropCount++;
					scanStatusObject.badPropCount = badPropCount;
				} // end of else
				d = new Date();
				scanStatusObject.scanTime = d.toLocaleString();
				scanStatusObject.lastProp = propIDArray[k];
				await db_if.updateScanStatus(scanStatusObject);		// update the document in scanStatus
				await delay_random(5000,30000); // wait range in mSec between page accesses
			} // end of for loop
//			console.log('VRLBI_scraper.scan: propList = ', propList);
			result = await this.close_browser();
			return (scanStatusObject);
		}

		this.build_week_lookup = async function(){
			// once a year, before the first scan, build the weekLookup table
			// write the result to weekLookup
			// return success or failure
			const lookupTable = [
				{ year: '2023', month: 'June', date: '14', weekID: 0, saturdayDate: '6/10/2023' },
				{ year: '2023', month: 'June', date: '21', weekID: 1, saturdayDate: '6/17/2023' },
				{ year: '2023', month: 'June', date: '28', weekID: 2, saturdayDate: '6/24/2023' },
				{ year: '2023', month: 'July', date: '5', weekID: 3, saturdayDate: '7/1/2023' },
				{ year: '2023', month: 'July', date: '12', weekID: 4, saturdayDate: '7/8/2023' },
				{ year: '2023', month: 'July', date: '19', weekID: 5, saturdayDate: '7/15/2023' },
				{ year: '2023', month: 'July', date: '26', weekID: 6, saturdayDate: '7/22/2023' },
				{ year: '2023', month: 'August', date: '2', weekID: 7, saturdayDate: '7/29/2023' },
				{ year: '2023', month: 'August', date: '9', weekID: 8, saturdayDate: '8/5/2023' },
				{ year: '2023', month: 'August', date: '16', weekID: 9, saturdayDate: '8/12/2023' },
				{ year: '2023', month: 'August', date: '23', weekID: 10, saturdayDate: '8/19/2023' },
				{ year: '2023', month: 'August', date: '30', weekID: 11, saturdayDate: '8/26/2023' },
				{ year: '2023', month: 'September', date: '6', weekID: 12, saturdayDate: '9/2/2023' },
				{ year: '2023', month: 'September', date: '13', weekID: 13, saturdayDate: '9/9/2023' },
				{ year: '2023', month: 'September', date: '20', weekID: 14, saturdayDate: '9/16/2023' },
				{ year: '2023', month: 'September', date: '27', weekID: 15, saturdayDate: '9/23/2023' } 
			];
			console.table(lookupTable);
			result = await db_if.writeWeekLookup(lookupTable);
			console.log('scraper.build_week_lookup: result = ', result);
			return (result);
		}

	// MID LEVEL FUNCTIONS - these methods are only called within VLRBI_scraper()
		this.open_browser = async function(){
			// create the object "this.browser" 
			browser = await puppeteer.launch();
			this.browser = browser;
			return('success');
		}
		this.close_browser = async function(){
			// destroy the object "this.browser" 
			await this.browser.close();
			return('success');
		}
		this.open_page = async function(propID){ // *** _id  ***
			// create the object "this.page" based on propID
			// return status based on whether a valid property page is served
			this.page = await this.browser.newPage();
			url = 'https://www.vacationrentalslbi.com/listing.' + propID;	// *** _id  ***
			await this.page.goto(url);
			console.log('VRLBI_scraper.open_page: url = ', url);
			await sleep(5000);
			let source = await this.page.content({"waitUntil": "domcontentloaded"});
			result1 = source.indexOf("404 - Page not found");
			if(result1 > 0){	// if 404, propID is not valid
				validID = false;
			}
			else {validID = true;}
			console.log('VRLBI_scraper.open_page: validID = ', validID);
//			let bodyHTML = await this.page.evaluate(() => document.body.innerHTML);
//			result = Object.keys(bodyHTML).length;
//			console.log('VRLBI_scraper.open_page: length = ', result);
			return(validID);
		}
		this.shuffle_prop_list = async function(propList){	// shuffle the list to avoid scraping in order
			let currentIndex = propList.length,  randomIndex;
				// While there remain elements to shuffle.
  			while (currentIndex != 0) {
  			// Pick a remaining element.
    			randomIndex = Math.floor(Math.random() * currentIndex);
    			currentIndex--;
    		// And swap it with the current element.
    			[propList[currentIndex], propList[randomIndex]] = [propList[randomIndex], propList[currentIndex]];		
  			}
			return propList;
		}
		this.scrape_property = async function(sampleNum, propID, weekLookupArray){	// *** _id  ***
			// typeOfScrape:
				// may want to just scrape availability data
				// may want to see if static data has changed (once a year, maybe)
			// for this.page, assemble an array summarizing the data scraped from the property page
			// call the lower level functions:
			//		scrape_static_data()					// returns an object
			//		scrape_availability_data(weekLookup)	// returns an array of objects
			//		scrape_dynamic_data()					// returns an object
			// return an array of objects
			scrapeDataArray = [];
			scrapeDataArray[0] = await this.scrape_static_data(sampleNum, propID); // *** _id  ***
			scrapeDataArray[1] = await this.scrape_availability_data(sampleNum, propID, weekLookupArray); // *** _id  ***
			scrapeDataArray[2] = await this.scrape_dynamic_data(sampleNum, propID); // *** _id  ***
			return (scrapeDataArray);
		}
		this.scrape_static_data  = async function(sampleNum, propID) {	// *** _id  ***
			// scrape the static data from this.page
			// return the object staticDataObject
	console.log('scraper.scrape_static_data: ENTER');
			var staticDataObject = {};
			staticDataObject.sampleNum = sampleNum;
			staticDataObject.propID = propID;	// *** _id  ***
		var element = await this.page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[1]/h1');
		var string = await element.evaluate(el => el.textContent);
		staticDataObject.propName = string.trim();
console.log('scraper.scan: staticDataObject.propName = ', staticDataObject.propName);
		element = await this.page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[3]/div[1]/div[1]/ul/li[2]/div[2]');
		string = await element.evaluate(el => el.textContent);
		staticDataObject.beds = Number(string.trim()); 
console.log('scraper.scan: staticDataObject.beds = ', staticDataObject.beds);
		element = await this.page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[3]/div[1]/div[1]/ul/li[3]/div[2]');
		string = await element.evaluate(el => el.textContent);
		staticDataObject.baths = string.trim();
		end = string.indexOf(" full");
		staticDataObject.bathsFull = Number(string.substring(0,end).trim());
		start = string.indexOf(",");
		end = string.indexOf(" half");
		staticDataObject.bathsHalf = Number(string.substring(start+1,end).trim());
console.log('scraper.scan: staticDataObject.bathsHalf = ', staticDataObject.bathsHalf);
		element = await this.page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[3]/div[1]/div[1]/ul/li[1]/div[2]');
		string = await element.evaluate(el => el.textContent);
		staticDataObject.sleeps = Number(string.trim());
console.log('scraper.scan: staticDataObject.sleeps = ', staticDataObject.sleeps);
		try{
		element = await this.page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[1]/div/div[1]/div/strong');
		string = await element.evaluate(el => el.textContent);
		staticDataObject.propType = string.trim();
		} catch(err){staticDataObject.propType = 'no propType';}
console.log('scraper.scan: staticDataObject.propType = ', staticDataObject.propType);
		try{
		element = await this.page.waitForSelector('xpath//html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[3]/div[1]/div[7]/div[4]/div/div[2]/div');
		string = await element.evaluate(el => el.textContent);
		staticDataObject.locType = string.trim();
		} catch(err){staticDataObject.locType = 'no locType';}
console.log('scraper.scan: staticDataObject.locType = ', staticDataObject.locType);
		try{
		element = await this.page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[1]/div/div[1]/div');
		string = await element.evaluate(el => el.textContent);
		staticDataObject.locTown = string.trim();
		} catch(err){staticDataObject.locTown = 'no locTown';}
console.log('scraper.scan: staticDataObject.locTown = ', staticDataObject.locTown);
		try{
		element = await this.page.waitForSelector('#page_content > div.container.mobile_no_padding > div > div.col-md-4 > div:nth-child(2) > div > div.od_header > ul > li.name');
							// #page_content > div.container.mobile_no_padding > div > div.col-md-4 > div:nth-child(2) > div > div.od_header > ul > li.name
							// xpath/html/body/div[1]/div[2]/div[2]/div/div[2]/div[2]/div/div[1]/ul/li[1]
		string = await element.evaluate(el => el.textContent);
		staticDataObject.ownName = string.trim();
		} catch(err){staticDataObject.ownName = 'no ownName';}
console.log('scraper.scan: staticDataObject.ownName = ', staticDataObject.ownName);
		try{
		element = await this.page.waitForSelector('#li_phone > a');
		string = await element.evaluate(el => el.textContent);
		staticDataObject.ownPhone = string.trim(); 
		} catch(err){staticDataObject.ownPhone = 'no ownPhone';}		
console.log('scraper.scan: staticDataObject.ownPhone = ', staticDataObject.ownPhone);
		await element.dispose();
		return (staticDataObject);
console.log('scraper.scrape_static_data: EXIT');
		} 

		this.scrape_dynamic_data = async function(sampleNum, propID) {	// *** _id  ***
			// scrape the dynamic data from this.page
			// return an object dynamicDataObject
	console.log('scraper.scrape_dynamic_data: ENTER');
			var dynamicDataObject = {};
			dynamicDataObject.sampleNum = sampleNum;
			dynamicDataObject.propID = propID; 	// *** _id  ***
				// I found the selectors used below by opening the page in Chrome, right clicking on the information, selecting "inspect"
				// in the elements window, right clicking above the line where the information appears, selecting "copy" > "copy selector"
				// pasting the copied text, but without the i.class reference 
				try{ // reviews
				var element = await this.page.waitForSelector('#ajax_reviews > div.padding_10px.ld_section > div.reviews.padding_10px > h2 > div > div:nth-child(1)');
				var string = await element.evaluate(el => el.textContent);
				var end = string.indexOf(" Reviews");
				 dynamicDataObject.reviews = Number(string.substring(0,end).trim());
				} catch(err){dynamicDataObject.reviews = 'no reviews';}
		console.log('scraper.scrape_dynamic_data: reviews = ', dynamicDataObject.reviews);
				try{ // views
				var element = await this.page.waitForSelector('text/View(s)');
//				var element = await this.page.waitForSelector('#overview > div:nth-child(14)'); 
				string = await element.evaluate(el => el.textContent);
				end = string.indexOf(" View(s)");
				dynamicDataObject.views = Number(string.substring(0,end).trim());
				} catch(err){dynamicDataObject.views = 'no views';}
		console.log('scraper.scrape_dynamic_data: views = ', dynamicDataObject.views);
				try{ // last update
				var element = await this.page.waitForSelector('text/Calendar Updated');
//				var element = await this.page.waitForSelector('#overview > div:nth-child(14)');
				string = await element.evaluate(el => el.textContent);
      			start = string.indexOf(": ");
      			end = start+12;
      			string = string.substring(start+1,end).trim()
				dynamicDataObject.lastUpdate = string;
				dynamicDataObject.lastUpdateMSec = Date.parse(string);
				} catch(err){dynamicDataObject.lastUpdate = 'no lastUpdate'; dynamicDataObject.lastUpdateMSec = 'no lastUpdate';}
	console.log('scraper.scrape_dynamic_data: EXIT');
			return (dynamicDataObject);
		}

	this.scrape_availability_data = async function(sampleNum, propID, weekLookupArray) {	// *** _id  ***
		// first scrape the availability_calendar, then sample the resulting array
		// return an array of objects that will be written to the database collection bookedWeeks
	console.log('scraper.scrape_availability_data: ENTER');
		const yearArray = await this.scrape_availability_calendar(propID);	// *** _id  ***
		const bookedWeeksArray = await sample_availability_array(yearArray, weekLookupArray, sampleNum, propID); // *** _id  ***
		return(bookedWeeksArray);
	console.log('scraper.scrape_availability_data: EXIT');
	}
	this.scrape_availability_calendar = async function(propID){		// *** _id  ***
		year = [];		// this will be indexed by month names; each name will be associated with a month object
		var monthArray = [];
		var day = {month: '', date: 0, status: false, rate: 0};
		var monthName;
		var tBodyHandle;
		var tRowHandles;
		var columnHandles;
		var rowCount;
		var colCount;
		var availStatusArray;
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
//		const table = loadTable6();		// use this for debug to load the 6 calendar tables in HTML format
//		await page.setContent(table);	// use this for debug rather than going to the URL
//		const url = 'https://www.vacationrentalslbi.com/listing.' + propID;
//	console.log('scraper.scrape_availability_calendar: url = ', url);
//		await page.goto(url); //	2744, 2747, 2748, 2340, 2697, 2694

		// get availability and rate data from the availability calendar on the page
		// get month names and availability status for all dates, store rates (if available) 
		// return the result for subsequent sampling by week
		const tableHandles = await this.page.$$('table[class="table table-condensed table-bordered"]'); // nominally 6 tables, one month each
		const monthCount = await tableHandles.length;
		console.log('scraper.scrape_dynamic_data: monthCount = ', monthCount);
						// for each month, get month name, dates, rate and availability status of each day
						// allow the month array to be larger than the number of days to account for blanks in the calendar
		for(month=0; month < monthCount; month++){		// month loop
			monthArray = [];	// start with an empty array
  			tBodyHandle = await tableHandles[month].$('tbody'); // handle to the table body
  			monthName = await tBodyHandle.$eval('tr > th', node => node.innerText);
  			string = monthName;
  			end = string.indexOf("2023");
 			monthNameString = string.substring(0,end-1);
 	console.log('scraper.scrape_dynamic_data: monthNameString = ', monthNameString);
   			tRowHandles = await tBodyHandle.$$('tr');	// all of the rows within this one table
  			rowCount = await tBodyHandle.$$eval('tr', nodes => nodes.length);
  			colCount = await tRowHandles[2].$$eval('td', nodes => nodes.length);
						//	Build one copy of the array "month" which is rowCount x colCount in size
  						//  each element of the array will contain a day object
  						// day = {date: 0, booked: false, rate: 0};
			for(row = 2; row < rowCount; row++){	// start with 2 to skip over header and day-of-week rows
				rowOffset = (row - 2) * colCount;
				columnHandles = await tRowHandles[row].$$('td');
			// find availablility statuses for one row
				availStatusArray = await tRowHandles[row]
													.$$eval('td', nodes => nodes.map(element=> element.getAttribute("class")));
				for(column = 0; column < colCount; column++){	// day loop
					day = {date: 0, status: false, rate: 0};
					monthIndex = rowOffset + column; // use this to point to day within the month array
			// find date
					dateHandle = await columnHandles[column].$('a');
					if(dateHandle){
						date = await columnHandles[column].$eval('a', node => node.innerText);
					} else {date = ' ';}
			// find rate
					rateHandle = await columnHandles[column].$('div > div > ul > li');
					if(rateHandle){
						rate = await rateHandle.evaluate(rate => rate.innerText);
						rate = await remove_ranges(rate);
					}else{rate = 'no rate';}
			// assemble day object
					day.month = monthNameString; 
					day.date = date;
					day.rate = rate;	// rates[column];
					day.status = availStatusArray[column];
					monthArray[monthIndex] = day;
				} // end of column (day) loop
			}	// end of row loop
  		year[monthNameString] = monthArray;
//   	console.table(year[monthNameString]);
  		targetDay = 21;
   		statusOfDate = year[monthNameString].find(x => x.date == targetDay).status;
  	console.log('scraper.scrape_availability_calendar: year[monthNameString].21 = ', statusOfDate);
//				throw 'exit program';		
  		} // end of for each month loop
//  		statusOfDate = year.August.find(x => x.date === '21').status;
//  			console.log('scraper.scrape_dynamic_data: year.August.21 = ', statusOfDate);
		await browser.close();
		return (year);	// year is an array of of months, each month an array of day objects
	} // end of scrape_availability_calendar	


// build bookedWeeksArray by sampling the yearArray.
// for each sample date of interest, test the availability status of that date in the yearArray
// save only "booked" weeks
// inputs:
// 		yearArray object: day = {year: '', month: '', date: 0, status: false, rate: 0}
// 		weekLookupArray object: {year: , month:  , date: , weekID:  , saturdayDate: }
// output:
// 		bookedWeeksArray object: {sampleNum: , propID: , weekID: , saturdayDate: , rate: }
	function sample_availability_array(yearArray, weekLookupArray, sampleNum, propID){	// *** _id  ***
		bookedWeeksArray = [];
		bookedWeeksCount = 0;
		sampleCount = weekLookupArray.length;
		for(i=0; i< sampleCount; i++){
			monthNameString = weekLookupArray[i].month;
			targetDay = weekLookupArray[i].date;
//console.log('Availabilitt.sample_availability_array: monthNameString = ', monthNameString);
//console.log('Availabilitt.sample_availability_array: targetDay = ', targetDay);
//console.table(yearArray[monthNameString]);
//throw 'abort';
			sampledDate = yearArray[monthNameString].find(x => x.date == targetDay);
			statusOfDate = sampledDate.status;	// this returns "booked", "available", etc.
			if(statusOfDate == 'booked'){
				weekRate = sampledDate.rate;
				bookedWeekObject = {sampleNum: sampleNum, propID: propID, weekID: weekLookupArray[i].weekID // *** _id  ***
									 , saturdayDate: weekLookupArray[i].saturdayDate , rate: weekRate}
				bookedWeeksArray.push(bookedWeekObject);
				bookedWeeksCount++;
			} // end of if statement
		} // end of for loop
		return(bookedWeeksArray);
	}	// end of sample_availability_array()

		// LOW LEVEL FUNCTIONS
		function getMonthNumberFromName(monthName) {
			monthLookup = [];
			monthLookup['May'] = '05';
			monthLookup['June'] = '06';
			monthLookup['July'] = '07';
			monthLookup['August'] = '08';
			monthLookup['September'] = '09';
			monthLookup['October'] = '10';
			monthLookup['November'] = '11';
			/*	monthLookup =  {'January': '01', 'February': '02','March': '03','April': '04','May': '05','June': '06',
					'July': '07','August': '08','September': '09','October': '10','November': '11','December': '12'}; */
			return monthLookup[monthName];
		}
	function remove_ranges(rate){	// remove other text that is embedded with the rate
		innerText = rate;
		start = innerText.indexOf("$");
		innerText = innerText.substr(start+1);	// remove leading characters
		removeEnd = innerText.split("/");		// forward slash is a special character so need to split
		rates = parseInt(removeEnd[0].trim().replaceAll(',', '')); // removeEnd[0] is everything before the "/"
		return rates;
	}
	// timer to wait between property accesses
		sleep = function(ms){
			return new Promise( function(resolve,reject){
				setTimeout( resolve, ms )
			})
		}
		delay_random = function(msMin, msMax){
			ms = Math.floor(Math.random() * (msMax - msMin + 1) + msMin);
			console.log('scraper.delay_random: waiting ' + ms/1000 + ' seconds');
			return new Promise( function(resolve,reject){
				setTimeout( resolve, ms )
			})
		}

}
module.exports = VRLBI_scraper;