/* HEADER - Cantata One
   text - Imprima
*/
var width = 900;
var height = 600;
var margin = {top: 50, right: 50, bottom: 150, left: 90};
var colors = ["#b2192d", "#d91e36", "#d7656e","#d5beb3", "#d4f4dd", "#75d9cc","#17bebb","#0e7c7b"];
var months = ["January","February","March","April","May","June","July", "August","September","October","November","December", ""]


d3.csv("warsaw_weather.csv")
.then(function(data){
  var xYears = data.map((d)=>parseInt(d["year"]));
  var yMonths = data.map((d)=>parseInt(d["month"]) -1);

  //-----------------------------------------
  // 1. TITLE & SVG
  d3.select(".container")
    .append("h1")
    .text("Monthly Global Land-Surface Temperature")
    .attr("id", "title");

 d3.select(".container")
    .append("h2")
    .text("2012-2019 average monthly temperature")
    .attr("id", "description");

  var svg = d3.select(".container")
    .append("svg")
    .attr("height", height)
    .attr("width", width);

  //-----------------------------------------
  // 2. SCALE & AXIS
  var xTranslate = height -margin.bottom;
  let months_unique = Array.from(new Set(yMonths)).sort(function(a,b) { return a - b; });

  var xScale = d3.scaleLinear()
    .domain([d3.min(xYears), d3.max(xYears) +1])
    .range([margin.left, width - margin.right]);
  var yScale = d3.scaleBand()
    .domain(months_unique)
    .range([margin.top, height -margin.bottom]);
  var xAxis = d3.axisBottom().scale(xScale)
    .tickFormat(d3.format("d"));
  var yAxis = d3.axisLeft().scale(yScale)
    .tickFormat((d, i)=> months[i]);

  svg.append("g").call(xAxis)
    .attr("transform", "translate(0," + xTranslate + ")").attr("id", "x-axis");
  svg.append("g").call(yAxis)
    .attr("transform", "translate("+ margin.left+ ",0)")
    .attr("id", "y-axis");

  //-----------------------------------------
  // 3. HEATMAP
  var temp = data.map((d)=>parseFloat(d["average_temp"]));
  var tempScale = d3.scaleLinear()
    .domain([d3.min(temp), d3.max(temp)])
    .range([ colors.length -1, 0]);

  var sqr_height = (height - margin.bottom - margin.top) / (d3.max(yMonths) - d3.min(yMonths) +1)
  var sqr_width = (width - margin.left - margin.right) / (d3.max(xYears) - d3.min(xYears)+ 1)
  var sqare = svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect");

  sqare.attr("x", (d)=>xScale(d["year"]))
    .attr("y", (d) => yScale(d["month"]- 1))
    .attr("width", sqr_width)
    .attr("height", sqr_height)
    .attr("class", "cell")
    .attr("data-month", (d) => d["month"] -1)
    .attr("data-year", (d) => d["year"])
    .attr("data-temp", (d) => d["average_temp"])
    .attr("fill",(d) => colors[parseInt(tempScale(d["average_temp"]))]);

  //-----------------------------------------
  // 4. LEGEND
  var marg = margin.bottom - margin.top
  var rect_height = 20;
  var rect_width = rect_height * 1.618;

  var legend = svg.selectAll("#legend")
    .data(colors)
    .enter()
    .append("g")
    .attr("id", "legend");

  legend
    .append("rect")
    .attr("fill", (d, i)=>d)
    .attr("class", "legend_rect")
    .attr("x", (d, i)=> width -margin.left - i * rect_width)
    .attr("y", height - marg)
    .attr("width", rect_width)
    .attr("height", rect_height);

  legend
    .append("text")
    .text((d, i)=>d3.format("0.2n")(tempScale.invert(i)))
    .attr("x", (d, i)=> width -margin.left - i * rect_width + rect_width /2)
    .attr("y", height - marg + rect_width)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-family", "Imprima");

  //-----------------------------------------
  // 5. TOOLTIP
  var tooltip = d3.selectAll("body")
    .append("div")
    .attr("id", "tooltip")
    .style("height", 40 + "px");

  d3.selectAll(".cell")
    .on("mouseover", function(d){
      tooltip
        .style("left", d3.event.pageX -margin.right + "px")
        .style("top", d3.event.pageY - margin.left + "px")
        .style("display", "inline-block")
        .attr("data-year", d["year"])
        .html("Date: " + d["year"] + ", " + months[d["month"] - 1] + "<br>Temp: " + d["average_temp"]);

      d3.select(this).style("stroke-width", 2)
      .style("stroke", "black");
  })
    .on("mouseout", function(d){
      tooltip.style("display", "none");
    d3.select(this).style("stroke-width", 0);
  });

});
