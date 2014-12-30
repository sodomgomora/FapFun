// ==UserScript==
// @name        FapFun
// @namespace   https://greasyfork.org/scripts/7156-fapfun/code/FapFun.user.js
// @description Userscript for Motherless.com . Provide direct links for pictures and video files.
// @require		https://ajax.googleapis.com/ajax/libs/jquery/1.7/jquery.min.js
// @include     htt*://motherless.com*
// @version     3
// @grant       GM_xmlhttpRequest
// @grant 		GM_setClipboard
// @grand 		UnsafeWindow
// @author		sodomgomora
// ==/UserScript==

// Some of this script based on Pornifier2 script by Jesscold 
// This script is realesed under GPL v3

// Globals
var debug = false;
var images = [];
var ids = [];
var imagesUrl = [];
var siteurls = [];

// Start the magic
main();

function fapLog(log){
	if(debug === true){
		console.log(log);
		return;
	}
	return;
}

function main(){
	fapLog("entered main");
	// try to become Premium
	setTimeout(function(){
		unsafeWindow.__is_premium = true; //really motherless?
	}, 500);
	
	// create Buttons
	var inputList=document.createElement("input");
	inputList.type="button";
	inputList.value="Images URLs";
	inputList.name="imagesurl";
	inputList.onclick = getImageList;
	inputList.setAttribute("style","font-size:18px;position:fixed;top:100px;right:20px;z-index:10000;");
	document.body.appendChild(inputList);
	
	var inputVideo=document.createElement("input");	
	inputVideo.type="button";
	inputVideo.value="Video URLs";
	inputVideo.onclick = getVideoUrl;
	inputVideo.setAttribute("style","font-size:18px;position:fixed;top:140px;right:20px;z-index:10000;");
	document.body.appendChild(inputVideo);

	addSinglePreview();
	
	checkForPaginationLinks(function(hasOne){
		fapLog("main: haseOne= " + hasOne);
		if(hasOne > 0){
			var inputAllImages=document.createElement("input");	
			inputAllImages.type="button";
			inputAllImages.value="Get all Images";
			inputAllImages.name="getallimages";
			inputAllImages.onclick = getAllImages;
			inputAllImages.setAttribute("style","font-size:18px;position:fixed;top:180px;right:20px;z-index:10000;");
			document.body.appendChild(inputAllImages);
		}
		return;
	});
	return;
}

function checkForPaginationLinks(cb) {
	var ret="";
	ret = $(".pagination_link").contents().text();
	fapLog("checkForPaginationLinks: entered!");
	fapLog("checkForPaginationLinks: ret= " + ret);
	if (ret === ""){
		cb(0);
		return;
	} else {
		cb(1);
		return;
	}
}

//----- Button onclick functions -----

function getAllImages(){	
	var last = 0;
	var href = "";
	var testforlast = function(){
		$(".pagination_link").contents().each(function(){
			fapLog("getAllImages: elemets= " + $(this).text());
			var tmp = parseInt($(this).text());
			href=$(this).attr("href");
			if (tmp > last){
				last=tmp;
			}
			return;
		});
		return;
	}
	testforlast();
	// pagination link is shown but most like only one site then href is undefined
	if (href == undefined){
		getImageList();
		return;
	};
	fapLog("getAllImages: last= " + last + " href= " + href);	
	$button = $("input[name*='getallimages']").val("getting pages(1)");
	var n = href.indexOf("?");
	var lasttmp = 0;
	var parthref = href.substring(0,n);
	fapLog("getAllImages: parthref= " + parthref);
	var url = "http://motherless.com" + parthref + "?page=1&t=i";
	sneakyXHR(url, function(src){
		fapLog("getAllImages: callback from sneakyXHR = " + src);
		
		$firstids = $("<div>"+src+"</div");
		$firstsite = $("<div>"+src+"</div").find(".pagination_link a");
		fapLog($firstsite);
		$firstsite.each(function(){
			var tmp = parseInt($(this).text());
			if (tmp > lasttmp){
			lasttmp=tmp;
			}
		});
		$test=$firstids.find('img[src^="http://thumbs.motherlessmedia.com/thumbs/"]');
		$test.each(function(){
			try{
				var id = $(this).attr("data-strip-src").match("thumbs/([^.]+).\\w");
			}
			catch(err){
				return;
			}
			ids.push(id[1]);
		});	
		fapLog("getAllImages 2: lasttmp= " + lasttmp);
		for (var i=2;i<lasttmp+1;i++){			
			var lenght = siteurls.push("http://motherless.com" + parthref + "?page=" + i + "&t=i");
			fapLog(length);
		}
		fapLog("getImages: siteURLs= " + siteurls);
		parralelizeTask(siteurls, loopGetSites, function(){
			$button.val("getting pages("+lasttmp+")");
			getImages("getallimages", ids);
			return;
		});
	}, "get", {
			'Range': 'bytes=0-3000' //grab first 3k
	});
	return;
}

function getImageList(){
	fapLog("getImageList: pressed");
	getImages("imagesurl", images);
	return;
}

function getVideoUrl(){
	alert("not jet implemented!");
	return;
}

//-- handler for Overlay (jquery)
$(function () {
    $("body").click(function () {
        if ($("#overlay").length > 0) {
            removeOverlay();
        }
    });
});

function removeOverlay() {
    $("#overlay").remove();
	return;
}

// Get url for full image and add url under thumbnail
function addSinglePreview(){
	var data = [];
	var i = 0;
	var imgs = $('img[src^="http://thumbs.motherlessmedia.com/thumbs/"]');
	fapLog("image urls found: " + imgs.length);
	imgs.each(function(){
		var $wrap = $(this);
		if($wrap.data('p2-preview')){
			return;
		}
		$wrap.data('p2-preview', 'yep');
		var $a = $wrap.closest("a");
		var vid = $wrap.attr("src").match("thumbs/([^.]+).\\w");
		// test for video preview and not an image
		var vlink = vid[1];
		var n = vlink.indexOf("-");
		vlink = vlink.substring(n,vlink.length);
	
		fapLog("vlink: " + vlink);
		
		// is a video
		if(vlink == "-small"){
			var videoClicky = $("<a href='javascript;' class='p2-single-preview'>Video URL</a>");
			$a.after(videoClicky);
			var href = $a.attr('href').match(/\.com\/(\w)(\w+)/) ? [RegExp.$1, RegExp.$2] : false;
			videoClicky.click(function(e, single){
				var $this = $currentSingle = $(this);
				$this.text("loading...");
				var id = $wrap.attr("data-strip-src").match("thumbs/([^.]+).\\w");
				var vl = id[1];
				var n = vl.indexOf("-");
				id[1] = vl.substring(0,n);
				
				fapLog("addSinglePreview: found url for video: " + id[1]);
								
				if(!id){
					$this.text("cant load :P");
					return;
				}
				var timer = setTimeout(function(){
					$this.text("cant load :P");
				}, 8000);
				var fs = new findSrc();
				fs.findVideoSrc(id[1], function(src){
					$this.text("Show Video");
					clearTimeout(timer);
					if(single){
						data = [src];
					} else {
						data.unshift(src);
					}
					fapLog("addSinglePreview: video src: " + src.toSource());
					
					displayOverlay(data, "video");
				});
				return false;
			});
		}
		else{
			try{
				var id = $wrap.attr("data-strip-src").match("thumbs/([^.]+).\\w");
			}
			catch(err){
				fapLog(err.message);
				return;
			}
			images[i] = id[1];
			i++;
			fapLog("fill images: image=" + images[i-1] + " index=" + i);
			var imageClicky = $("<a href='javascript;' class='p2-single-preview'>View full size</a>");
			$a.after(imageClicky);
			var href = $a.attr('href').match(/\.com\/(\w)(\w+)/) ? [RegExp.$1, RegExp.$2] : false;
			imageClicky.click(function(e, single){
				var $this = $currentSingle = $(this);
				$this.text("loading...");				
				fapLog("found url for image: " + id[1]);							
				if(!id){
					$this.text("cant load :P");
					return;
				}
				var timer = setTimeout(function(){
					$this.text("cant load :P");
				}, 8000);
				var fs = new findSrc();
				fs.findImgSrc(id[1], function(src){
					$this.text("View full size");
					clearTimeout(timer);
					if(single){
						data = [src];
					} else {
						data.unshift(src);
					}
					fapLog("addSinglePreview: image src: " + src.toSource());
					
					displayOverlay(data, "image");
				});
				return false;
			});
		}	
	});
}

function getImages(buttonname, arrimg) {
	fapLog("getImages: arrimg.length=" + arrimg.length);
	fapLog(arrimg);
	$button = $("input[name*='"+buttonname+"']");
	var oldbuttonvalue = $button.val();
	fapLog("getImages: oldbuttonvalue= " + oldbuttonvalue);
	$button.val("working...");
	if(arrimg.length > 0){
		parralelizeTask(arrimg, loopFindImageSource, function(){
			fapLog("getImages: iamgesUrl= " + imagesUrl.toSource());
			$button.val(oldbuttonvalue);
			displayOverlay(imagesUrl, "images");
			return;
		});
	}
	return;
}

function findSrc(){
	this.findVideoSrc = function(id, cb) {
		var href = "http://motherless.com/"+id;
		sneakyXHR(href, function(d){
			fapLog("sneaky request all: " + d.toSource());
			
			var url = d.match(/"http:([^"]+).mp4"/mi) ? RegExp.$1 : null;
			if(url){
				cb({url:"http:" + url + ".mp4"});
			}
			return;
		}, "get", {
			'Range': 'bytes=0-3000' //grab first 3k
		});
		return;
	};
	
	this.findImgSrc = function(id, cb){
		var href = "http://motherless.com/"+id+"?full";
		sneakyXHR(href, function(d){
			var img = d.match(/property="og:image" content="([^"]+)"/mi) ? RegExp.$1 : null;
			if(img){
				cb({url:img});
			}
			return;
		}, "get", {
			'Range': 'bytes=0-3000' //grab first 3k
		});
		return;
	};	
}

function sneakyXHR(url, cb, method, headers) {
    method = method || "GET";	
	fapLog("sneaky requesting: " + url);	
    setTimeout(function() {
        GM_xmlhttpRequest({
            method: method,
            'url': url,
            headers: $.extend({}, {
                'User-agent': 'Mozilla/4.0',
                'Accept': 'application/atom+xml,application/xml,text/xml',
                'Cookie': document.cookie
            }, headers || {}),
            onload: function(responseDetails) {
                var text = responseDetails.responseText;
                cb(text, responseDetails);
            }
        });
    }, 1);
	return;
}

// show the full image as overlay and shrink it to screen resolution
function displayOverlay(data, type) {
	var mywidht = window.screen.width - 50;
	var myheight = window.screen.height - 120;
	var html = "";
	
	fapLog("monitor resolution: " + mywidht + ":" + myheight);
	
	if (type=="image"){
		html="<table id='overlay'><tbody><tr><td><img src='" + data[0].url + "' style='width:auto; hight:100%; max-height:" + myheight +"px; max-width:" + mywidht + "px'></td></tr></tbody></table>";
	}
	if (type=="video"){
		html="<a id='overlay' href='" + data[0].url + "'>Video Link</a>";
	}
	if (type=="images"){
		html = "<table id='overlay'><tbody><tr><td>";
		var clipboard = "";
		data.forEach(function(value){
			html += value + "<br>";
			clipboard += value + " ";
		});
		html += "</td></tr></tbody></table>";
		GM_setClipboard(clipboard);
		
	}
	if (type=="videos"){
		
	}
    $(html).css({
        "position": "fixed",
        "top": 0,
        "left": 0,
        "width": "90%",
        "height": "900px",
        "background-color": "rgba(0,0,0,.5)",
        "z-index": 10000,
        "vertical-align": "middle",
        "text-align": "center",
        "color": "#fff",
        "font-size": "30px",
        "font-weight": "bold",
		"overflow": "hidden",
        "cursor": "auto"
    }).appendTo("body");
	return;
}

//----- PARALELLIZISE -----

//paralelliiese for getting all sites within pagination 
function loopGetSites(doneTask, value){
	sneakyXHR(value, function(src){
		$firstids = $("<div>"+src+"</div");
		$test=$firstids.find('img[src^="http://thumbs.motherlessmedia.com/thumbs/"]');
		$test.each(function(){
			try{
				var id = $(this).attr("data-strip-src").match("thumbs/([^.]+).\\w");
			}
			catch(err){
				fapLog(err.message);
				return;
			}
			ids.push(id[1]);
		});
		doneTask();
		return;
	}, "get", {
			'Range': 'bytes=0-3000' //grab first 3k);		
	});
}
//function to parallelize the findImageSource function
function loopFindImageSource(doneTask, value) {
	var fs = new findSrc();
	fs.findImgSrc(value, function(src){
		data = [src];
		imagesUrl.push(data[0].url);
		doneTask();
		return;
	});
	return;
}

//helper function for parralelize functions
function parralelizeTask(arr, fn, done) {
	fapLog("parralelizeTask: arr= " + arr);
	var total = arr.length;
	fapLog("parralelizeTask: arr.length= " + total);
	doneTask = function(){
		if (--total === 0){
			done();
			return;
		}
		return;
	};
	arr.forEach(function(value){
		fapLog("parralelizeTask: arr.elements= " + value);
		fn(doneTask, value);
	});
	return;
}