const puppeteer = require('puppeteer');

function App1(){
	this.test_handles = async function(){
			browser = await puppeteer.launch();
			this.browser = browser;
				this.page = await this.browser.newPage();
				const url = 'https://www.vacationrentalslbi.com/listing.' + 2744;
				await this.page.goto(url);
				// I found the selectors used below by opening the page in Chrome, right clicking on the information, selecting "inspect"
				// in the elements window, right clicking above the line where the information appears, selecting "copy" > "copy selector"
				// pasting the copied text, but without the i.class reference 
				try{ // reviews
				var element = await this.page.waitForSelector('#ajax_reviews > div.padding_10px.ld_section > div.reviews.padding_10px > h2 > div > div:nth-child(1)');
				var string = await element.evaluate(el => el.textContent);
				var end = string.indexOf(" Reviews");
				var reviews = Number(string.substring(0,end).trim());
				} catch(err){var reviews = 'no reviews';}
		console.log('APP.test_handles: reviews = ', reviews);
				try{ // views
				var element = await this.page.waitForSelector('text/View(s)');
//				var element = await this.page.waitForSelector('#overview > div:nth-child(14)'); 
				string = await element.evaluate(el => el.textContent);
				end = string.indexOf(" View(s)");
				var views = Number(string.substring(0,end).trim());
				} catch(err){var views = 'no views';}
		console.log('APP.test_handles: views = ', views);
				try{ // last update
				var element = await this.page.$('text/Calendar Updated');
//				var element = await this.page.waitForSelector('#overview > div:nth-child(14)');
				string = await element.evaluate(el => el.textContent);
      	start = string.indexOf(": ");
      	end = start+12;
      	string = string.substring(start+1,end).trim();
				lastUpdate = string;
				lastUpdateMSec = Date.parse(string);
				} catch(err){var lastUpdate = 'no lastUpdate';}
		console.log('APP.test_handles: lastUpdate = ', lastUpdate);

				try{ // services
				var element = await this.page.$('text/Services');
				element = await element.nextSibling.$('div');
//				var element = await this.page.waitForSelector('#overview > div:nth-child(14)'); 
				string = await element.evaluate(el => el.textContent);
				} catch(err){string = 'no services';}
		console.log('APP.test_handles: services = ', string);		
		await browser.close();
		return(reviews, views, lastUpdate);
	}

	  const table = `<table class="table table-condensed table-bordered">
	<tbody>
		<tr>
			<th colspan="7">May&nbsp;2023</th>
		</tr>
		<tr>
			<td class="weekday">Su</td>
			<td class="weekday">Mo</td>
			<td class="weekday">Tu</td>
			<td class="weekday">We</td>
			<td class="weekday">Th</td>
			<td class="weekday">Fr</td>
			<td class="weekday">Sa</td>
		</tr>
		<tr>
			<td>&nbsp;</td>
			<td class="booked_departure_available">
				<a href="#" class="rate_popover" title="Rates">1</a>
				<div class="popover_html_box">
					<div class="popover_html">
						<ul>
							<li> 
								<strong>04/29/2023 - 05/25/2023</strong>
								$1,100  /Night
							</li>
						</ul>
					</div>
				</div>
			</td>
			<td class="available">
				<a href="#" class="rate_popover" title="Rates">2</a>
				<div class="popover_html_box">
					<div class="popover_html">
						<ul>
							<li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li>
						</ul>
					</div>
				</div>
			</td>
			<td class="available">
				<a href="#" class="rate_popover" title="Rates">3</a>
				<div class="popover_html_box">
					<div class="popover_html">
						<ul>
							<li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li>
						</ul>
					</div>
				</div>
			</td>
			<td class="available"><a href="#" class="rate_popover" title="Rates">4</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">5</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">6</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td></tr><tr><td class="available"><a href="#" class="rate_popover" title="Rates">7</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">8</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">9</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">10</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">11</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">12</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">13</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td></tr><tr><td class="available"><a href="#" class="rate_popover" title="Rates">14</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">15</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">16</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">17</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">18</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">19</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">20</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td></tr><tr><td class="available"><a href="#" class="rate_popover" title="Rates">21</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">22</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">23</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">24</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">25</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>04/29/2023 - 05/25/2023</strong>$1,100  /Night</li></ul></div></div></td><td class="available_booked_arrival"><a href="#" class="rate_popover" title="Rates">26</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>05/26/2023 - 05/29/2023</strong>$1,400  /Night</li></ul></div></div></td><td class="booked"><a href="#" class="rate_popover" title="Rates">27</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>05/26/2023 - 05/29/2023</strong>$1,400  /Night</li></ul></div></div></td></tr><tr><td class="booked"><a href="#" class="rate_popover" title="Rates">28</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>05/26/2023 - 05/29/2023</strong>$1,400  /Night</li></ul></div></div></td><td class="booked_departure_available"><a href="#" class="rate_popover" title="Rates">29</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>05/26/2023 - 05/29/2023</strong>$1,400  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">30</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>05/30/2023 - 06/02/2023</strong>$1,200  /Night</li></ul></div></div></td><td class="available"><a href="#" class="rate_popover" title="Rates">31</a><div class="popover_html_box"><div class="popover_html"><ul><li> <strong>05/30/2023 - 06/02/2023</strong>$1,200  /Night</li></ul></div></div></td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table>`;
/*
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
//	await page.goto('https://www.vacationrentalslbi.com/listing.2748'); //2744, 2747, 2748, 2340, 2697, 2694
	await page.setContent(table);
  const tableHandle = await page.$('table[class="table table-condensed table-bordered"]'); //
  const tBodyHandle = await tableHandle.$('tbody');
  const monthName = await tBodyHandle.$eval('tr > th', node => node.innerText);
  const tRowHandles = await tBodyHandle.$$('tr');	// all of the rows within this one table
  const rowCount = await tBodyHandle.$$eval('tr', nodes => nodes.length);
  const colCount = await tRowHandles[2].$$eval('td', nodes => nodes.length);
  const oneRowHandle = await tRowHandles[2];		// select one row from the table
  const oneRow = await oneRowHandle.$$eval('td', nodes => nodes.map(n => n.innerText));	// this text contains rate data
  const dates = await tRowHandles[2].$$eval('td > a', nodes => nodes.map(n => n.innerText)); // this text is the day of the month
  console.log( 'monthName = ', monthName );
  console.log( 'rowCount = ', rowCount );
  console.log( 'colCount = ', colCount );
  console.log( 'oneRow = ', oneRow );
  console.log( 'date = ', dates );
  await browser.close();
  return(rowCount);
  */
//	 There are 6 occurences of 'table[class="table table-condensed table-bordered"]' on the page
//	 Each represent a calendar month.
//	 First I want to find all occurrences and confirm the quantity (6?)
// At this point, my problem is that I don't know how to properly extract information from “page”
// The text in yellow is intended to show what I want to do but don't know how to do.
// I have some understanding that the “page” that Puppeteer produced has handles to information, but that I need to “evaluate” the handles in 
// order to do something with the information. In my case, I'm usually looking for the innerText or a count of elements (e.g. rows in a table).
// In one case I want to determine if the class of the element matches my target ('class = booked').

/*
		year = [May: , June: , July: , August: , September: , October: ];
		month = [];
		day = {date: 0, booked: false, rate: 0};
		month_handles = querySelectAll(table[class="table table-condensed table-bordered"]);
		month_count = month_handles.length;
		for(i=0; i<month_count; i++){
			month_name = get_month_name(){
				month_handles.querySelector('tbody > tr > th')); // step down to the table header (which is in the first row)
				return arr.map(th => th.innerText);	// pull the month name out of the inner text
			}
//			Determine the size to make array "month" (size: rows x columns) 
//					... quantity of rows may be 4,5,or 6 , columns will be 7
//				determine number of rows
					row_handles = year_handles.querySelectAll('tbody > tr ');	// point to all the rows in a talble
					row_count = row_handles.length-2;	// first two rows are 1) month name 2) day-of-week
//				determine number of columns 			// probably can assume that this will always be 7
					column_handles = row_handles[2].querySelectAll('td')   // point to all the columns of row[2]
					column_count = column_handles.length;
//			Build one copy of the array "month"
				for(row = 0; row < row_count; row++){
					for(column = 0; column < column_count; column++){
					     date = get_date(){
						date_text = evaluate(querySelector(table > tbody > tr[row] > td[column]).innerText)
							return date_text; // should be 1 through 31 or undefined
					     }
						if(0< date < 32) { // if valid date, get status and rate
							booked_status = get_booked_status(){
								booked_handle = querySelector(table > tbody > tr[row] > td[column])
								if (booked_handle.class = 'booked'){
									booked = true;
								}else{booked = false;}
								return booked; 
							}
							rate = get_rate(){
							           rate_string = evaluate(querySelector('td.booked div  div  ul  li').innerText)
							           return convertToInteger(rate_string)
							}	// end of get_rate
						day.booked = booked_status;
						day.rate = rate;
						month[date] = day;	// insert the day object into the month array
						}	// end of if(0< date < 32)
					}  // end of column for loop
				} // end of row for loop
			year[month_name] = month; 	// add the month to the year array
		}	// end of month for loop
*/

  /*
		const result = await page.$$eval('table[class="table table-condensed table-bordered"]',
			function(){
  				return Array.from(month, row => {
    				const columns = month.querySelectorAll('tr');
    		return columns.length;
  		});
  			console.log('APP: data from inside result =  ',result );
  			console.log('APP: data from inside result: result.length =  ',result.length );
  		}
*/


}
module.exports = App1;

/*
		const result = await page.$$eval(
			function(){
  				const month = document.querySelectorAll('table[class="table table-condensed table-bordered"]');
  				return Array.from(month, row => {
    		const columns = month.querySelectorAll('td.booked > a');
    		return Array.from(columns, column => column.innerText);
  		});
  		*/