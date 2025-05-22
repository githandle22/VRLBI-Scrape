// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

var Db_if = require('./VRLBI_Db_if');
var db_if = new Db_if();

function VRLBI_scraper(){
	// HIGH LEVEL methods called from outside of VRLBI_scraper
			// put all initialization stuff here, pass parameters via initObject
			// test database connection
			// return success or failure
		this.initialize = async function(initObject){
//			const browser = await puppeteer.launch(`headless: "new"`);
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
// propCollection		propActive 	Page 		Action(propColl)	inactiveProp		TYPE  		use
//	present 			set 		valid 		do nothing			test/remove			1 			removeFromPropInactive()
//	present 			clear 		valid 		set propActive		test/remove			2 			removeFromPropInactive()
//  present     		set			error 		clear propActive 	test/add 			3 			addToInactiveProp()
//  present     		clear		error 		clear propActive 	test/add 			4 			addToInactiveProp()
// 	missing 			N/A			valid 		add prop 			test/remove			5 			removeFromPropInactive()
//	missing 			N/A			error 		do nothing 			test/add			6 			addToInactiveProp()
			propIDmin = propertyRangeObject.propIDmin;
			propIDmax = propertyRangeObject.propIDmax;
			this.sampleNum = sampleNum;
			propIDArray = [];
			result = await this.open_browser();		// also opens page
			let propCount = propIDmax - propIDmin + 1;
			let j=0;
			let i=0;
			propID = propIDmin;		// *** _id  ***
			typeCount = [0,0,0,0,0,0,0];
			for(j=0; j<propCount; j++){	// create an indexed array of the property IDs within the target range (min to max)
				propIDArray[j] = propID++;
			}
		console.log('VRLBI_scraper.test_properties_status: initial propCount = ', propCount);
// may want to add a switch to remove one or both of these next two statements to allow for more complete testing
			propIDArray = await db_if.removeActiveProps(propIDArray); // if the property is already active, remove it
		console.log('VRLBI_scraper.test_properties_status: with active properties removed:possible properties = ', propIDArray.length);
			propIDArray = await db_if.removeInactiveProps(propIDArray, this.sampleNum); // if the property is inactive, remove it
			propIDArray = await this.shuffle_prop_list(propIDArray);	// shuffle the array to make it scrape-friendly
			propCount = propIDArray.length;
		console.log('VRLBI_scraper.test_properties_status: adjusted propCount = ', propCount);
		console.log('VRLBI_scraper.test_properties_status: propIDArray = ', propIDArray);
		console.log('VRLBI_scraper.test_properties_status: this.sampleNum = ', this.sampleNum);
			for(i=0; i<propCount; i++){
	console.log('scraper.test_properties_status: completed = ', i, 'remaining = ', propCount-i);
				propID = propIDArray[i];
		console.log('VRLBI_scraper.test_properties_status: current property = ', propID);
		console.log('VRLBI_scraper.test_properties_status: next property = ', propIDArray[i+1]);		
				dbResult = await db_if.readSingleProperty(propID); // if in database, dbResult will be defined
		console.log('*** propID = ',propID, '   dbResult[0] = ',dbResult[0] );
				valid_page_test = await this.go_to_url(propID);	// creates this.page object or returns false if propID is invalid
		console.log('VRLBI_scraper.test_properties_status: valid_page_test = ', valid_page_test);
				if(dbResult[0]){				// property is already in the database
					if(valid_page_test){	// check to see if property page is valid, if so, make sure activeProp is set
						if(dbResult[0].activeProp){
							typeCount[1]++;
							await db_if.removeFromPropInactive(propID);	// make sure prop is not in "bad" list
		console.log('VRLBI_scraper.test_properties_status: TYPE 1');
							}	// TYPE 1: property is already in database and is active
						else{						// TYPE 2: property is in database but needs to be made active
							await db_if.removeFromPropInactive(propID); // make sure prop is not in "bad" list
		console.log('VRLBI_scraper.test_properties_status: TYPE 2');
							dbResult[0].activeProp = true;	
							await db_if.writePropStaticData(dbResult[0]);
							typeCount[2]++;
						}
					}
					else{							// TYPEs 3,4: prop is in database, make sure inactive
							await db_if.addToInactiveProp(propID, sampleNum); // also put property in inactiveProp collection
		console.log('VRLBI_scraper.test_properties_status: TYPE 3');
							dbResult[0].activeProp = false;	
							await db_if.writePropStaticData(dbResult[0]);
							typeCount[3]++;
					}
				}
				else{	// Property is not in the database
					if(valid_page_test){	// TYPE 5: if property page is valid, add to database
//						await db_if.removeFromPropInactive(propIDArray[i]);	// make sure prop is not in "bad" list
		console.log('VRLBI_scraper.test_properties_status: TYPE 5');
//						await db_if.addSingleProperty(dbResult[0], propDynamicPrototype);
						scrapeDataArray = await this.scrape_property(sampleNum, propID);						
						scrapeDataArray[0]._id = propID;
						scrapeDataArray[0].sampleNum = sampleNum;
						scrapeDataArray[0].firstFound = sampleNum;
						scrapeDataArray[0].ofInterest = true;
						scrapeDataArray[0].activeProp = true;						
						result = await this.writePropToDatabase(scrapeDataArray, propID); // write static, booked, and dynamic data
						typeCount[5]++;
					}
					else{typeCount[6]++;	// TYPE 6: prop is not valid, don't add to database
						await db_if.addToInactiveProp(propIDArray[i], sampleNum-1); // also put property in inactiveProp collection
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
			var valid_page_test = false;
			var propID;
			let propsToScrape;
			let sampleNum = await db_if.determine_sampNum(); //!!!!!!
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
			var scanStatusObject = {_id: scanNum, sampleNum: sampleNum,  
								sampleType: scanType,	// either oneProperty, rangeLimit, fullScan
								startTime: d.toLocaleString(), scanTime: null,
								toCrawl: propsToScrape, lastProp: null,
								propCount: 0, badPropCount: badPropCount}
//		console.log('scraper.scan: initial scanStatusObject = ', scanStatusObject);
			await db_if.writeNewScan(scanStatusObject);		// write a new scan document to the collection scanStutus
			console.log('scraper.scan: scraping ', propsToScrape, ' properties');
			result = await this.open_browser();	// this also opens a page
			propScrapedCount = 0;
			for (k=0; k < propsToScrape; k++){	// scrape each property
//				dbResult = await db_if.readSingleProperty(propIDArray[k]); // if in database, dbResult will be defined
				propID = propIDArray[k];
				valid_page_test = await this.go_to_url(propIDArray[k]);	// this.page now contains the scraped page
				console.log('scraper.scan: scraping property number', propID);
				if (valid_page_test) {	// looks like a valid property page; scrape it
					scrapeDataArray = await this.scrape_property(sampleNum, propID); 
					result = await this.writePropToDatabase(scrapeDataArray, propID); // write static, booked, and dynamic data
					propScrapedCount++;
					scanStatusObject.propCount = propScrapedCount;		// count properties that have been successfully scraped
				}
				else {	// property page is invalid; mark property as not-active in propCollection
		console.log('scraper.scan: valid_page_test (false?)', valid_page_test);
					await db_if.updatePropInactive(propIDArray[k], sampleNum);	// this clears the activeProp flag (makes it false)
																	// and adds the property to inactiveProps
					badPropCount = badPropCount++;
					scanStatusObject.badPropCount = badPropCount;
				} // end of else
				d = new Date();
				scanStatusObject.scanTime = d.toLocaleString();
				scanStatusObject.lastProp = propIDArray[k];
//		console.log('scraper.scan: scanStatusObject = ', scanStatusObject);
				await db_if.updateScanStatus(scanStatusObject);		// update the document in scanStatus
				await delay_random(5000,30000); // wait range in mSec between page accesses
			} // end of for loop
//			console.log('VRLBI_scraper.scan: propList = ', propList);
			result = await this.close_browser();
			return (scanStatusObject);
		}

/*		this.build_week_lookup = async function(){		// this is not used here - problem with async function I think
			// once a year, before the first scan, build the weekLookup table
			// write the result to weekLookup
			// return success or failure
			const lookupTable = [
				{ year: '2024', month: 'June', date: '12', weekID: 0, saturdayDate: '6/8/2024' },
				{ year: '2024', month: 'June', date: '19', weekID: 1, saturdayDate: '6/15/2024' },
				{ year: '2024', month: 'June', date: '26', weekID: 2, saturdayDate: '6/22/2024' },
				{ year: '2024', month: 'July', date: '3', weekID: 3, saturdayDate: '6/29/2024' },
				{ year: '2024', month: 'July', date: '10', weekID: 4, saturdayDate: '7/6/2024' },
				{ year: '2024', month: 'July', date: '17', weekID: 5, saturdayDate: '7/13/2024' },
				{ year: '2024', month: 'July', date: '24', weekID: 6, saturdayDate: '7/20/2024' },
				{ year: '2024', month: 'July', date: '31', weekID: 7, saturdayDate: '7/27/2024' },
				{ year: '2024', month: 'August', date: '7', weekID: 8, saturdayDate: '8/3/2024' },
				{ year: '2024', month: 'August', date: '14', weekID: 9, saturdayDate: '8/10/2024' },
				{ year: '2024', month: 'August', date: '21', weekID: 10, saturdayDate: '8/17/2024' },
				{ year: '2024', month: 'August', date: '28', weekID: 11, saturdayDate: '8/24/2024' },
				{ year: '2024', month: 'September', date: '4', weekID: 12, saturdayDate: '8/31/2024' },
				{ year: '2024', month: 'September', date: '11', weekID: 13, saturdayDate: '9/7/2024' },
				{ year: '2024', month: 'September', date: '18', weekID: 14, saturdayDate: '9/14/2024' },
				{ year: '2024', month: 'September', date: '25', weekID: 15, saturdayDate: '9/21/2024' } 
			];
			console.table(lookupTable);
			result = await db_if.writeWeekLookup(lookupTable);
			console.log('scraper.build_week_lookup: result = ', result);
			return (result);
		} */

	// MID LEVEL FUNCTIONS - these methods are only called within VLRBI_scraper()
		this.open_browser = async function(){
			// create the object "this.browser" 
			this.browser = await puppeteer.launch({
  			//headless: 'new',
			headless: false,
			defaultViewport: null,
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']

		});
//			this.browser = browser;
//			this.page = await this.browser.newPage();
			this.page = await this.browser.newPage();

			// Set realistic user agent
			await this.page.setUserAgent(
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
			);

			// Optional: set screen size manually if needed
			await this.page.setViewport({
				width: 1280,
				height: 800
			});

			return('success');
		}
		this.close_browser = async function(){
			// destroy the object "this.browser" 
			await this.browser.close();
			return('success');
		}
this.go_to_url = async function(propID) {
	const url = 'https://www.vacationrentalslbi.com/listing.' + propID;
	let validID = false;
	let attempts = 1;

	while (attempts < 5) {
		try {
			console.log(`Navigating to: ${url} (Attempt ${attempts})`);

			await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

			// Simulate human-like activity
			await this.page.waitForTimeout(1000 + Math.random() * 2000);
			await this.page.mouse.move(200 + Math.random() * 100, 250 + Math.random() * 100);
			await this.page.evaluate(() => window.scrollBy(0, 200));
			await this.page.waitForTimeout(500 + Math.random() * 500);

			// Remove Constant Contact popup (if visible)
			await this.page.evaluate(() => {
				const popup = document.querySelector('.ctct-popup-form');
				if (popup) popup.remove();

				const overlay = document.querySelector('.ctct-popup-overlay');
				if (overlay) overlay.remove();

				const closeBtn = document.querySelector('.ctct-popup-close');
				if (closeBtn) closeBtn.click();
			});

			await this.page.screenshot({
				path: `after_popup_removed_${propID}.png`,
				fullPage: true
			});

			await this.page.waitForSelector('h1', { timeout: 15000 });

			const pageContent = await this.page.content();
			validID = !pageContent.includes("404 - Page not found");

			console.log(`VRLBI_scraper.go_to_url: validID = ${validID}`);
			break;

		} catch (err) {
			console.error(`go_to_url error on attempt ${attempts}:`, err.message);

			await this.page.screenshot({
				path: `error_attempt_${propID}_${attempts}.png`,
				fullPage: true
			});

			attempts++;
			if (attempts === 5) {
				console.error(`Failed to load ${url} after 4 attempts.`);
				validID = false;
			}

			await delay_random(5000, 30000);
		}
	}

	return validID;
};



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
		this.scrape_property = async function(sampleNum, propID){	// *** _id  ***
			// typeOfScrape:
				// may want to just scrape availability data
				// may want to see if static data has changed (once a year, maybe)
			// for this.page, assemble an array summarizing the data scraped from the property page
			// call the lower level functions:
			//		scrape_static_data()					// returns an object
			//		scrape_availability_data(weekLookup)	// returns an array of objects
			//		scrape_dynamic_data()					// returns an object
			// return an array of objects
			let weekLookupArray = await db_if.readWeekLookup();
			let scrapeDataArray = [];
			scrapeDataArray[0] = await this.scrape_static_data(sampleNum, propID); // *** _id  ***				
			availabilityAndRatesArray = await this.scrape_availability_data(sampleNum, propID, weekLookupArray); // *** _id  ***
			if(availabilityAndRatesArray === false){
console.log('VRLBI_scraper: availabilityAndRatesArray === false');				
				scrapeDataArray[1] = false; // no booked weeks available
				scrapeDataArray[2] = await this.scrape_dynamic_data(sampleNum, propID);
				scrapeDataArray[3] = false; // no rates
			}
			else {
console.log('VRLBI_scraper: availabilityAndRatesArray NOT false');			
				scrapeDataArray[1] = availabilityAndRatesArray.bookedWeeks;
				scrapeDataArray[2] = await this.scrape_dynamic_data(sampleNum, propID); // *** _id  ***
				scrapeDataArray[3] = availabilityAndRatesArray.rates; // this was added later
			}							
			return (scrapeDataArray);
		}
		this.scrape_static_data  = async function(sampleNum, propID) {	// *** _id  ***
			// scrape the static data from this.page
			// return the object staticDataObject
//	console.log('scraper.scrape_static_data: ENTER');
			var staticDataObject = {};
			staticDataObject.sampleNum = sampleNum;
			staticDataObject._id = propID;	// *** _id  ***


		var element = await this.page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[1]/h1');

		var string = await element.evaluate(el => el.textContent);
		staticDataObject.propName = string.trim();
console.log('scraper.scan: staticDataObject.propName = ', staticDataObject.propName);
		element = await this.page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[3]/div[1]/div[1]/ul/li[2]/div[2]');
		string = await element.evaluate(el => el.textContent);
		staticDataObject.beds = Number(string.trim()); 
console.log('scraper.scan: staticDataObject.bedrooms = ', staticDataObject.beds);
		element = await this.page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[3]/div[1]/div[1]/ul/li[3]/div[2]');
		string = await element.evaluate(el => el.textContent);
		staticDataObject.baths = string.trim();
		end = string.indexOf(" full");
		staticDataObject.bathsFull = Number(string.substring(0,end).trim());
		start = string.indexOf(",");
		end = string.indexOf(" half");
		staticDataObject.bathsHalf = Number(string.substring(start+1,end).trim());
//console.log('scraper.scan: staticDataObject.bathsHalf = ', staticDataObject.bathsHalf);
		element = await this.page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[3]/div[1]/div[1]/ul/li[1]/div[2]');
		string = await element.evaluate(el => el.textContent);
		staticDataObject.sleeps = Number(string.trim());
//console.log('scraper.scan: staticDataObject.sleeps = ', staticDataObject.sleeps);
		try{
		element = await this.page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[1]/div/div[1]/div/strong');
		string = await element.evaluate(el => el.textContent);
		staticDataObject.propType = string.trim();
		} catch(err){staticDataObject.propType = 'no propType';}
//console.log('scraper.scan: staticDataObject.propType = ', staticDataObject.propType);
		try{
		element = await this.page.waitForSelector('xpath//html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[3]/div[1]/div[7]/div[4]/div/div[2]/div');
		string = await element.evaluate(el => el.textContent);
		staticDataObject.locType = string.trim();
		} catch(err){staticDataObject.locType = 'no locType';}
//console.log('scraper.scan: staticDataObject.locType = ', staticDataObject.locType);
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
//console.log('scraper.scan: staticDataObject.ownPhone = ', staticDataObject.ownPhone);
		staticDataObject.locAddr = '';
		staticDataObject.locLat = '';
		staticDataObject.locLong = '';
		await element.dispose();			
		return (staticDataObject);
//console.log('scraper.scrape_static_data: EXIT');
		} 

		this.scrape_dynamic_data = async function(sampleNum, propID) {	// *** _id  ***
			// scrape the dynamic data from this.page
			// return an object dynamicDataObject
//	console.log('scraper.scrape_dynamic_data: ENTER');
			var dynamicDataObject = {};
			dynamicDataObject.sampleNum = sampleNum;
			dynamicDataObject._id = propID; 	// *** _id  ***
				// I found the selectors used below by opening the page in Chrome, right clicking on the information, selecting "inspect"
				// in the elements window, right clicking above the line where the information appears, selecting "copy" > "copy selector"
				// pasting the copied text, but without the i.class reference 
				try{ // reviews
				var element = await this.page.waitForSelector('#ajax_reviews > div.padding_10px.ld_section > div.reviews.padding_10px > h2 > div > div:nth-child(1)');
				var string = await element.evaluate(el => el.textContent);
				var end = string.indexOf(" Reviews");
				 dynamicDataObject.reviews = Number(string.substring(0,end).trim());
				} catch(err){dynamicDataObject.reviews = 'no reviews';}
//		console.log('scraper.scrape_dynamic_data: reviews = ', dynamicDataObject.reviews);
				try{ // views
				var element = await this.page.waitForSelector('text/View(s)');
//				var element = await this.page.waitForSelector('#overview > div:nth-child(14)'); 
				string = await element.evaluate(el => el.textContent);
				end = string.indexOf(" View(s)");
				dynamicDataObject.views = Number(string.substring(0,end).trim());
				} catch(err){dynamicDataObject.views = 'no views';}
//		console.log('scraper.scrape_dynamic_data: views = ', dynamicDataObject.views);
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
//	console.log('scraper.scrape_dynamic_data: EXIT');
			return (dynamicDataObject);
		}

	this.scrape_availability_data = async function(sampleNum, propID, weekLookupArray) {	// *** _id  ***
		// first scrape the availability_calendar, then sample the resulting array
		// return an array of objects that will be written to the database collection bookedWeeks
//	console.log('scraper.scrape_availability_data: ENTER');
		var yearArray = await this.scrape_availability_calendar(propID);	// *** _id  ***
//console.log('VRLBI_SCRAPER: scrape_availability_data yearArray = ', yearArray);
//throw 'abort';
		var yearLength = Object.keys(year).length
		if(yearLength > 0 ){	// if calendar was successfully scraped
console.log("scraper.scrape_availability_data: yearLength = ", yearLength);
			var bookedWeeksArray = await sample_availability_array(yearArray, weekLookupArray, sampleNum, propID); // *** _id  ***
//	console.log('scraper.scrape_availability_data: EXIT');
			return(bookedWeeksArray);
		} else {	// some properties don't have calendars set up
console.log("scraper.scrape_availability_data: yearLength = ", yearLength, "FAIL !!!!! no availability data");
			var bookedWeeksArray = false;
			return (bookedWeeksArray); // indicate the the calendar was not scraped
		}
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
		const browser = await puppeteer.launch({
  			headless: 'new',
  			// `headless: true` (default) enables old Headless;
  			// `headless: 'new'` enables new Headless;
  			// `headless: false` enables “headful” mode.
		});
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
//		console.log('scraper.scrape_dynamic_data: monthCount = ', monthCount);
						// for each month, get month name, dates, rate and availability status of each day
						// allow the month array to be larger than the number of days to account for blanks in the calendar
		for(month=0; month < monthCount; month++){		// month loop
			monthArray = [];	// start with an empty array
  			tBodyHandle = await tableHandles[month].$('tbody'); // handle to the table body
  			monthName = await tBodyHandle.$eval('tr > th', node => node.innerText);
  			string = monthName;
  			end = string.indexOf("2025");
 			monthNameString = string.substring(0,end-1);
// 	console.log('scraper.scrape_dynamic_data: monthNameString = ', monthNameString);
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
//  		targetDay = 21;
//   		statusOfDate = year[monthNameString].find(x => x.date == targetDay).status;
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
// need to test only current and future months, not past months (for now, adjust starting_point)
// inputs:
// 		yearArray object: day = {year: '', month: '', date: 0, status: false, rate: 0}
// 		weekLookupArray object: {year: , month:  , date: , weekID:  , saturdayDate: }
// output:
// 		bookedWeeksArray object: {sampleNum: , propID: , weekID: , saturdayDate: , rate: }
	function sample_availability_array(yearArray, weekLookupArray, sampleNum, propID){	// *** _id  ***
		bookedWeeksArray = [];
		bookedWeeksCount = 0;
		ratesArray = [];	// build an array containing all weekly rates for this property
		rateObject = {};
		rateObject._id = propID;
		rateObject.sampleNum = sampleNum;
		availabilityAndRatesArray = [];
		starting_point = 0;		// not sure what this magic number is for, seems to change the first week sampled
		sampleCount = weekLookupArray.length;
		for(i=starting_point; i< sampleCount; i++){
			monthNameString = weekLookupArray[i].month;
			targetDay = weekLookupArray[i].date;
//console.log('Availabilitt.sample_availability_array: monthNameString = ', monthNameString);
//console.log('Availabilitt.sample_availability_array: targetDay = ', targetDay);
//console.table(yearArray[monthNameString]);
//throw 'abort';
			sampledDate = yearArray[monthNameString].find(x => x.date == targetDay);
			weekRate = sampledDate.rate;
			statusOfDate = sampledDate.status;	// this returns "booked", "available", etc.
			if(statusOfDate == 'booked'){
				bookedWeekObject = {propID: propID, sampleNum: sampleNum, weekID: weekLookupArray[i].weekID 
									 , saturdayDate: weekLookupArray[i].saturdayDate , rate: weekRate}
				bookedWeeksArray.push(bookedWeekObject);
				bookedWeeksCount++;
			} // end of if statement
			rateObject[i] = weekRate;
		} // end of for loop
console.log("scraper.sample_availability_array: bookedWeeksCount = ", bookedWeeksCount);
		availabilityAndRatesArray.bookedWeeks = bookedWeeksArray;
		availabilityAndRatesArray.rates = rateObject;
//console.log("scraper.sample_availability_array: availabilityAndRatesArray = ", availabilityAndRatesArray);
//throw 'abort';
		return(availabilityAndRatesArray);	
	}	// end of sample_availability_array()
		this.writePropToDatabase = async function(scrapeDataArray, propID) {

			ratesObject = scrapeDataArray[3];				// just the rates for the property
			if(ratesObject === false){}		// do nothing if there is no data to write
			else{
				await db_if.writeRates(ratesObject);
			}
			staticDataObject = scrapeDataArray[0];			// all of the static data for the property
			await db_if.writePropStaticData(staticDataObject);
			bookedWeeksArray = scrapeDataArray[1];		// all of the availability data for the property
console.log("scraper.writePropToDatabase: bookedWeeksArray = ", bookedWeeksArray);
//process.exit();
			if(bookedWeeksArray === false){
				let bookedWeeks = 0;
			} // skip writing bookedWeeks if the calendar was not scraped (not present)
			else{
				await db_if.writePropBookedData(bookedWeeksArray, propID);
				var weeksBooked = bookedWeeksArray.length;		// calculate weeksBooked and dollarsBooked	
			}
			dynamicDataObject = scrapeDataArray[2];			// most of the dynamic data for the property
console.log("scraper.writePropToDatabase: dynamicDataObject (before test) = ", dynamicDataObject);
//process.exit();			
			if(dynamicDataObject === false){}
			else{
				dynamicDataObject.weeksBooked = weeksBooked;	// add additional elements to the dynamic data
				var dollarsBooked = 0;
				var weeksWithNoRate = 0;
				var maxRate = 0;
				for (j=0; j < weeksBooked; j++){
					oneRate = bookedWeeksArray[j].rate;
					if(typeof(oneRate) == "number"){	// not every week has a rate available within the calendar
					dollarsBooked = dollarsBooked + oneRate;
						if(oneRate > maxRate){maxRate = oneRate;}	// find the maximum rate
					}	// else, rate must be "no rate", do don't add it 
					else{weeksWithNoRate++;}
				}
				dynamicDataObject.dollarsBooked = dollarsBooked;
				dynamicDataObject.noRateCount = weeksWithNoRate;
				dynamicDataObject.maxRate = maxRate;
//				let activeProps = this.await db_if.reportActiveProps();
//	console.log('db_if.writePropToDatabase: activeProps = ', activeProps);
//				let inactiveProps = await this.db_if.reportInactiveProps();
//	console.log('db_if.writePropToDatabase: inactiveProps = ', inactiveProps);
console.log("scraper.writePropToDatabase: dynamicDataObject (just before write to DB) = ", dynamicDataObject);
//process.exit();					
				await db_if.writePropDynamicData(dynamicDataObject);			
			}

			return('writePropToDatabase:success');
		}
		this.reportActiveProps = async function(){

		}

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