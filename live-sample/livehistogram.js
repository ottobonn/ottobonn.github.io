/**
 * LiveHistogram
 * -------------
 * LiveHistogram is a dynamic view of a histogram of a set of values.
 *
 * Parameters:
 * elementID: if supplied, the id of the svg element on which the chart is drawn
 *            if empty, LiveHistogram will generate an id
 *
 */

function LiveHistogram(id, properties) {
  if (!id)
    console.log ("Histogram must be constructed with valid container element id.");

  this.formatCount = d3.format(",.0f");
  this.bins = (properties && properties.bins) ? properties.bins : 20;
  this.transitionDuration = 100;
  this.transitionDelay = 0;
  this.transitionEasing = (properties && properties.easing) ? properties.easing : "elastic";

  this.container = d3.select(id);
  this.margin = {
    top:    10,
    right:  10,
    bottom: 50,
    left:   10
  };

  var svgWidth = parseFloat(this.container.style("width"), 10);
  var svgHeight = parseFloat(this.container.style("height"), 10);

  // Chart area width and height
  this.width = svgWidth - this.margin.left - this.margin.right;
  this.height = svgHeight - this.margin.top - this.margin.bottom;

  this.barWidth = this.width / this.bins;

  this.x = d3.scale.linear()
      .domain([-5, 5])
      .range([0, this.width]);

  this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom");

  this.svg = this.container.append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
    .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

  this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.height + ")")
      .style("z-index", 100)
      .call(this.xAxis)
    .append("text")
      .attr("x", this.width/2)
      .attr("dy", "3em")
      .style("text-anchor", "middle")
      .text("Values");
}

LiveHistogram.prototype.update = function(values) {
  // Generate a histogram using uniformly-spaced bins.
  var data = d3.layout.histogram()
      .bins(this.x.ticks(this.bins))
      (values);

  // Select all bars and join new data with existing and new elements
  var bars = this.svg.selectAll(".bar")
      .data(data);

  // Create (or recalibrate) y axis
  var y = d3.scale.linear()
    .domain([0, d3.max(data, function(d) { return d.y; })])
    .range([this.height, 0]);

  // Entry functions: run when new data are added
  var barEntry = bars.enter();

  // Bring some prototype variables into local scope for use in callbacks
  var x = this.x;
  var height = this.height;
  var barWidth = this.barWidth;
  var formatCount = this.formatCount;

  barEntryGroup = barEntry.append("g")
      .attr("class", "bar")
      .style("z-index", 0)
      .attr("transform", function(d) { return "translate(" + x(d.x) + 2 + "," + height + ")"; });

  barEntryGroup.append("rect")
      .attr("x", 1)
      .attr("width", barWidth - 3)
      .attr("height", 0);

  barEntryGroup.append("text")
      .attr("dy", ".75em")
      .attr("y", 6)
      .attr("x", barWidth / 2)
      .attr("text-anchor", "middle")
      .text(function(d) { return formatCount(0); });

  // Update functions: run on every call to update()
  d3.transition()
  .duration(this.transitionDuration)
  .ease(this.transitionEasing)
  .delay(this.transitionDelay)
  .each(function() {
        // Translate groups (move the top-left corners of bars)
        bars.transition()
            .attr("transform", function(d) {return "translate(" + x(d.x) + "," + y(d.y) + ")";});

        // Update the heights of the rectangles
        bars.select("rect").transition()
            .attr("height", function(d) { return height - y(d.y); });

        // Display new labels
        bars.select("text")
          .text(function(d) { return d.y > 0 ? formatCount(d.y) : ""; });
      });

  // Exit functions: run when data are deleted
  // Remove unused bars
  bars.exit().remove();
}

LiveHistogram.prototype.reset = function(){
  var values = [ ];
  this.update(values);
}
