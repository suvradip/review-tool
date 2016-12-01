var app = angular.module('reviewapp', ['ng-fusioncharts']);

app.controller('reviewSection', function($scope, $http){
	var getData,
		sendData,
		loadAllReviews,
		createScreenshot;

	getData = function(url, callback){
        $http({
            method: 'GET',
            dataType: 'json',
            url: url,
            headers: {
            	"Content-Type": "application/json"
            }
        }).success(callback);
    };

    sendData = function(url, data, callback){
        $http({
            method: 'POST',
            dataType: 'json',
            url: url,
            data : data,
            headers: {
            	"Content-Type": "application/json"
            }
        }).success(callback);
    };	

	$scope.posts = [];
	$scope.data =  {
        chart: {
            caption: "Harry's SuperMart",
            subCaption: "Top 5 stores in last month by revenue",
            numberPrefix: "$",
            theme: "zune"
        },
        data:[
        	{label: "Bakersfield Central", value: "880000"}, 
        	{label: "Garden Groove harbour", value: "730000"}, 
        	{label: "Los Angeles Topanga", value: "590000"}, 
        	{label: "Compton-Rancho Dom", value: "520000"}, 
        	{label: "Daly City Serramonte", value: "330000"}
        ] 
    };

  	createScreenshot = function(name){
  		var svg,
  			svgData,
  			canvas,
  			ctx,
  			svgSize,
  			img;

		svg = document.querySelector( "svg" );
		svgData = new XMLSerializer().serializeToString( svg );

		canvas = document.createElement( "canvas" );
		ctx = canvas.getContext( "2d" );
		svgSize = svg.getBoundingClientRect();
        
        canvas.width = svgSize.width;
        canvas.height = svgSize.height;

		img = document.createElement( "img" );
		img.setAttribute( "src", "data:image/svg+xml;base64," + btoa( svgData ) );

		img.onload = function() {
		    ctx.drawImage( img, 0, 0 );
		    sendData('api/create-screenshot', {data: canvas.toDataURL("image/png"), name: name}, function(){});
		};
  	};

    loadAllReviews = function(){
    	getData('api/review', function(response){
    		$scope.posts = response.map(function(ele){
    			var d = new Date(ele.time);
    			return {
    				name: ele.name,
    				avatar: ele.avatar,
    				review: ele.review,
    				time: d.toLocaleTimeString(),
    				date: d.toLocaleDateString(),
    				ssid: ele.screenshots
    			};
    		});
    	});
    };

    loadAllReviews();
    //triiger on post button-click
	$scope.postReview = function(){
		var d,
			data,
			ssid;
		d = new Date();
		ssid = 'ss'+d.getTime()+'.png';
		data = {
				name: 'anonymous', 
				review: $scope.review,
				avatar: 'avatar.png',
				ssid: ssid
			};

		//to show new posts	
		$scope.posts.push(data);
		//cleanup textare
		$scope.review = "";
		
		//this data saved to db
		data.time = d.toLocaleTimeString();
    	data.date = d.toLocaleDateString();
    	data.chartdata = FusionCharts('mychart').getJSONData();
		//create screenshots
		createScreenshot(ssid);
		//store data in database
		sendData('api/review', data, function(){});
	};
});