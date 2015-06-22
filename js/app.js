var ANIMATE_DELAY = 400;
var tour_indexes = []

// Full list of configuration options available here:
// https://github.com/hakimel/reveal.js#configuration
Reveal.initialize({
    controls: false,
    progress: true,
    history: true,
    overview: false,
    loop: true,
    transition: 'linear'
});

Reveal.addEventListener('slidechanged', function(event) {
    animateContent(event);
    if(event.indexh > 0) { 
        // checktimeline();
    } else{
        // $('#timeline ul li a').removeClass('selected');
    }
});

$(window).resize(function() {
  $(Reveal.getCurrentSlide()).find('.content').css('top',document.body.clientHeight / 2 - ($(Reveal.getCurrentSlide()).find('.content').height() / 2));
});

// Initialize background map and create cartodb layers
var map = L.map('map', {zoomControl:false}).setView([51.998410382390325, -1.38427734375], 6);
// createCartodbLayers();

// Add needed slides with their contents
$.ajax({
  // url: "http://saleiva.cartodb.com/api/v2/sql?q=select%20cdb_id,%20tour_length,%20shortname,%20year,%20description%20from%20rolling_stones_tours%20order%20by%20first_concert_date%20asc"
  url: "data.json"
})
.done(function (data) {
    try{
       data = JSON.parse(data);
    }catch(err){}
    for(var i in data.rows){
        var nextSlide = parseInt(i)+1;
        var tourL = parseInt(data.rows[i].tour_length).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        $('.slides').append('<section class="tour">'+
                '<div class="content">'+
                    '<h2 class="title">'+data.rows[i].title+'</h2>'+
                    '<h2 class="shortname" data-recordid="'+parseInt(data.rows[i].slideId,10)+'">'+data.rows[i].shortname+'</h2>'+
                    '<h2 class="description">'+data.rows[i].description+'</h2>'+
                    '<p class="slide-number">'+nextSlide+'</p>'+
                '</div>'+
                '<div class="nextButton"><a href="#" actual-slide="'+nextSlide+'"> </a></div>'+
            '</section>'
        );
        tour_indexes.push(parseInt(data.rows[i].slideId,10));
    }
});

// Binds event to the next buttons on each slide
$('.nextButton a').live('click', function(e){
    var goto = parseInt($(e.target).attr('actual-slide')) + 1;
    Reveal.slide(goto,0)
    e.preventDefault();
    return false;
});

if (false) {
  //Creates the timeline
  $.ajax({
    url: "http://saleiva.cartodb.com/api/v2/sql?q=SELECT%20MIN(cdb_id)%20as%20tour_id,year%20FROM%20rolling_stones_tours%20GROUP%20BY%20year%20ORDER%20BY%20year%20ASC",
  })
  .done(function (data){
  	try{
  	   data = JSON.parse(data);
  	}catch(err){}
  	$('#timeline ul').append('<li><span id="firstYear">'+data.rows[0].title+'</span></li>');
  	for(var i in data.rows){
  		$('#timeline ul').append('<li>'+
  				'<a href="#" year-data="'+parseInt(data.rows[i].year)+'" go-to-data="'+parseInt(data.rows[i].tour_id,10)+'"> </a>'+
  			'</li>'
  		);
  	};
  	$('#timeline ul').append('<li><span id="lastYear">'+data.rows[data.rows.length-1].year+'</span></li>');
  });

  $('#timeline ul li a').live('click', function(e){
      var goto = parseInt($(e.target).attr('go-to-data'));
      Reveal.slide(searchTour(goto),0)
      e.preventDefault();
      return false;
  });

  $('#timeline ul li a').live('mouseover', function(e){
      
  	//TODO: REMOVE HARDCODED NUMBERS 
      if($(e.target).is($('#timeline ul li:nth-child(2) a'))){
      	$('#timeline ul li span#firstYear').addClass('selected');
      }else if($(e.target).is($('#timeline ul li:nth-child(22) a'))){
  		$('#timeline ul li span#lastYear').addClass('selected');
      }else{
  	    var _year = $(e.target).attr('year-data');
  	    $('#pointTT > p.name').text(_year);
  	    $('#pointTT > p.date').text('');
  	    $('#pointTT').show();
  	    $('#pointTT').css({
  	        'left':($(e.target).offset().left + 5 - $('#pointTT').width()/2)+'px',
  	        'top':($(e.target).offset().top - 34) + 'px'
  	    });
  	}
      e.preventDefault();
      return false;
  });

  //TODO: REMOVE HARDCODED DATES
  $('#timeline ul li a').live('mouseout', function(e){
      $('#pointTT').hide();
      if(window.selectedYear != '1963'){
      	$('#timeline ul li span:contains(1963)').removeClass('selected');
      }
      if(window.selectedYear != '2005'){
      	$('#timeline ul li span:contains(2005)').removeClass('selected');
      }
      e.preventDefault();
      return false;

  });

}

// Animate and position the content when loading a new slide
function animateContent(event){
    $(event.currentSlide).find('.content').css('top',document.body.clientHeight / 2 - ($(event.currentSlide).find('.content').height() / 2));
    if((event.indexh) > 0){
        $(event.currentSlide).find('.content').delay(ANIMATE_DELAY).animate({opacity: 1}, 1000);
        $(event.currentSlide).find('.nextButton').delay(ANIMATE_DELAY).animate({opacity: 1}, 1000);
    }else{
        $(event.currentSlide).find('.nextButton').delay(ANIMATE_DELAY).animate({opacity: 1}, 1000);
    }
    $(event.previousSlide).find('.content').delay(ANIMATE_DELAY*2).animate({opacity: 0}, 100);
    $(event.previousSlide).find('.nextButton').delay(ANIMATE_DELAY*2).animate({opacity: 0}, 100);
}

function XXXupdateMap(){
    var tour_id = $('section.present > .content > .title').attr('tour-id');
    var sql = new cartodb.SQL({user: 'saleiva'});
    window.pointsLayer.setSQL("SELECT *, date as date_proc, ST_asGeoJson(the_geom) as geom FROM rolling_stones WHERE tour_id="+tour_id);
    window.linesLayer.setSQL('SELECT * FROM rolling_stones_tours WHERE cdb_id='+tour_id);

    sql.getBounds('SELECT * FROM rolling_stones_tours WHERE cdb_id={{id}}', { 
        id: tour_id 
    })
    .done(function(data) {
        var p0 = new L.LatLng(data[0][0],data[0][1]);
        var p1 = new L.LatLng(data[1][0],data[1][1]);
        var bb = new L.LatLngBounds(p0,p1);
        map.fitBounds(bb);
    })
    .error(function(errors) {
        console.log("error:" + err);
    })
}

function searchTour(id){
    for(i in tour_indexes){
        if(tour_indexes[i] == id){
            return (parseInt(i)+1);
        }
    }
}

function XXchecktimeline(){
    var _year = $("section.present > .content > .year").text();
    if(window.selectedYear != _year || !window.selectedYear){
    	window.selectedYear = _year;
        $('#timeline ul li a').removeClass('selected');
        $('#timeline ul li span').removeClass('selected');
        $('#timeline ul li a[year-data="'+_year+'"]').addClass('selected'); 
        $('#timeline ul li span:contains("'+window.selectedYear+'")').addClass('selected');
    }
}
