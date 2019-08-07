/* HEADER - Cantata One
   text - Imprima
*/
var width = 900;
var height = 600;
var margin = {top: 30, right: 50, bottom: 150, left: 90};
var colors = ["#b2192d", "#d91e36", "#d7656e","#d5beb3", "#d4f4dd", "#75d9cc","#17bebb","#0e7c7b"];
var months = ["January","February","March","April","May","June","July", "August","September","October","November","December", ""]
var xTranslate = height -margin.bottom;
var dropdown = d3.selectAll("#d3-dropdown");


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

function z_standarize(value, m, monthly_mean_temp, monthly_sd_temp){
  month = m -1
  return (value - monthly_mean_temp[month]) / monthly_sd_temp[month]
}


///////////////////////////////////////////////////////////////////////////////////
// initial chart
d3.csv("preprocessed_csv/stockholm_mean.csv")
.then(function(data){
  var xYears = data.map((d)=>parseInt(d["year"]));
  var yMonths = data.map((d)=>parseInt(d["month"]) -1);

  //-----------------------------------------
  // 1. TITLE & SVG
  update_paragraph_text("#title")
  update_paragraph_text("#description", text = "Calculated for " + d3.min(xYears) + " - " +  + d3.max(xYears))

  var svg = d3.select(".container")
    .append("svg")
    .attr("class", "svg")
    .attr("height", height)
    .attr("width", width);

  //-----------------------------------------
  // 2. SCALE & AXIS

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
    .tickFormat((d, i)=> months[i])
    .tickSize(0);

  svg.append("g").call(xAxis).attr("id", "x_axis")
    .attr("transform", "translate(0," + xTranslate + ")").attr("id", "x-axis");
  svg.append("g").call(yAxis)
    .attr("transform", "translate("+ margin.left+ ",0)")
    .attr("id", "y-axis");

  //-----------------------------------------
  // 3. HEATMAP
  // calculate mean temperature for each month over the years

  var monthly_mean_temp = calc_monthly_temp_mean(monthly_temp_arrays(data, months_unique));
  var monthly_sd_temp = calc_monthly_temp_sd(monthly_temp_arrays(data, months_unique));

  var temp = data.map((d)=>parseFloat(z_standarize(d["t"], d["month"], monthly_mean_temp, monthly_sd_temp)));
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
    .attr("data-temp", (d) => z_standarize(d["t"], d["month"], monthly_mean_temp, monthly_sd_temp))
    .attr("fill",(d) => colors[parseInt(tempScale(z_standarize(d["t"], d["month"], monthly_mean_temp, monthly_sd_temp)))]);

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
    .attr("text-anchor", "middle");

  //-----------------------------------------
  // 5. TOOLTIP
  var tooltip = d3.selectAll("body")
    .append("div")
    .attr("id", "tooltip");

  d3.selectAll(".cell")
    .on("mouseover", function(d){
      tooltip
        .style("left", d3.event.pageX -margin.right + "px")
        .style("top", d3.event.pageY - margin.left + "px")
        .style("display", "inline-block")
        .html("Date: " + d["year"] + ", " + months[d["month"] - 1] + "<br>Temp: " + d3.format(".3")(d["t"]) + "<br>Deviation:" + d3.format(".3")(z_standarize(d["t"], d["month"], monthly_mean_temp, monthly_sd_temp)) + "℃");

      d3.select(this).style("stroke-width", 2)
      .style("stroke", "black");
  })
    .on("mouseout", function(d){
      tooltip.style("display", "none");
    d3.select(this).style("stroke-width", 0);
  });
});

/////////////////////////////////////////////////////////////////////////////////////////
// update on dropdownmenu change
  dropdown.on("change",function(){
      let selected = d3.selectAll("#d3-dropdown").node().value;
      d3.selectAll("svg").remove()

      d3.csv(selected).then(function(data){
        var xYears = data.map((d)=>parseInt(d["year"]));
        var yMonths = data.map((d)=>parseInt(d["month"]) -1);

        //-----------------------------------------
        // 1. TITLE & SVG
        update_paragraph_text("#description", text = "Calculated for " + d3.min(xYears) + " - " +  + d3.max(xYears))

        var svg = d3.selectAll(".container")
          .append("svg")
          .attr("height", height)
          .attr("width", width);

        //-----------------------------------------
        // 2. SCALE & AXIS
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
          .tickFormat((d, i)=> months[i])
          .tickSize(0);

        svg.append("g").call(xAxis)
          .attr("transform", "translate(0," + xTranslate + ")").attr("id", "x-axis");
        svg.append("g").call(yAxis)
          .attr("transform", "translate("+ margin.left+ ",0)")
          .attr("id", "y-axis");

          //-----------------------------------------
          // 3. HEATMAP
          // calculate mean temperature for each month over the years

          var monthly_mean_temp = calc_monthly_temp_mean(monthly_temp_arrays(data, months_unique));
          var monthly_sd_temp = calc_monthly_temp_sd(monthly_temp_arrays(data, months_unique));

          var temp = data.map((d)=>parseFloat(z_standarize(d["t"], d["month"], monthly_mean_temp, monthly_sd_temp)));
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
            .attr("data-temp", (d) => z_standarize(d["t"], d["month"], monthly_mean_temp, monthly_sd_temp))
            .attr("fill",(d) => colors[parseInt(tempScale(z_standarize(d["t"], d["month"], monthly_mean_temp, monthly_sd_temp)))]);

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
            .attr("text-anchor", "middle");

          //-----------------------------------------
          // 5. TOOLTIP
          var tooltip = d3.selectAll("body")
            .append("div")
            .attr("id", "tooltip");

          d3.selectAll(".cell")
            .on("mouseover", function(d){
              tooltip
                .style("left", d3.event.pageX -margin.right + "px")
                .style("top", d3.event.pageY - margin.left + "px")
                .style("display", "inline-block")
                .html("Date: " + d["year"] + ", " + months[d["month"] - 1] + "<br>Temp: " + d3.format(".3")(d["t"]) + "<br>Deviation:" + d3.format(".3")(z_standarize(d["t"], d["month"], monthly_mean_temp, monthly_sd_temp)) + "℃");

              d3.select(this).style("stroke-width", 2)
              .style("stroke", "black");
          })
            .on("mouseout", function(d){
              tooltip.style("display", "none");
            d3.select(this).style("stroke-width", 0);
          });

      });

  })
