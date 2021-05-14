/**
 * livesample.js
 * -------------
 * This script holds the main application logic for LiveSample.
 * It manages the population data set and interacts with the histograms.
 */

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * variance: Compute the sample variance of an array of values
 * -----------------------------------------------------------
 * Computes the variance of the given array of samples using
 * the first and second moments.
 */
function variance (samples) {
  var sum = 0;
  var squares = 0;
  for(var i = 0, l = samples.length; i < l; i++){
    sum += samples[i];
    squares += samples[i] ^ 2;
  }
  // Compute first moment squared
  var squareMean = (sum / samples.length) ^ 2;
  // Compute second moment
  var secondMoment = squares / samples.length;
  // Variance is E[X^2] - E^2[X]
  return secondMoment - squareMean;
}

/**
* mean: Compute the sample mean of an array of values
* ---------------------------------------------------
* Computes the mean of the given array of values.
*/
function mean (samples) {
  var sum = 0;
  for(var i = 0, l = samples.length; i < l; i++){
    sum += samples[i];
  }
  return sum / samples.length;
}

function progressBar (percent){
  d3.select("#means-bar")
    .style("width", percent + "%")
    .attr("aria-valuenow", percent)
    .text(Math.round(percent) + "%");
}

$(document).ready(function(){
  popProperties = {
    bins: 20,
    easing: "linear"
  };
  meansProperties = {
    bins: 40,
    easing: "linear"
  };

  // Create the reference chart to view the population distribution
  popChart = new LiveHistogram("#population", popProperties);

  // Generate a skewed log-normal population
  var population = d3.range(500).map(d3.random.logNormal(0, 1));
  popChart.update(population);

  meansChart = new LiveHistogram("#means", meansProperties);

  var running = false; // Master state. If sampling is happening, the app is running.
  var animationInterval; // The animation interval is set and cleared based on RUNNING.
  var means = [ ]; // The means array holds the state of the animation so it can be resumed.
  var samplesPerMean = 30; // The number of samples in each mean
  var meanCount = 100; // The total number of means to take
  var delay = 100; // Delay in milliseconds between each mean displayed

  // Callback for when animateMeans finishes with all its tasks.
  // animateMeans will have cleared its interval already, so all this has to do
  // is clear the means array, reset the UI, and set the state to not-running.
  function runComplete(){
    running = false;
    $('#means-play-button').button('reset');
    means = [ ];
  }

  // animateMeans would take so many parameters, it is easier to make it a closure.
  function animateMeans() {
    var count = means.length;
    var animationInterval = setInterval(function(){
      if (count < meanCount){
        var sum = 0;
        for (var j = 0; j < samplesPerMean; j++){
          sum += population[getRandomInt(0, population.length)];
        }
        // Compute the mean of the samples
        means.push(sum / samplesPerMean);
        meansChart.update(means);
        // Update the sample means counter
        d3.select("#meansCounter").text(means.length); // TODO remove hardwired select
        // progressBar((count + 1) * 100 / meanCount);
        count++;
      } else {
        // If the counter has expired, dequeue future updates.
        clearInterval (animationInterval);
        // Signal that the tasks are done.
        runComplete();
      }
    }, delay); // setTimeout
    return animationInterval;
  }

  // Contruct the samples-per-mean slider
  $("#samples-per-mean-slider").slider();
  $("#samples-per-mean-slider").on("slide", function(slideEvent) {
    samplesPerMean = slideEvent.value;
    $("#samples-per-mean-slider-value").text(samplesPerMean);
  });

  // Construct the means slider
  $("#means-slider").slider();
  $("#means-slider").on("slide", function(slideEvent) {
    meanCount = slideEvent.value;
    $("#means-slider-value").text(meanCount);
  });

  // Construct the delay slider
  $("#delay-slider").slider();
  $("#delay-slider").on("slide", function(slideEvent) {
    delay = slideEvent.value;
    $("#delay-slider-value").text(delay);
  });

  // Bind events to the master play button
  $('#means-play-button').on('click', function () {
    if(running) {
      running = false;
      $(this).button('reset'); // Set button to original text
      clearInterval(animationInterval);
    } else {
      running = true;
      $(this).button('pause'); // Set button to "Pause" text
      animationInterval = animateMeans();
    }
  });

  // Bind events to the master reset button
  $('#means-reset-button').on('click', function () {
    running = false;
    clearInterval(animationInterval);
    $('#means-play-button').button('reset');
    meansChart.reset();
    d3.select("#meansCounter").text(0); // TODO remove hardwired select
    means = [ ];
    // progressBar(0);
  });
}); // $(document).ready
