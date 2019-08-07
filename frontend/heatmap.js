/* HEADER - Cantata One
   text - Imprima
*/
var width = 900;
var height = 600;
var margin = {top: 30, right: 50, bottom: 150, left: 90};
var colors = ["#b2192d", "#d91e36", "#d7656e","#d5beb3", "#d4f4dd", "#75d9cc","#17bebb","#0e7c7b"];
var months = ["January","February","March","April","May","June","July", "August","September","October","November","December", ""]
var xTranslate = height -margin.bottom;
var legend_marg = margin.bottom - margin.top;
var legend_rect_height = 20;
var legend_rect_width = legend_rect_height * 1.618;

var xScale = d3.scaleBand().range([margin.left, width - margin.right]);
var yScale = d3.scaleBand().range([margin.top, height -margin.bottom]);
var xAxis = d3.axisBottom().scale(xScale).tickFormat(d3.format("d")).tickSize(0);
var yAxis = d3.axisLeft().scale(yScale).tickFormat((d, i)=> months[i]).tickSize(0);
var tempScale = d3.scaleLinear().range([ colors.length -1, 0]);

var dropdown = d3.selectAll("#d3-dropdown");
var tooltip = d3.selectAll("body").append("div").attr("id", "tooltip");
var svg = d3.select(".container")
  .append("svg").attr("class", "svg")
  .attr("height", height).attr("width", width);
svg.append("g").attr("id", "x-axis").attr("transform", "translate(0," + xTranslate + ")");
svg.append("g").attr("id", "y-axis").attr("transform", "translate("+ margin.left+ ",0)");

var legend = svg.selectAll("#legend")
  .data(colors)
  .enter()
  .append("g")
  .attr("id", "legend");

legend
  .append("rect")
  .attr("fill", (d, i)=>d)
  .attr("class", "legend_rect")
  .attr("x", (d, i)=> width -margin.left - i * legend_rect_width)
  .attr("y", height - legend_marg)
  .attr("width", legend_rect_width)
  .attr("height", legend_rect_height);

var legend_text =   legend.append("text")
    //.text((d, i)=>d3.format("0.2n")(tempScale.invert(i)))
    .attr("x", (d, i)=> width -margin.left - i * legend_rect_width + legend_rect_width /2)
    .attr("y", height - legend_marg + legend_rect_width)
    .attr("text-anchor", "middle");


///////////////////////////////////////////////////////////////////////////////////
// functions
function update_paragraph_text(id, text = "Z-Score For Monthly Temperature", padding_left=margin.left){
  d3.selectAll(id)
    .text(text)
    .style("padding-left", padding_left + "px");
}

function monthly_temp_arrays(data, months_unique){
  var temp_arrays = {};
  months_unique.forEach(function(m) {
    temp_arrays[m] = []
  })
  data.forEach(function(d) {
    temp_arrays[ d["month"] -1].push(parseFloat(d["t"]))
  })
  return temp_arrays
};

function calc_monthly_temp_mean(temp_arrays){
  var monthly_mean_temp = {};
  for (key in temp_arrays){
    sum = temp_arrays[key].reduce(function(a, b) { return a + b; });
    len = temp_arrays[key].length;
    monthly_mean_temp[key] = sum /  len;
  }
  return monthly_mean_temp
}

function calc_monthly_temp_sd(temp_arrays){
  var monthly_sd_temp = {};
  for (key in temp_arrays){
    monthly_sd_temp[key] = d3.deviation(temp_arrays[key])
  }
  return monthly_sd_temp
}

function z_standarize(temp, m, monthly_mean_temp, monthly_sd_temp){
  month = m -1
  return (temp - monthly_mean_temp[month]) / monthly_sd_temp[month]
}

function display_tooltip(html_text){
  tooltip
    .style("left", d3.event.pageX -margin.right + "px")
    .style("top", d3.event.pageY - margin.left + "px")
    .style("display", "inline-block")
    .html(html_text);
}

function hide_tooltip(d){
  tooltip.style("display", "none");
}

function get_unique_month_numbers(list_of_months){
  return Array.from(new Set(list_of_months)).sort(function(a,b) { return a - b; })
}

function call_x_y_axis(){
  d3.selectAll("#x-axis").call(xAxis);
  d3.selectAll("#y-axis").call(yAxis);
}

//main function to visualize
function update_svg(data){
  var xYears = data.map((d)=>parseInt(d["year"]));
  var yMonths = data.map((d)=>parseInt(d["month"]) -1);

  //-----------------------------------------
  // 1. TITLE & SVG
  update_paragraph_text("#title")
  update_paragraph_text("#description", text = "Calculated for " + d3.min(xYears) + " - " +  + d3.max(xYears))

  //-----------------------------------------
  // 2. SCALE & AXIS
  let months_unique = get_unique_month_numbers(yMonths)
  let years_unique = get_unique_month_numbers(xYears);
  console.log(years_unique)
  xScale.domain(years_unique);
  yScale.domain(months_unique);
  call_x_y_axis();

  //-----------------------------------------
  // 3. HEATMAP
  // calculate mean temperature for each month over the years
  var monthly_mean_temp = calc_monthly_temp_mean(monthly_temp_arrays(data, months_unique));
  var monthly_sd_temp = calc_monthly_temp_sd(monthly_temp_arrays(data, months_unique));

  var temp = data.map((d)=>parseFloat(z_standarize(d["t"], d["month"],monthly_mean_temp, monthly_sd_temp)));
  tempScale.domain([d3.min(temp), d3.max(temp)]);

  var sqr_height = (height - margin.bottom - margin.top) / (d3.max(yMonths) - d3.min(yMonths) +1)
  var sqr_width = (width - margin.left - margin.right) / (d3.max(xYears) - d3.min(xYears)+ 1)
  var sqare = svg.selectAll(".cell")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "cell");

  sqare.attr("x", (d)=>xScale(d["year"]))
    .attr("y", (d) => yScale(d["month"]- 1))
    .attr("width", sqr_width)
    .attr("height", sqr_height)
    .attr("data-month", (d) => d["month"] -1)
    .attr("data-year", (d) => d["year"])
    .attr("data-temp", (d) => z_standarize(d["t"], d["month"], monthly_mean_temp, monthly_sd_temp))
    .attr("fill",(d) => colors[parseInt(tempScale(z_standarize(d["t"], d["month"],
     monthly_mean_temp, monthly_sd_temp)))]);

  //-----------------------------------------
  // 4. LEGEND
  legend_text.text((d, i)=>d3.format("0.2n")(tempScale.invert(i)));
  //-----------------------------------------
  // 5. TOOLTIP
  d3.selectAll(".cell")
    .on("mouseover", function(d){
      html_text = "Date: " + d["year"] + ", " + months[d["month"] - 1] + "<br>Temp: " + d3.format(".3")(d["t"]) + "<br>Deviation:" + d3.format(".3")(z_standarize(d["t"], d["month"], monthly_mean_temp, monthly_sd_temp)) + "℃"
      display_tooltip(html_text)
      d3.select(this).style("stroke-width", 2).style("stroke", "black");
    })
    .on("mouseout", function(d){
      hide_tooltip(d)
      d3.select(this).style("stroke-width", 0);
    });
}


///////////////////////////////////////////////////////////////////////////////////
// display chart
d3.csv("preprocessed_csv/stockholm_mean.csv")
.then(function(data){update_svg(data)});

dropdown.on("change",function(){
  let selected = d3.selectAll("#d3-dropdown").node().value;
  d3.csv(selected).then(function(data){
    d3.selectAll(".cell").remove();
    update_svg(data)
  });
});
