// ==UserScript==
// @name       	FapFun
// @namespace   	https://greasyfork.org/scripts/7156-fapfun/code/FapFun.user.js
// @description 	Userscript for Motherless.com. Provide direct links for pictures and video files. Download all Images on one site with DownThemAll(firefox) or Download Master(Chrome).
// @require			https://ajax.googleapis.com/ajax/libs/jquery/1.7/jquery.min.js
// @include    	htt*://motherless.com*
// @version			3.3
// @grant      	GM_xmlhttpRequest
// @grant 			GM_setClipboard
// @grant			GM_setValue
// @grant			GM_getValue
// @grant			GM_deleteValue
// @grand 			UnsafeWindow
// @author			sodomgomora
// @license			GPLv3
// ==/UserScript==
// Some of this script based on Pornifier2 script by Jesscold 
// This script is realesed under GPL v3
// Globals
var debug = false;
var images = [
];
var ids = [
];
var imagesUrl = [
];
var siteurls = [
];
var thisurl = '';
// Start the magic
main();
function fapLog(log) {
  if (debug === true) {
    console.log(log);
    return;
  }
  return;
}
function main() {
  fapLog('entered main');
  // try to become Premium
  // setTimeout(function(){
  // unsafeWindow.__is_premium = true; //really motherless?
  // }, 500);
  thisurl = window.location.href;
  var inputList = document.createElement('input');
  inputList.type = 'button';
  inputList.value = 'Images URLs';
  inputList.name = 'imagesurl';
  inputList.onclick = getImageList;
  inputList.setAttribute('style', 'font-size:18px;position:fixed;top:100px;right:20px;z-index:10000;');
  document.body.appendChild(inputList);
  var inputVideo = document.createElement('input');
  inputVideo.type = 'button';
  inputVideo.value = 'Video URLs';
  inputVideo.onclick = getVideoUrl;
  inputVideo.setAttribute('style', 'font-size:18px;position:fixed;top:140px;right:20px;z-index:10000;');
  document.body.appendChild(inputVideo);
  addSinglePreview();
  checkForPaginationLinks(function (hasOne) {
    fapLog('main: haseOne= ' + hasOne);
    if (hasOne > 0) {
      var inputAllImages = document.createElement('input');
      inputAllImages.type = 'button';
      inputAllImages.value = 'Get all Images';
      inputAllImages.name = 'getallimages';
      inputAllImages.onclick = getAllImages;
      inputAllImages.setAttribute('style', 'font-size:18px;position:fixed;top:180px;right:20px;z-index:10000;');
      document.body.appendChild(inputAllImages);
    }
    return;
  });
  return;
}
function addResetButton() {
  var resetButton = document.createElement('input');
  resetButton.type = 'button';
  resetButton.value = 'Reset';
  resetButton.name = 'deletevalue';
  resetButton.onclick = deleteGMValue;
  resetButton.setAttribute('style', 'font-size:18px;position:fixed;top:220px;right:20px;z-index:10000;');
  document.body.appendChild(resetButton);
  return;
}
function checkForPaginationLinks(cb) {
  var ret = '';
  ret = $('.pagination_link').contents().text();
  fapLog('checkForPaginationLinks: entered!');
  fapLog('checkForPaginationLinks: ret= ' + ret);
  if (ret === '') {
    cb(0);
    return;
  } else {
    cb(1);
    return;
  }
}
//----- Button onclick functions -----

function deleteGMValue() {
  fapLog('deleteGMValue: thisurl= ' + thisurl);
  GM_deleteValue(thisurl);
  $('input[name*=\'deletevalue\']').remove();
}
function getAllImages() {
  var href = '';
  var lasttmp = 0;
  ids = [
  ];
  href = window.location.href;
  href = href.replace(/^(http|https):\/\//i, '');
  fapLog('getAllImages: href= ' + href);
  var url = getUrl(href);
  if (GM_getValue(url.allsites) != undefined) {
    fapLog('getAllImages: was processed earlyer!');
    addResetButton();
    displayOverlay(imagesUrl, 'lasti', url.allsites);
    thisurl = url.allsites;
    return;
  }
  thisurl = url.allsites;
  sneakyXHR(url.onesite, function (src) {
    fapLog('getAllImages: callback from sneakyXHR = ' + src);
    var urlwithoutpagenumber = url.onesite.substring(0, url.onesite.length - 1);
    $firstids = $('<div>' + src + '</div');
    $firstsite = $('<div>' + src + '</div').find('.pagination_link a');
    fapLog($firstsite);
    $firstsite.each(function () {
      var tmp = parseInt($(this).text());
      if (tmp > lasttmp) {
        lasttmp = tmp;
      }
    });
    var headers = {
      'Range': 'bytes=0-3000'
    };
    //load last paginationsite if last is realy true
    GM_xmlhttpRequest({
      method: 'get',
      'url': urlwithoutpagenumber + lasttmp,
      headers: $.extend({
      }, {
        'User-agent': 'Mozilla/4.0',
        'Accept': 'application/atom+xml,application/xml,text/xml',
        'Cookie': document.cookie
      }, headers || {
      }),
      onload: function (responseDetails) {
        var lastsitetmp = 1;
        var text = responseDetails.responseText;
        $lastsite = $('<div>' + text + '</div').find('.pagination_link a');
        fapLog($lastsite);
        $lastsite.each(function () {
          var tmp = parseInt($(this).text());
          if (tmp > lastsitetmp) {
            lastsitetmp = tmp;
          }
        });
        fapLog('getAllImages: lasttmp= ' + lasttmp + ' lastsitetmp=' + lastsitetmp);
        if (lasttmp < lastsitetmp) {
          lasttmp = lastsitetmp;
        }
        $test = $firstids.find('img[src^="http://thumbs.motherlessmedia.com/thumbs/"]');
        $test.each(function () {
          try {
            var id = $(this).attr('data-strip-src').match('thumbs/([^.]+).\\w');
          } 
          catch (err) {
            return;
          }
          ids.push(id[1]);
        });
        fapLog('getAllImages: lasttmp= ' + lasttmp);
        //paginationsite shown but has no link
        if (lasttmp == 0) {
          getImages('getallimages', ids);
          return;
        }
        var urlwithoutpagenumber = url.onesite.substring(0, url.onesite.length - 1);
        for (var i = 2; i < lasttmp + 1; i++) {
          var lenght = siteurls.push(urlwithoutpagenumber + i);
        }
        fapLog('getAllImages: siteURLs= ' + siteurls);
        parralelizeTask(siteurls, loopGetSites, 'getallimages', function () {
          getImages('getallimages', ids);
          return;
        });
      }
    });
  }, 'get', {
    'Range': 'bytes=0-3000' //grab first 3k
  });
  return;
}
function getUrl(href) {
  var url = '';
  var urlall = '';
  var parthref = '';
  var n = href.indexOf('?');
  if (n != - 1) {
    parthref = href.substring(0, n);
  } else {
    parthref = href;
  }
  fapLog('getUrl: parthref= ' + parthref);
  var casesn = parthref.indexOf('/');
  var cases = parthref.substring(casesn + 1, casesn + 2);
  fapLog('getUrl: cases= ' + cases);
  switch (cases) {
    case 'G':
      var gup = parthref.substring(casesn + 3, parthref.lenght);
      fapLog('getUrl: gup= ' + gup);
      url = 'http://motherless.com/GI' + gup + '?page=1';
      urlall = 'http://motherless.com/GI' + gup;
      break;
    case 'g':
      var g = parthref.substring(casesn + 3, parthref.lenght);
      fapLog('getUrl: g= ' + g);
      url = 'http://motherless.com/gi' + g + '?page=1';
      urlall = 'http://motherless.com/gi' + g;
      break;
    case 'u':
      var u = parthref.substring(casesn, parthref.lenght);
      fapLog('getUrl: u= ' + u);
      url = 'http://motherless.com' + u + '?t=i&page=1';
      urlall = 'http://motherless.com' + u;
      break;
  }
  return {
    onesite: url,
    allsites: urlall
};
}
function getImageList() {
fapLog('getImageList: pressed');
thisurl = window.location.href;
if (thisurl.indexOf('?') == - 1) {
  thisurl = thisurl + '?page=1';
}
if (GM_getValue(thisurl) != undefined) {
  addResetButton();
  displayOverlay(data = [
  ], 'lasti', thisurl);
  return false;
}
getImages('imagesurl', images);
return;
}
function getVideoUrl() {
alert('not jet implemented!');
return;
}
//-- handler for Overlay (jquery)

$(function () {
$('body').click(function () {
  if ($('#overlay').length > 0) {
    removeOverlay();
    return;
  }
});
return;
});
function removeOverlay() {
$('#overlay').remove();
return;
}
// Get url for full image and add url under thumbnail

function addSinglePreview() {
var data = [
];
var i = 0;
var imgs = $('img[src^="http://thumbs.motherlessmedia.com/thumbs/"]');
fapLog('image urls found: ' + imgs.length);
imgs.each(function () {
  var $wrap = $(this);
  if ($wrap.data('p2-preview')) {
    return;
  }
  $wrap.data('p2-preview', 'yep');
  var $a = $wrap.closest('a');
  var vid = $wrap.attr('src').match('thumbs/([^.]+).\\w');
  // test for video preview and not an image
  var vlink = vid[1];
  var n = vlink.indexOf('-');
  vlink = vlink.substring(n, vlink.length);
  fapLog('vlink: ' + vlink);
  // is a video
  if (vlink == '-small') {
    var videoClicky = $('<a href=\'javascript;\' class=\'p2-single-preview\'>Video URL</a>');
    $a.after(videoClicky);
    var href = $a.attr('href').match(/\.com\/(\w)(\w+)/) ? [
      RegExp.$1,
      RegExp.$2
    ] : false;
    videoClicky.click(function (e, single) {
      var $this = $currentSingle = $(this);
      $this.text('loading...');
      var id = $wrap.attr('data-strip-src').match('thumbs/([^.]+).\\w');
      var vl = id[1];
      var n = vl.indexOf('-');
      id[1] = vl.substring(0, n);
      fapLog('addSinglePreview: found url for video: ' + id[1]);
      if (!id) {
        $this.text('cant load :P');
        return;
      }
      var timer = setTimeout(function () {
        $this.text('cant load :P');
      }, 8000);
      var fs = new findSrc();
      fs.findVideoSrc(id[1], function (src) {
        $this.text('Show Video');
        clearTimeout(timer);
        if (single) {
          data = [
            src
          ];
        } else {
          data.unshift(src);
        }
        fapLog('addSinglePreview: video src: ' + src.toSource());
        displayOverlay(data, 'video');
      });
      return false;
    });
  } 
  else {
    try {
      var id = $wrap.attr('data-strip-src').match('thumbs/([^.]+).\\w');
    } 
    catch (err) {
      fapLog(err.message);
      return;
    }
    images[i] = id[1];
    i++;
    fapLog('fill images: image=' + images[i - 1] + ' index=' + i);
    var imageClicky = $('<a href=\'javascript;\' class=\'p2-single-preview\'>View full size</a>');
    $a.after(imageClicky);
    var href = $a.attr('href').match(/\.com\/(\w)(\w+)/) ? [
      RegExp.$1,
      RegExp.$2
    ] : false;
    imageClicky.click(function (e, single) {
      var $this = $currentSingle = $(this);
      $this.text('loading...');
      fapLog('found url for image: ' + id[1]);
      if (!id) {
        $this.text('cant load :P');
        return;
      }
      var timer = setTimeout(function () {
        $this.text('cant load :P');
      }, 8000);
      var fs = new findSrc();
      fs.findImgSrc(id[1], function (src) {
        $this.text('View full size');
        clearTimeout(timer);
        if (single) {
          data = [
            src
          ];
        } else {
          data.unshift(src);
        }
        fapLog('addSinglePreview: image src: ' + src.toSource());
        displayOverlay(data, 'image');
      });
      return false;
    });
  }
});
}
function getImages(buttonname, arrimg) {
fapLog('getImages: arrimg.length=' + arrimg.length);
fapLog(arrimg);
$button = $('input[name*=\'' + buttonname + '\']');
$button.val('working...');
if (arrimg.length > 0) {
  parralelizeTask(arrimg, loopFindImageSource, buttonname, function () {
    fapLog('getImages: iamgesUrl= ' + imagesUrl.toSource());
    arrimg = [
    ];
    displayOverlay(imagesUrl, 'images', thisurl);
    imagesUrl = [
    ];
    return;
  });
}
fapLog('getImages: last call for return');
arrimg = [
];
return;
}
function findSrc() {
this.findVideoSrc = function (id, cb) {
  var href = 'http://motherless.com/' + id;
  sneakyXHR(href, function (d) {
    fapLog('sneaky request all: ' + d.toSource());
    var url = d.match(/"http:([^"]+).mp4"/im) ? RegExp.$1 : null;
    if (url) {
      cb({
        url: 'http:' + url + '.mp4'
      });
    }
    return;
  }, 'get', {
    'Range': 'bytes=0-3000' //grab first 3k
  });
  return;
};
this.findImgSrc = function (id, cb) {
  var href = 'http://motherless.com/' + id + '?full';
  sneakyXHR(href, function (d) {
    var img = d.match(/property="og:image" content="([^"]+)"/im) ? RegExp.$1 : null;
    if (img) {
      cb({
        url: img
      });
    }
    return;
  }, 'get', {
    'Range': 'bytes=0-3000' //grab first 3k
  });
  return;
};
}
function sneakyXHR(url, cb, method, headers) {
method = method || 'GET';
fapLog('sneaky requesting: ' + url);
setTimeout(function () {
  GM_xmlhttpRequest({
    method: method,
    'url': url,
    headers: $.extend({
    }, {
      'User-agent': 'Mozilla/4.0',
      'Accept': 'application/atom+xml,application/xml,text/xml',
      'Cookie': document.cookie
    }, headers || {
    }),
    onload: function (responseDetails) {
      var text = responseDetails.responseText;
      cb(text, responseDetails);
    }
  });
}, 1);
return;
}
// show the full image as overlay and shrink it to screen resolution

function displayOverlay(data, type, url) {
var mywidht = window.screen.width - 50;
var myheight = window.screen.height - 120;
var html = '';
fapLog('monitor resolution: ' + mywidht + ':' + myheight);
switch (type) {
  case 'lasti':
    fapLog('displayOverlay: lasti: url= ' + url);
    html = GM_getValue(url);
    GM_setClipboard(GM_getValue(url + 'clipboard'));
    break;
  case 'image':
    html = '<table id=\'overlay\'><tbody><tr><td><img src=\'' + data[0].url + '\' style=\'width:auto; hight:100%; max-height:' + myheight + 'px; max-width:' + mywidht + 'px\'></td></tr></tbody></table>';
    break;
  case 'video':
    html = '<table id=\'overlay\'><tbody><tr><td><a href=\'' + data[0].url + '\'>Video Link</a></td></tr></tbody></table>';
    break;
  case 'images':
    var clipboard = '';
    var count = 1;
    $('input[name*=\'getallimages\']').val('Get all Images');
    $('input[name*=\'imagesurl\']').val('Images URLs');
    html = '<table id=\'overlay\'><tbody><tr><td>';
    data.forEach(function (value) {
      html += '<a class=\'changeColorLink\' href=\'' + value + '\'>link ' + count + '</a> ';
      clipboard += value + ' ';
      count++;
    });
    html += '</td></tr></tbody></table>';
    GM_setClipboard(clipboard);
    GM_setValue(url, html.toString());
    GM_setValue(url + 'clipboard', clipboard.toString());
    break;
}
fapLog('displayOverlay: type= ' + type + ': html=' + html.toSource());
setTimeout(function () {
  var $el = $(html).css({
    'position': 'fixed',
    'top': 0,
    'left': 0,
    'width': '90%',
    'height': '900px',
    'background-color': 'rgba(0,0,0,.7)',
    'z-index': 10000,
    'vertical-align': 'middle',
    'text-align': 'center',
    'color': '#fff',
    'font-size': '30px',
    'font-weight': 'bold',
    'overflow': 'hidden',
    'cursor': 'auto'
  });
  $('a.changeColorLink', $el).hover(function () {
    $(this).css('color', 'blue');
  }, function () {
    $(this).css('color', 'pink');
  });
  $el.appendTo('body');
}, 50);
return;
}
//----- PARALELLIZISE -----
//paralellize for getting all sites within pagination 

function loopGetSites(doneTask, value) {
sneakyXHR(value, function (src) {
  $firstids = $('<div>' + src + '</div');
  $test = $firstids.find('img[src^="http://thumbs.motherlessmedia.com/thumbs/"]');
  $test.each(function () {
    try {
      var id = $(this).attr('data-strip-src').match('thumbs/([^.]+).\\w');
    } 
    catch (err) {
      fapLog(err.message);
      return;
    }
    if (id[1].lastIndexOf('-strip') != - 1) {
      fapLog('loopGetSites: Falsche parameter. Enthält -strip');
      return;
    }
    ids.push(id[1]);
    return;
  });
  doneTask();
  return;
}, 'get', {
  'Range': 'bytes=0-3000' //grab first 3k);		
});
}
//function to parallelize the findImageSource function

function loopFindImageSource(doneTask, value) {
var fs = new findSrc();
fs.findImgSrc(value, function (src) {
  var i = 0;
  data = [
    src
  ];
  imagesUrl.push(data[0].url);
  doneTask();
  return;
});
return;
}
//helper function for parralelize functions

function parralelizeTask(arr, fn, buttonname, done) {
fapLog('parralelizeTask: arr= ' + arr);
var total = arr.length;
var maxtotal = total;
var counttimeout = 0;
timer = function () { 
	t = setTimeout(function () { 
   	fapLog('Timout Run, total = ' + total + ' counttimeout=' + counttimeout);
   	counttimeout++;
   	if (counttimeout >= maxtotal) {
   		fapLog('One is Hanging');
   		doneTask();
   	}	
	 	}, 15000);	
	 };
fapLog('parralelizeTask: arr.length= ' + total);
doneTask = function () {
  if (--total === 0) {
  	 clearTimeout(t);
    done();
    return;
  }
  $('input[name*=\'' + buttonname + '\']').val('processed:' + total);  
  timer();
  return;
};
arr.forEach(function (value) {
  fn(doneTask, value);
});
return;
}
