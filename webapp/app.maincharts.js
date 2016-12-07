var app = angular.module('mainchart', []);

app.controller('mainchartctrl', function($scope, $http){
	var getData,
		sendData,
		loadAllReviews,
		createScreenshot,
        chartref;

	$scope.posts = [];
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
		    sendData($scope.site_root+'api/create-screenshot', {data: canvas.toDataURL("image/png"), name: name}, function(){});
		};
  	};

    $scope.loadAllReviews = function(obj){
        
        $scope.site_root = obj.site_root;
    	getData($scope.site_root+'api/review/'+obj.susername, function(response){
           
            if(response.success && typeof response.result !== 'undefined'){
        		$scope.posts = response.result.reviews.map(function(ele){
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
            }    
    	});
    };

    //triiger on post button-click
	$scope.postReview = function(){
		var d,
			data,
			ssid;
		d = new Date();
        ssid = 'ss'+d.getTime()+'.png';
        chartref = FusionCharts('chartobject-1');
        //this data saved to db
        data = {
                review: $scope.review,
                ssid: ssid,
                chartinfo : {
                    type: chartref.chartType(),
                    width: chartref.width,
                    height: chartref.height,
                    datasource : chartref.getJSONData(),
                    build: 'xx-xx'
                }
            };    
        

		//create screenshots
		createScreenshot(ssid);
		//store data in database
		sendData($scope.site_root+'api/review', data, function(response){
            //to show new posts 
            $scope.posts.push(response.obj);
            //cleanup textare
            $scope.review = "";
        });
	};
});