import './style.css'
import * as d3 from 'd3';

import {
  migrationDataPromise,
  countryCodePromise,
  metadataPromise
} from './data';

import lineChart from './viewmodules/lineChart';

Promise.all([
    migrationDataPromise,
    countryCodePromise,
    metadataPromise
  ])
  .then(([migration, countryCode, metadataMap]) => {

    //Convert metadata to a map

    const migrationAugmented = migration.map(d => {

    const origin_code = countryCode.get(d.origin_name);
    const dest_code = countryCode.get(d.dest_name);

    d.origin_code = origin_code;
    d.dest_code = dest_code;

      //Take the 3-digit code, get metadata record
    const origin_metadata = metadataMap.get(origin_code);
    const dest_metadata = metadataMap.get(dest_code);

    if(origin_metadata){
        d.origin_subregion = origin_metadata.subregion;
    }
    if(dest_metadata){
        d.dest_subregion = dest_metadata.subregion;
    }

    return d;
  });
    
    //Migration from the US (840) to any other place in the world
    //filter the larger migration dataset to only the subset coming from the US
  const data = transform('840', migrationAugmented);

  render(data);

      //build UI for <select> menu

  console.log(countryCode);

  const countryList = Array.from(countryCode.entries());

  console.log(countryList);

  const menu = d3.select('.nav')
         .append('select')

  menu.selectAll('option')
         .data(countryList)
         .enter()
         .append('option')
         .attr('value', d => d[1])
         .html(d => d[0]);

    //define behavior for <select> menu

  menu.on('event', function(){
    console.log(this.value);
     // console.log(this.selectedIndex)

    const idx = this.selectedIndex;
    const display = this.options[idx].innerHTML;
    console.log(display)
    const data = transform(code, migrationAugmented)
    console.log(data)
    render(data);



  })


});


function transform(code, migration){
  const filteredData = migration.filter(d => d.origin_code === code);

  const subregionsData = d3.nest()
      .key(d => d.dest_subregion)
      .key(d => d.year)
      .rollup(values => d3.sum(values, d => d.value))
      .entries(filteredData);

  return subregionsData;

}

function render(data){

  const charts = d3.select('.chart-container')
    .selectAll('.chart')
    .data(data)

  const chartsEnter = charts.enter()
    .append('div')
    .attr('class', 'chart')

  charts.exit().remove();

  charts.merge(chartsEnter)
    .each(function(d){
      lineChart(
        d.values,
        this
        )
    })
}

//Drawing line chart based on serial x-y data
//Function "signature": what arguments are expected, how many, and what they should look like
