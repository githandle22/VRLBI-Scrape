const puppeteer = require('puppeteer');
// const cheerio = require('cheerio');
const fs = require('fs');


function App() {
			this.summary = {
			propName: '',
			bedrooms: '',			// 
			bathrooms: 0,			// 
			sleeps: 0,				// guests that can be accommodated
			propType: '',			// house, condo, etc.
			locType: '',		// e.g. oceanfront
			locTown: '',
			ownName: '',
			ownPhone: '',
			services: [],			// cleaning for example
			locLat: '',
			locLong: ''
		};
	this.test_Puppet = async function(){
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.goto('https://www.vacationrentalslbi.com/listing.2747'); //2744, 2747, 2748, 2340, 2697, 2694
		//let bodyHTML = await page.evaluate(() => document.body.innerHTML);
//		await page.waitForTimeout(10000);


		// get single-item descriptive data about the property
		/*
		element = await page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[1]/h1');
		this.summary.propName = await element.evaluate(el => el.textContent); 
		element = await page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[3]/div[1]/div[1]/ul/li[2]/div[2]');
		this.summary.bedrooms = await element.evaluate(el => el.textContent); 
		element = await page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[3]/div[1]/div[1]/ul/li[3]/div[2]');
		this.summary.bathrooms = await element.evaluate(el => el.textContent);
		element = await page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[3]/div[1]/div[1]/ul/li[1]/div[2]');
		this.summary.sleeps = await element.evaluate(el => el.textContent);
		element = await page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[1]/div/div[1]/div/strong');
		this.summary.propType = await element.evaluate(el => el.textContent);
		element = await page.waitForSelector('xpath//html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[3]/div[1]/div[7]/div[4]/div/div[2]/div');
		this.summary.locType = await element.evaluate(el => el.textContent);
		element = await page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[1]/div/div[1]/div');
		this.summary.locTown = await element.evaluate(el => el.textContent);
		element = await page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[2]/div[2]/div/div[1]/ul/li[1]');
		this.summary.ownName = await element.evaluate(el => el.textContent);
		element = await page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[2]/div[2]/div/div[1]/ul/li[3]/a');
		this.summary.ownPhone = await element.evaluate(el => el.textContent);
		await element.dispose(); 
		*/
		// get table-based data about the property
		// first get rates
		const foundServices = await page.evaluate(() => window.find("Services")); // check to see if the services section is displayed

		// const divCount = await page.$$eval('div[class="col-md-6 col-xs-6 fb_cell"]', divs => divs.length);  // class="fa fa-home"
		console.log('APP: foundServices =', foundServices);
		if (foundServices){
			element = await page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[3]/div[1]/div[7]/div[11]/div/div[1]');
			test = await element.evaluate(el => el.textContent);
			console.log('APP: test =', test);
		}
		// put the header information from the RATES table in an array
		// https://stackoverflow.com/questions/49236981/want-to-scrape-table-using-puppeteer-how-can-i-get-all-rows-iterate-through-ro
		  const headerInfo = await page.evaluate(() => {
			const ths = Array.from(document.querySelector('div[class="listing_rates table-responsive"]')
														.querySelectorAll('table tr th'));// for the table, for each row, header
//    		const tds = Array.from(document.querySelectorAll('table tr td'))
    		return ths.map(td => td.innerText);
  		});
  		// put the contents of the RATES table in an array
  		const tableData = await page.evaluate(() => {
			const tds = Array.from(document.querySelector('div[class="listing_rates table-responsive"]')
														.querySelectorAll('table tr td')); // for the table, for each row, data
//    		const tds = Array.from(document.querySelectorAll('table tr td'))
    		return tds.map(td => td.innerText);
  		}); 
  		// put the contents of AVAILABILITY into an array, inlcudes both rates and availability
  		// 


  		rates = await page.evaluate(() => {
			const tdd = Array.from(document.querySelectorAll('div[class="popover_html"] ul li')); // 
    		return tdd.map(td => td.innerText);		//td.innerText
  		});  	
		
  		bookedDates = await page.evaluate(() => {	
  			const dateSelector = 'td.booked > a';
			const tdd = Array.from(document.querySelectorAll(dateSelector)); // 
    		return tdd.map(td => td.innerText);		//td.innerText
  		});
  		
 		const dates = await page.evaluate(() => {
 			const dateSelector = 
 								'td.booked, td.available_booked_arrival, td.booked_departure_available, td.available,' + 
  		 							'td.unknown, td.booked_departure_unknown, td.unknown_booked_arrival, td.booked_booked, ' +
  		 							'td.booked_pending_arrival, td.pending, td.pending_booked_arrival';
			const tds = Array.from(document.querySelectorAll(dateSelector)); // , td[class="available_booked_arrival"], td[class=booked"], td[class="booked_departure_available"],td[class="available"]
    		
    		return tds.map(td => td.innerText);
  		}); 
  		let rates = [];
  		rates = await page.evaluate(() => {	
  			rate_node = 'td.booked div > div > ul > li';
			const arr = Array.from(document.querySelectorAll('table[class="table table-condensed table-bordered"]')[3]
							.querySelectorAll('td.booked div  div  ul  li'));
    		return arr.map(td => td.innerText);		//td.innerText
  		}); 
  		rates = await remove_ranges(rates);	// strip out the extra charachters that are rate date ranges

  		// This extracts the Month and Year from the calendar (typically 6 months)
 		const month = await page.evaluate(() => {
			const arr = Array.from(document.querySelectorAll('table[class="table table-condensed table-bordered"]')[3]
							.querySelectorAll('tbody > tr > th'));
			return arr.map(th => th.innerText);	
    		//return arr.map(th => th.tbody.tr.th.innerText);
  		});	
  		end = month[0].indexOf("2023");
 		month[0] = month[0].substr(0,end-1);
 		bookedDates = await page.evaluate(() => {	
  			const dateSelector = 'td.booked > a';
			const tdd = Array.from(document.querySelectorAll('table[class="table table-condensed table-bordered"]')[3]
								.querySelectorAll(dateSelector)); // 
    		return tdd.map(td => td.innerText);		//td.innerText
  		});
		console.log('APP: headerInfo =', headerInfo);
		console.log('APP: tableData =', tableData);
		console.log('APP: headerInfo.length = ', headerInfo.length);
		console.log('APP: headerInfo[9] = ', headerInfo[9]);  // offset to first date = 9
		console.log('APP: tableData.length = ', tableData.length);
		console.log('APP: tableData[8] = ', tableData[7]); // offset to first rate = 7, add 8 for each subsequent rate
		console.log('APP: rates.length = ', rates.length);
		console.log('APP: month =', month);
		console.log('APP: bookedDates =', bookedDates);
//		console.log('APP: writing file now');
		console.log('APP: rates =', rates);
//		let bodyHTML = await page.evaluate(() => document.body.innerHTML);
//		const bodyHTML = await page.evaluate(() => document.querySelector('*').outerHTML);
//		bodyHTML = await page.content();
/*		fs.writeFile('webpage.txt', bodyHTML, err => {		//document.html()
  			if (err) {
    			console.error(err);
  			}
  			// file written successfully
		});		*/

		/* might want to use this code as reference
		const rawData = await page.evaluate(() => {
      		let data = [];
      		let table = document.getElementByClassName('listing_rates table-responsive');
      		for (var i = 1; i < table.rows.length; i++) {
        		let objCells = table.rows.item(i).cells;
        		let values = [];
        		for (var j = 0; j < objCells.length; j++) {
          			let text = objCells.item(j).innerHTML;
          			values.push(text);
        		}
        		let d = { i, values };
        		data.push(d);
      		}
      		console.log('APP: data = ', data);
      	}
      	*/
		await browser.close();
		return ('success');
} // end of test_Puppet
}	// end of APP
function remove_ranges(rates){
	let innerText = '';
	let length = rates.length;
	for(i=0; i<length; i++){
		innerText = rates[i];
		start = innerText.indexOf("$");
		innerText = innerText.substr(start+1);	// remove leading characters
		removeEnd = innerText.split("/");		// forward slash is a special character so need to split
		rates[i] = parseInt(removeEnd[0].trim().replaceAll(',', '')); // removeEnd[0] is everything before the "/"
	}
	return rates;
}
// build array bookedDays from the page using day objects: {month: '05', date: 1, rate: 12000}
// for each calendar month (table[class="table table-condensed table-bordered"]), save all days tagged "booked"
async function scrape_booked_days(page){
	bookedDays = [];
 	const monthCount = await page.evaluate(() => {
		const arr = Array.from(document.querySelectorAll('table[class="table table-condensed table-bordered"]')
							.querySelectorAll('tbody > tr > th'));
			return arr.map(th => th.innerText).length;	
  	});
  	for(j=0; j<monthCount; j++){	// for each month, get date and rate for each of the booked days
  		 	console.log('APP: monthCount = ', monthCount);
/*  		 	monthBookedDates = await page.evaluate((j) => {	
  			const dateSelector = 'td.booked > a';
			const tdd = Array.from(document.querySelectorAll('table[class="table table-condensed table-bordered"]')[j]
								.querySelectorAll(dateSelector)); // 
    		return tdd.map(td => td.innerText);		//td.innerText
  		}); */

  	}

}
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
module.exports = App;
