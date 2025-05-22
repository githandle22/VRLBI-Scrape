function Test() {
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
	this.test_array = async function(){
  		let wednesdays =[ ];
  		wednesdays = [{month: '05', date: 1}, 
  					{month: '05', date: 9},
  					{month: '07', date: 30},
  					{month: '08', date: 15}];
  		year = '2023';
  		sampNum = 1;
  		propID = 23;

  		augA = [ [1,12000], [9,15000], [31,9000] ];
  		bookedDays = [ {month: '05', date: 1, rate: 12000}, 
  					{month: '05', date: 9, rate: 15000},
  					{month: '07', date: 31, rate: 9000}];
  		bookedDays.push({month: '08', date: 15, rate: 9500});
  		bookedWeeks = filter_booked_weeks(year, sampNum, propID, wednesdays, bookedDays);

  		console.log('APP: wednesdays =', wednesdays);
  		console.log('APP: bookedDays =', bookedDays);
  		console.log('APP: bookedDays[3] =', bookedDays[3]);
  		console.log('APP: bookedDays[3].date =', bookedDays[3].date);
  		console.log('APP: bookedWeeks =', bookedWeeks);
/*  		let record = [];
  		record[0] = [calendarInfo[1].date, calendarInfo[0].date, calendarInfo[1].booked, calendarInfo[0].month];
  		record[1] = [calendarInfo[0].date, calendarInfo[1].date, calendarInfo[0].booked, calendarInfo[1].month]; */
  		let rates = [  ' 09/02/2023 - 09/08/2023$5,700  /Night',
  ' 09/02/2023 - 09/08/2023$5,700  /Week',
  ' 09/02/2023 - 09/08/2023$5,700  /Night',
  ' 09/02/2023 - 09/08/2023$5,700  /Week'
];
}
}
// for a given property, for all applicable weeks (stored in wednesdays), return each booked week as an array bookedWeeks
function filter_booked_weeks(year, sampNum, propID, wednesdays, bookedDays){
	bookedWeeks = [];
	for(j=0; j<wednesdays.length; j++){
	  	for(i=0; i<bookedDays.length; i++){		// go through the array looking for a month/day match
  			if(bookedDays[i].date === wednesdays[j].date){
  				if(bookedDays[i].month === wednesdays[j].month){
  					weekDate = year + '-' + wednesdays[j].month + '-' + wednesdays[j].date;
  					bookedWeeks.push([sampNum, propID, j, weekDate, bookedDays[i].rate]); // if a match exists, extract the pertinent info	
  				}
  			}
  		}
  	}
  	return bookedWeeks;
}


	module.exports = Test;
