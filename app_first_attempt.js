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
		await page.goto('https://www.vacationrentalslbi.com/listing.2694'); //2744, 2747, 2748, 2340, 2697, 2694
		//let bodyHTML = await page.evaluate(() => document.body.innerHTML);
//		await page.waitForTimeout(10000);

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

		await scrape_booked_days(page.html);
		console.log('APP: month =', month);
		console.log('APP: bookedDates =', bookedDates);
//		console.log('APP: writing file now');
		console.log('APP: rates =', rates);
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

			element = await page.waitForSelector('xpath/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div/div[3]/div[1]/div[7]/div[11]/div/div[1]');
			test = await element.evaluate(el => el.textContent);
			console.log('APP: test =', test);
/*
 	const monthCount = await page.evaluate(() => {
		const arr = Array.from(document.querySelectorAll('table[class="table table-condensed table-bordered"]')
							.querySelectorAll('tbody > tr > th'));
			return arr.map(th => th.innerText).length;	
  	});
  	console.log('APP: monthCount = ', monthCount);
  	for(j=0; j<monthCount; j++){	// for each month, get date and rate for each of the booked days 		 
  	*/	
/*  		 	monthBookedDates = await page.evaluate((j) => {	
  			const dateSelector = 'td.booked > a';
			const tdd = Array.from(document.querySelectorAll('table[class="table table-condensed table-bordered"]')[j]
								.querySelectorAll(dateSelector)); // 
    		return tdd.map(td => td.innerText);		//td.innerText
  		}); */

//  	}

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
/*
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
  		*/
